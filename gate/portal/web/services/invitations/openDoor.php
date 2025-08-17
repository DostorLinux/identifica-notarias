<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

$con = new SimpleDb();

$invitationId = getParameter('invitationId');

if (empty($invitationId)) {
    portal_abort('MANDATORY', 'invitationId');
}

// Verificar estado de invitados y obtener información necesaria

$sql = "SELECT 
            wi.id as invitation_id,
            wi.status as invitation_status,
            wi.device_id as deviceId,
              wi.init as init_time,
            wiv.user_id as user_id,
            wiv.id as invited_id,
            wiv.status as invited_status,
            wiv.lat,
            wiv.lng
        FROM worker_invitation wi
        LEFT JOIN worker_invited wiv ON wi.id = wiv.worker_invitation_id
        WHERE wi.id = ? and wi.status != 'USED'";

$invitees = $con->get_array($sql, array($invitationId));

// Calcular totales después de obtener los resultados
if (!empty($invitees)) {
    $total_invited = count($invitees);
    $validated_count = array_reduce($invitees, function($carry, $item) {
        return $carry + ($item['invited_status'] === 'VALIDATED' ? 1 : 0);
    }, 0);

    $deviceId = $invitees[0]['deviceId'];
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invitación no encontrada'
    ]);
    exit;
}
// Verificar si hay invitados
if ($total_invited == 0) {
    echo json_encode(array(
        'success' => false,
        'message' => 'No hay invitados registrados para esta invitación'
    ));
    exit;
}

// Verificar si todos están validados
if ($validated_count != $total_invited) {
    echo json_encode(array(
        'success' => false,
        'message' => 'No todos los invitados están validados',
        'validated' => $validated_count,
        'total' => $total_invited
    ));
    exit;
}


// Check if the current time is within 30 minutes of init time
if (!empty($invitees)) {
    $init_time = strtotime($invitees[0]['init_time']);
    $current_time = time();
    $time_difference = abs($current_time - $init_time) / 60; // Convert to minutes, using abs() for absolute value

    if ($time_difference >= 30) {
        echo json_encode([
            'success' => false,
            'message' => 'La invitación solo puede usarse 30 minutos antes o después de la hora programada.'
        ]);
        exit;
    }
}




try {
    $con->begin();
    $events = array();
    $current_time = time();

    // Actualizar estado de la invitación
    $update_invitation = "UPDATE worker_invitation 
                         SET status = 'USED' 
                         WHERE id = ?";
    $con->execute($update_invitation, array($invitationId));

    // Actualizar estado de invitados y crear eventos
    foreach ($invitees as $invitee) {
        // Actualizar estado del invitado
        $update_invited = "UPDATE worker_invited 
                          SET status = 'ENTER',
                              enter_time = NOW() 
                          WHERE id = ?";
        $con->execute($update_invited, array($invitee['invited_id']));

        // Crear evento para cada invitado
        $text_to_hash = "{$invitee['user_id']}ENTER{$deviceId}{$current_time}";
        $hash = hash('sha256', $text_to_hash);

        $sql = 'INSERT INTO event (
                    userId, 
                    entry, 
                    deviceId, 
                    lat, 
                    lng, 
                    plate, 
                    warning, 
                    hash, 
                    created,
                    is_carpool,
                    carpool_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

        $con->execute($sql, array(
            $invitee['user_id'],  // userId
            'enter',                 // entry
            $deviceId,               // deviceId de worker_invitation
            $invitee['lat'],         // lat de worker_invited
            $invitee['lng'],         // lng de worker_invited
            null,                    // plate
            null,                    // warning
            $hash,                   // hash
            $current_time,           // created
            0,                       // is_carpool
            null                     // carpool_id
        ));

        $events[] = array(
            'id' => $con->get_last_id(),
            'timestamp' => $current_time,
            'invited_id' => $invitee['invited_id']
        );
    }

    // Actualizar último acceso del dispositivo si existe
    if ($deviceId !== null) {
        $sql = 'UPDATE device SET last_access = NOW() WHERE id = ?';
        $con->execute($sql, array($deviceId));
    }
    $con->commit();
    echo json_encode(array(
        'success' => true,
        'message' => 'Puerta abierta exitosamente',
        'data' => array(
            'invitation_id' => $invitationId,
            'total_people' => $total_invited,
            'timestamp' => date('Y-m-d H:i:s'),
            'events' => $events
        )
    ));

} catch (Exception $e) {
    $con->rollback();
    echo json_encode(array(
        'success' => false,
        'message' => 'Error al procesar la apertura: ' . $e->getMessage()
    ));
}
?>
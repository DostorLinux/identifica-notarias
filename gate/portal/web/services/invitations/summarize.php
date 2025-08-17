<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

$con = new SimpleDb();

$qr_code = getParameter('qr');

if (empty($qr_code)) {
    portal_abort('MANDATORY', 'qr');
}

// Consulta para obtener la invitación específica y sus invitados basado en el QR
$sql = "SELECT 
            wi.id as invitation_id,
            wi.company,
            wi.description as event_description,
            wi.init as event_start,
            wi.end as event_end,
            wi.event_duration,
            wi.status as invitation_status,
            wi.worker_id,
            wiv2.id as invited_id,
            wiv2.name as invited_name,
            wiv2.email as invited_email,
            wiv2.enter_time as invited_enter_time,
            wiv2.exit_time as invited_exit_time,
            wiv2.qr_code,
            wiv2.status as invited_status,
            u.first_name as host_first_name,
            u.last_name as host_last_name,
            u.email as host_email
        FROM worker_invited wiv
        INNER JOIN worker_invitation wi ON wi.id = wiv.worker_invitation_id
        LEFT JOIN worker_invited wiv2 ON wiv2.worker_invitation_id = wi.id
        LEFT JOIN user u ON u.id = wi.worker_id
        WHERE wiv.qr_code = ?";

$invitations = $con->get_array($sql, array($qr_code));

if (!$invitations || empty($invitations)) {
    echo json_encode(array(
        'success' => false,
        'message' => 'Invitación no encontrada o código QR inválido'
    ));
    exit;
}

// Procesar los resultados
$first_row = $invitations[0];
$invitation_data = array(
    'event' => array(
        'id' => $first_row['invitation_id'],
        'company' => $first_row['company'],
        'description' => $first_row['event_description'],
        'start_time' => $first_row['event_start'],
        'end_time' => $first_row['event_end'],
        'duration_minutes' => $first_row['event_duration'],
        'status' => $first_row['invitation_status']
    ),
    'host' => array(
        'name' => $first_row['host_first_name'] . ' ' . $first_row['host_last_name'],
        'email' => $first_row['host_email']
    ),
    'invited_people' => array()
);

// Agregar los invitados
foreach ($invitations as $row) {
    if ($row['invited_id']) {
        $invitation_data['invited_people'][] = array(
            'id' => $row['invited_id'],
            'name' => $row['invited_name'],
            'email' => $row['invited_email'],
            'enter_time' => $row['invited_enter_time'],
            'exit_time' => $row['invited_exit_time'],
            'qr_code' => $row['qr_code'],
            'status' => $row['invited_status']
        );
    }
}

// Determinar la acción basada en el estado de los invitados
$all_validated = true;
$all_entered = true;
$some_validated = false;
$total_invitees = count($invitation_data['invited_people']);

if ($total_invitees === 0) {
    $invitation_data['action'] = 'NO_INVITEES';
} else {
    foreach ($invitation_data['invited_people'] as $invited) {
        if ($invited['status'] === 'VALIDATED') {
            $some_validated = true;
        } else {
            $all_validated = false;
        }

        if ($invited['status'] === 'ENTER') {
            $some_validated = true;
        } else {
            $all_entered = false;
        }
    }

    // Determinar la acción
    if ($all_entered) {
        $invitation_data['action'] = 'USED';
    } elseif ($all_validated) {
        $invitation_data['action'] = 'OPEN';
    } elseif ($some_validated) {
        $invitation_data['action'] = 'WAITING';
    } else {
        $invitation_data['action'] = 'PENDING';
    }
}

$result = array(
    'success' => true,
    'data' => $invitation_data
);
echo json_encode($result);
?>
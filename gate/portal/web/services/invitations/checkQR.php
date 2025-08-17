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

// Consulta para obtener detalles del invitado y la invitación
$sql = "SELECT 
            wi.id as invitation_id,
            wi.company,
            wi.description as event_description,
            wi.init as event_start,
            wi.end as event_end,
            wi.event_duration,
            wi.status as status,
            wiv.id as invited_id,
            wiv.name as invited_name,
            wiv.email as invited_email,
            wiv.enter_time as invited_enter_time,     
            TIMESTAMPDIFF(MINUTE, wiv.enter_time, NOW()) as access_time,
            wiv.exit_time as invited_exit_time,
            wiv.qr_code,
            wiv.img as image,
            wiv.status as invited_status,
            u.first_name as host_first_name,
            u.last_name as host_last_name,
            u.email as host_email
        FROM worker_invited wiv
        INNER JOIN worker_invitation wi ON wi.id = wiv.worker_invitation_id
        LEFT JOIN user u ON u.id = wi.worker_id
        WHERE wiv.qr_code = ?";

$invitation = $con->get_row($sql, array($qr_code));

if (!$invitation) {
    echo json_encode(array(
        'success' => false,
        'message' => 'Invitación no encontrada o código QR inválido'
    ));
    exit;
}
// Formatear la respuesta
$result = array(
    'success' => true,
    'data' => array(
        'event' => array(
            'id' => $invitation['invitation_id'],
            'company' => $invitation['company'],
            'description' => $invitation['event_description'],
            'start_time' => $invitation['event_start'],
            'end_time' => $invitation['event_end'],
            'duration_minutes' => $invitation['event_duration'],
            'status' => $invitation['status']
        ),
        'invited_person' => array(
            'id' => $invitation['invited_id'],
            'name' => $invitation['invited_name'],
            'email' => $invitation['invited_email'],
            'enter_time' => $invitation['invited_enter_time'],
            //Time from access
            'exit_time' => $invitation['invited_exit_time'],
            'qr_code' => $invitation['qr_code'],
            'invited_status'=>$invitation['invited_status'],
            'photo' => $invitation['image']
        ),
        'host' => array(
            'name' => $invitation['host_first_name'] . ' ' . $invitation['host_last_name'],
            'email' => $invitation['host_email']
        ),
        'access_allowed' => $invitation['status'] === 'activo'
    )
);

// Agregar mensaje de acceso basado en el estado
switch ($invitation['invited_status']) {
    case 'PENDING':
        $result['access_message'] = 'Acceso denegado';
        $result['access_allowed'] = false;
        $result['detail']= 'Persona aún no marca su entrada';
        $result['access_time']= 'No ha marcado su entrada';
        break;
    case 'WAITING':
        $result['access_message'] = 'Acceso denegado';
        $result['access_allowed'] = false;
        $result['detail']= 'Aún no han marcado la entrada todos los invitados';
        $result['access_time']= 'No ha marcado su entrada';
        break;
    case 'ENTER':
        $result['access_message'] = 'Acceso permitido';
        $result['access_allowed'] = true;
        $result['detail']= 'Acceso permitido';
        //Time from the access

        break;
}

echo json_encode($result);
?>
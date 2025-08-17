<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';


$con = new SimpleDb();

$qr_code = sanitize(getParameter('qr'));

if(empty($qr_code)) {
    echo json_encode(array(
        'success' => false,
        'message' => 'Código QR requerido'
    ));
    exit;
}

$sql = "SELECT 
    wi.id as invitation_id,
    wi.company,
    wi.description as event_description,
    wi.init as event_start,
    wi.end as event_end,
    wi.event_duration,
    wi.status as invitation_status,

    wiv.id as invited_id,
    wiv.name as invited_name,
    wiv.email as invited_email,
    wiv.enter_time as invited_enter_time,        
    wiv.exit_time as invited_exit_time,
    wiv.qr_code,
    wiv.status as invited_status,
    TIMESTAMPDIFF(MINUTE, wiv.enter_time, NOW()) as access_time,

    d.id as device_id,
    d.name as device_name,
    d.placeId as device_place_id,
    d.hasDependency as device_has_dependency,
    d.hasPlate as device_has_plate,
    d.dependencyId as device_dependency_id,
    d.maxMinutes as device_max_minutes,
    d.lat as device_latitude,
    d.lng as device_longitude,
    d.radio as device_radio,
    d.last_access as device_last_access,
    u.first_name as host_first_name,
    u.last_name as host_last_name,
    u.email as host_email
FROM worker_invited wiv
INNER JOIN worker_invitation wi ON wi.id = wiv.worker_invitation_id
LEFT JOIN user u ON u.id = wi.worker_id
LEFT JOIN device d ON d.id = wi.device_id
WHERE wiv.qr_code = ?
";

try {
    $con = new SimpleDb();
    $invitation = $con->get_row($sql, array($qr_code));

    if (!$invitation) {
        portal_abort("Invitación no encontrada");
    }

    $result = array(
        'invitation' => array(
            'id' => $invitation['invitation_id'],
            'company' => $invitation['company'],
            'description' => $invitation['event_description'],
            'start_time' => $invitation['event_start'],
            'end_time' => $invitation['event_end'],
            'duration' => $invitation['event_duration'],
            'status' => $invitation['invitation_status']
        ),
        'invited' => array(
            'id' => $invitation['invited_id'],
            'name' => $invitation['invited_name'],
            'email' => $invitation['invited_email'],
            'enter_time' => $invitation['invited_enter_time'],
            'exit_time' => $invitation['invited_exit_time'],
            'qr_code' => $invitation['qr_code'],
            'status' => $invitation['invited_status'],
            'access_time' => $invitation['access_time']
        ),
        'device' => array(
            'id' => $invitation['device_id'],
            'name' => $invitation['device_name'],
            'placeId' => $invitation['device_place_id'],
            'hasDependency' => (bool)$invitation['device_has_dependency'],
            'hasPlate' => (bool)$invitation['device_has_plate'],
            'dependencyId' => $invitation['device_dependency_id'],
            'maxMinutes' => $invitation['device_max_minutes'],
            'location' => array(
                'latitude' => $invitation['device_latitude'],
                'longitude' => $invitation['device_longitude'],
                'radio' => $invitation['device_radio']
            ),
        ),
        'host' => array(
            'first_name' => $invitation['host_first_name'],
            'last_name' => $invitation['host_last_name'],
            'email' => $invitation['host_email']
        )
    );
    echo json_encode(array(
        'success' => true,
        'data' => $result
    ));

} catch (Exception $e) {
    error_log("Error al obtener la invitación: " . $e->getMessage());
    portal_abort("Error al obtener la invitación");
}
?>

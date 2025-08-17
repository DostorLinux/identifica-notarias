<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

// Obtener y sanitizar los datos POST
$request = json_from_post_body();

// Validar datos requeridos
$required_fields = array('company', 'description', 'init', 'end', 'event_duration', 'invited_users');
foreach ($required_fields as $field) {
    if (!isset($request[$field]) || empty($request[$field])) {
        echo json_encode(array(
            'success' => false,
            'message' => "Campo requerido faltante: $field"
        ));
        exit;
    }
}

// Sanitizar los datos
$worker_id = get_auth_id();
$company = sanitize($request['company']);
$description = sanitize($request['description']);
$init = sanitize($request['init']);
$end = sanitize($request['end']);
$event_duration = (int)$request['event_duration'];
$device_id = null;
if (isset($request['devicesIds']) && !empty($request['devicesIds'])) {
    $device_id = $request['devicesIds'][0];  // Get the first device ID from the request
}

if(isset($device_id) && empty($device_id)){
    echo json_encode(array(
        'success' => false,
        'message' => "Campo requerido faltante: devicesIds"
    ));
    exit;
}

$invitation_id = isset($request['id']) ? (int)$request['id'] : null;

// Sanitizar array de invitados
$invited_users = array();
foreach ($request['invited_users'] as $invited) {
    $invited_users[] = array(
        'user_id' => isset($invited['user_id']) ? (int)$invited['user_id'] : null,
        'name' => sanitize($invited['name']),
        'email' => sanitize($invited['email'])
    );
}
// Convertir las fechas ISO 8601 a formato MySQL TIMESTAMP
//Add Chile timezone
date_default_timezone_set('America/Santiago');
function convertISOToMySQLTimestamp($isoDate) {
    // Asumiendo que el timestamp ISO viene en UTC
    $date = new DateTime($isoDate, new DateTimeZone('UTC'));
    $date->setTimezone(new DateTimeZone('America/Santiago'));
    return $date->format('Y-m-d H:i:s');
}

// Al procesar los datos
$init = convertISOToMySQLTimestamp($request['init']);
$end = convertISOToMySQLTimestamp($request['end']);


// Crear la conexión a la base de datos


$con = new SimpleDb();

if(!isset($invitation_id)) {

// Guardar la invitación y sus invitados
    $result = save_worker_invitation(
        $con,
        $worker_id,
        $company,
        $description,
        $init,
        $end,
        $event_duration,
        $invited_users,
        $device_id
    );
}else{
    $result=edit_worker_invitation(
        $con,
        $invitation_id,
        $company,
        $description,
        $init,
        $end,
        $event_duration,
        $invited_users,
        $device_id
    );
}
// Devolver la respuesta
echo $result;
?>
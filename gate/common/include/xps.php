<?php

include_once __DIR__.'/../../opq/src/include/opq.php';

function xps_timestamp($ts) {
    // return ts in this format 2024-07-01T01:40:00Z
    $dt = new DateTime("@$ts");
    return $dt->format('c'); // ISO 8601 date
}

function xps_save_event($con, $event_info, $user_id, $device_id) {
    global $xps_enabled;

    if (!$xps_enabled) return;

    $user_info = gate_find_user($con, $user_id);
    $device_info = gate_find_device($con, $device_id);
    if (empty($device_info['placeId'])) {
        error_log("xps_save_event: Invalid placeId for device id $device_id");
        return;
    }

    $place_id = $device_info['placeId'];
    $place_info = gate_find_place($con, $place_id);

    $request = array(
        'idEvento'       => $event_info['id'],
        'fecha'          => xps_timestamp($event_info['timestamp']),
        'rut'            => $user_info['doc_id'],
        'nacionalidad'   => $user_info['nationality'],
        'nombres'        => $user_info['first_name'],
        'apellidos'      => $user_info['last_name'],
        'dispositivo'    => $device_info['name'],
        'locacion'       => $place_info['name']
    );

    opq_create_task($con, 'xps', json_encode($request));
}

?>
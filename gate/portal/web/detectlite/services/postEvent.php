<?php

require __DIR__.'/../../vendor/autoload.php';

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/http.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/api.php';
include_once __DIR__ . '/../../include/gate.php';

$image    = getPostParameter('image');
$type     = getPostParameter('type');
$deviceId = getPostParameter('deviceId');
$rut      = getPostParameter('rut');
$plate    = getPostParameter('plate');
$probe    = getPostParameter('probe') == 'true';

$con = new SimpleDb();

$picture = str_replace('data:image/jpeg;base64,', '', $image);
if (empty($picture)) {
    abort('EMPTY_IMAGE');
}

$face_image = base64_decode($picture);
if (empty($face_image)) {
    abort('INVALID_BASE64_IMAGE');
}

$user_id = gate_match_face($con, $face_image, $gate_match_face_tolerance, null, $rut);
gate_save_match_history($con, $deviceId, empty($user_id) ? 0 : $user_id, $face_image);

if (empty($user_id)) {
    abort('CANNOT_IDENTIFY');
}

$user_info = gate_find_user($con, $user_id);

if ($probe) {
    $response = array(
        'type' => $type,
        'first_name' => $user_info['first_name'],
        'last_name'  => $user_info['last_name']
    );
} else {
    $event = gate_save_event($con, $user_id, $deviceId, $type, 0, 0, $plate);

    // send notification email
    $user_email = $user_info['email'];
    if (!empty($user_email) && $gate_send_email_on_event) {
        $user_name  = gate_build_name($user_info['first_name'], $user_info['last_name']);
        //gate_send_email($user_email, $user_name, $event['timestamp'], $type);
        gate_send_email($user_email,$user_info['doc_id'], $user_name, $event['timestamp'], $type);
    }
    $response = array(
        'type' => $type,
        'time' => $event['timestamp'],
        'first_name' => $user_info['first_name'],
        'last_name'  => $user_info['last_name']
    );
}

echo json_encode($response);

?>

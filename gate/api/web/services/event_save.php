<?php

require __DIR__.'/../vendor/autoload.php';

include_once __DIR__.'/../include/config.php';
include_once __DIR__.'/../include/simpledb.php';
include_once __DIR__.'/../include/http.php';
include_once __DIR__.'/../include/api.php';
include_once __DIR__.'/../include/gate.php';

api_json_header();

$request = json_from_post_body();

$token = api_get_bearer_token();
if (empty($token)) {
    api_validate_shared_key();
    $match_user_id = api_get($request, 'doc_id');
} else {
    if(api_get($request, 'origin')=="app"){
        $match_user_id = api_get_mandatory($request, 'doc_id');

    }else {
        $auth_info = gate_jwt_get_auth_info($token);
        $auth_user_id = $auth_info['username'];
        $match_user_id = api_get_mandatory($request, 'doc_id');
    }
}

$picture  = api_get_mandatory($request, 'picture');
$location = (int)api_get_mandatory_number($request, 'location', null, true, false);
$entry    = api_get($request, 'entry');
$lat      = (float)api_get_number($request, 'lat', null, true, true);
$lng      = (float)api_get_number($request, 'lng', null, true, true);
$plate = api_get($request, 'plate');

$isDriverCarpool = api_get($request, 'type')== 'driver_carpooling' ? 1 : 0;
$isPassagerCarpool = api_get($request, 'type')== 'passager_carpooling' ? 1 : 0;
$isCarpool = $isDriverCarpool|| $isPassagerCarpool;


$return_picture = api_get_boolean($request, 'return_picture');

if (empty($entry)) $entry = 'none';

api_check_allowed($entry, $gate_valid_entries, 'entry');

$con = new SimpleDb();

$face_image = base64_decode($picture);
if (empty($face_image)) {
    api_abort('INVALID_BASE64_ENCODING');
}

$user_id = gate_match_face($con, $face_image, $gate_match_face_tolerance, null, $match_user_id);
gate_save_match_history($con, $location, empty($user_id) ? 0 : $user_id, $face_image);

// no matching user. Return picture if requested
if (empty($user_id)) {
    if ($return_picture && !empty($match_user_id)) {
        $user_info = gate_find_user_by_doc_id($con, $match_user_id, '');
        $response = array(
            'error' => 'FACE_NOT_FOUND',
            'picture' => gate_get_encoded_picture($user_info['id'])
        );
        die(json_encode($response));
    } else {
        api_abort('FACE_NOT_FOUND');
    }
}

// match. Save event and return user info with picture if requested
$user_info = gate_find_user($con, $user_id);
$event = gate_save_event($con, $user_id, $location, $entry, $lat, $lng, $plate, $isCarpool, $isDriverCarpool);

// send notification email
$user_email = $user_info['email'];
if (!empty($user_email) && $gate_send_email_on_event) {
    $doc_id = $user_info['doc_id'];
    $user_name  = gate_build_name($user_info['first_name'], $user_info['last_name']);
    gate_send_email($user_email, $doc_id, $user_name, $event['timestamp'], $entry);
}

if ($return_picture) {
    $user_info['picture'] = gate_get_encoded_picture($user_id);
}

$response = array(
    'status' => 'success',
    'user' => $user_info,
    'timestamp' => $event['timestamp']
);

echo json_encode($response);

?>

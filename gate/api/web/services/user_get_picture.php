<?php

require __DIR__.'/../vendor/autoload.php';

include_once __DIR__.'/../include/config.php';
include_once __DIR__.'/../include/simpledb.php';
include_once __DIR__.'/../include/api.php';
include_once __DIR__.'/../include/gate.php';

api_json_header();
$token = api_get_bearer_token();
if (empty($token)) {
    api_validate_shared_key();
    $user_doc_id = getParameter('doc_id');
} else {
    $auth_info   = gate_jwt_get_auth_info($token);
    $user_doc_id  = $auth_info['doc_id'];
}

if (empty($user_doc_id)) {
    api_abort('MANDATORY', 'doc_id');
}

$con = new SimpleDb();
$sql = 'select id from user where doc_id = ?';
$user_id = $con->get_one($sql, $user_doc_id);

if (empty($user_id)) {
    api_abort('USER_NOT_FOUND');
}

$image_file = gate_get_face_path(FACE_TYPE_USER, $user_id);
if (!file_exists($image_file)) {
	api_abort('IMAGE_NOT_FOUND', 'Image not found for user '.$user_doc_id);
}

$image = file_get_contents($image_file);
$response = array('picture' => base64_encode($image));

echo json_encode($response);

?>
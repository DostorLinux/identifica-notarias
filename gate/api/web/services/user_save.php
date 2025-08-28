<?php

require __DIR__.'/../vendor/autoload.php';

include_once __DIR__.'/../include/config.php';
include_once __DIR__.'/../include/simpledb.php';
include_once __DIR__.'/../include/http.php';
include_once __DIR__.'/../include/api.php';
include_once __DIR__.'/../include/gate.php';

api_json_header();
$auth_info = gate_jwt_auth_admin();

$request = json_from_post_body();

$doc_id     = api_get_mandatory($request, 'doc_id');
$sec_id     = api_get($request, 'sec_id');
$username   = api_get($request, 'username');
$password   = api_get($request, 'password');
$first_name = api_get($request, 'first_name');
$last_name  = api_get($request, 'last_name');
$email      = api_get($request, 'email');
$picture    = api_get_mandatory($request, 'picture');
$role       = api_get_mandatory($request, 'role');
$birth_date = api_get($request, 'birth_date');
$country    = api_get($request, 'country');
$gender     = api_get($request, 'gender');
$document_number = api_get($request, 'document_number');
$expiration_date = api_get($request, 'expiration_date');
$signature  = api_get($request, 'signature');

if (!empty($email) && !isValidEmail($email)) {
    api_abort('INVALID_EMAIL', 'email');
}

$face_image = base64_decode($picture);
$vector = gate_get_face_signature_from_image($face_image, $gate_check_mask);

$encoded_vector = json_encode($vector);

$doc_id = gate_normalize_doc_id($doc_id);

$con = new SimpleDb();
$sql = 'select id from user where doc_id = ?';
$userId = $con->get_one($sql, $doc_id);

if (!empty($userId)) {
    $sql = 'update user set sec_id = ?, username = ?, first_name = ?, last_name = ?'.
        ', email = ?, vector = ?, role = ?, active = ?, birth_date = ?, country = ?, gender = ?, document_number = ?, expiration_date = ? where id = ?';
    $params = array($sec_id, $username, $first_name, $last_name, $email, $encoded_vector, $role, 'Y', $birth_date, $country, $gender, $document_number, $expiration_date, $userId);
    $result = 'updated';
    $con->execute($sql, $params);
} else {
    $uuid = guidv4();
    $created_by = $auth_info['userId'];
    $sql = 'insert into user (doc_id, sec_id, username, first_name, last_name, email, vector, role, active, pub_id, created_by, updated, birth_date, country, gender, document_number, expiration_date) '.
        'values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), ?, ?, ?, ?, ?)';
    $params = array($doc_id, $sec_id, $username, $first_name, $last_name, $email, $encoded_vector, $role, 'Y', $uuid, $created_by, $birth_date, $country, $gender, $document_number, $expiration_date);
    $result = 'created';
    $con->execute($sql, $params);
    $userId = $con->get_last_id();
}

if (!empty($password)) {
    $hashed_password = gate_hash_password($password);
    $sql = 'update user set password = ? where id = ?';
    $con->execute($sql, array($hashed_password, $userId));
}

gate_save_face(FACE_TYPE_USER, $userId, $face_image);

// Save signature if provided
if (!empty($signature)) {
    $signature_image = base64_decode($signature);
    gate_save_signature($userId, $signature_image);
}

$response = array('id' => $userId + $gate_first_internal_user_id, 'result' => $result);

echo json_encode($response);

?>
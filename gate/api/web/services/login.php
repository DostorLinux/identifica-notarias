<?php

require __DIR__.'/../vendor/autoload.php';

include_once __DIR__.'/../include/config.php';
include_once __DIR__.'/../include/simpledb.php';
include_once __DIR__.'/../include/api.php';
include_once __DIR__.'/../include/gate.php';

api_json_header();

$user = getValue($_SERVER, 'PHP_AUTH_USER');
$pass = getValue($_SERVER, 'PHP_AUTH_PW');

if (empty($user) || empty($pass)) {
    api_abort('INVALID_REQUEST');
}

$con = new SimpleDb();

$user_info = gate_login($con, $user, $pass);
if (empty($user_info)) {
    api_abort('UNKNOWN_USER');
}

$token = gate_create_token($user_info);

$response = array('token' => $token, 'user' => $user_info);
echo json_encode($response);

?>

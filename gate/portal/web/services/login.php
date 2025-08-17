<?php

require __DIR__.'/../vendor/autoload.php';

include_once __DIR__ . '/../include/config.php';
include_once __DIR__ . '/../include/core.php';
include_once __DIR__ . '/../include/simpledb.php';
include_once __DIR__ . '/../include/gate.php';

$con = new SimpleDb();

$username = getPostParameter('user');
$password = getPostParameter('pass');
$mode = getPostParameter("mode");

if (empty($username)) {
	abort('Debe indicar el nombre de usuario');
}

if (empty($password)) {
	abort('Debe indicar la contraseña');
}

$con = new SimpleDb();
$userInfo = gate_login($con, $username, $password);
if ($userInfo == null) {
	abort('UNKNOWN_USER');
}


// Definir los roles permitidos
// Obtener el rol actual del usuario
$currentRole = $userInfo["role"];

if ((!in_array($currentRole, $allowed_login_roles)) ||$userInfo["active"]!="Y"){
	abort('UNKNOWN_USER');
}

if (empty($userInfo)) {
    abort('UNKNOWN_USER');
}
$token = gate_create_token($userInfo);


if (empty($mode)){
    $mode="php_session";
}
if($mode=="php_session") {
    session_start();
    $_SESSION['token'] = $token;
    $_SESSION['user_id'] = $userInfo['id'];
    $_SESSION['user_name'] = $username;
    $_SESSION['user_role'] = $userInfo['role'];
    session_commit();
    
    $response = array('success' => true);
    if ($userInfo['must_change_password'] == 1) {
        $response['must_change_password'] = true;
        $response['message'] = 'Debe cambiar su contraseña temporal en el primer ingreso';
    }
    
    echo json_encode($response);
    exit();
}

if($mode=="jwt") {
    header('Content-Type: application/json; charset=utf-8');
    
    // Include user data in JWT response
    $userData = array(
        "id" => $userInfo['id'],
        "username" => $username,
        "first_name" => $userInfo['first_name'],
        "last_name" => $userInfo['last_name'],
        "doc_id" => $userInfo['doc_id'],
        "email" => $userInfo['email'],
        "role" => $userInfo['role'],
        "active" => $userInfo['active']
    );
    
    $RESPONSE = array(
        "success" => true,
        "token" => $token,
        "user" => $userData
    );
    
    if ($userInfo['must_change_password'] == 1) {
        $RESPONSE['must_change_password'] = true;
        $RESPONSE['message'] = 'Debe cambiar su contraseña temporal en el primer ingreso';
    }
    
    echo json_encode($RESPONSE);
    exit();
}

?>
<?php

require __DIR__.'/../vendor/autoload.php';
include_once __DIR__.'/../include/core.php';
include_once __DIR__.'/../include/config.php';
include_once __DIR__.'/../include/simpledb.php';
include_once __DIR__.'/../include/gate.php';
include_once __DIR__.'/../include/portal.php';

portal_auth_admin();

$request = json_from_post_body();

// Si el usuario es distinto a los administradores entonces user my userId
if (!is_admin()) {
    $user_id = $auth_user_id;
}else{
    $user_id = api_get_mandatory($request, 'user_id');
}

$picture = api_get_mandatory($request, 'picture');

$face_image = base64_decode($picture);
$vector = gate_get_face_signature_from_image($face_image, $gate_check_mask);

$encoded_vector = json_encode($vector);

$con = new SimpleDb();
$sql = 'update user set vector = ? where id = ?';
$con->execute($sql, array($encoded_vector, $user_id));

gate_save_face(FACE_TYPE_USER, $user_id, $face_image);

echo json_success();

?>
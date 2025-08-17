<?php

require __DIR__.'/../vendor/autoload.php';

include_once __DIR__.'/../include/config.php';
include_once __DIR__.'/../include/simpledb.php';
include_once __DIR__.'/../include/api.php';
include_once __DIR__.'/../include/gate.php';

api_json_header();
$auth_info = gate_jwt_auth_admin();

$request = json_from_post_body();

$doc_id = api_get_mandatory($request, 'doc_id');

$con = new SimpleDb();
$sql = 'select id from user where doc_id = ?';
$user_id = $con->get_one($sql, $doc_id);
if (empty($user_id)) {
    api_abort('USER_NOT_FOUND');
}

$sql = 'update user set active = ?, updated = now() where id = ?';
$con->execute($sql, array('N', $user_id));

echo json_success();

?>
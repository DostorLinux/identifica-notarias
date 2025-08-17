<?php

require __DIR__.'/../vendor/autoload.php';

include_once __DIR__.'/../include/config.php';
include_once __DIR__.'/../include/simpledb.php';
include_once __DIR__.'/../include/http.php';
include_once __DIR__.'/../include/api.php';
include_once __DIR__.'/../include/gate.php';

api_json_header();

$auth_info = gate_jwt_auth_admin();
$auth_user_id = $auth_info['userId'];

$request = json_from_post_body();

$gate_id    = api_get_mandatory($request, 'gate_id');
$doc_id     = api_get_mandatory($request, 'doc_id');
$first_name = api_get($request, 'first_name');
$last_name  = api_get($request, 'last_name');
$picture    = api_get($request, 'picture');

$con = new SimpleDb();

$con->begin();
$visitorId = gate_register_visitor($con, $doc_id, $first_name, $last_name, $picture);
$logId = gate_save_on_logbook($con, $visitorId, $gate_id);
$con->commit();

$response = array('visitor' => $visitorId, 'log' => $logId);
echo json_encode($response);

?>
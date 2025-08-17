<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$gate_id    = getPostParameter('gate_id');
$doc_id     = getPostParameter('doc_id');
$first_name = getPostParameter('first_name');
$last_name  = getPostParameter('last_name');
$picture    = getPostParameter('picture');

$con = new SimpleDb();

$con->begin();
$visitorId = gate_register_visitor($con, $doc_id, $first_name, $last_name, $picture);
$logId = gate_save_on_logbook($con, $visitorId, $gate_id);
$con->commit();

$response = array('visitor' => $visitorId, 'log' => $logId);
echo json_encode($response);

?>
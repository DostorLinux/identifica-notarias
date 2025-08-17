<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

$con = new SimpleDb();

$gateId = getParameter('gateId');

$sql = 'select id from logbook where gateId = ? and status = ? order by created desc limit 1';


$id = $con->get_one($sql, array($gateId, 'READ'));

$result = array('id' => $id);

echo json_encode($result);

?>
<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$plate  = getPostParameter('plate');
$deniedNote = getPostParameter('deniedNote');

$sql = 'select 1 from vehicle where plate = ? ';
$exists = $con->exists($sql, $plate);
if (!$exists) {
    $sql = 'insert into vehicle (plate, deniedNote, isDenied) values (?, ?, 1)';
    $params = array($plate, $deniedNote);
    $con->execute($sql, $params);
}else{
    $sql = 'update vehicle set deniedNote = ?, isDenied = 1 where plate = ?';
    $params = array($deniedNote, $plate);
    $con->execute($sql, $params);
}

$audit_type = AUDIT_VEHICLE_DENIED;
gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));

$result = array('plate' => $plate);
echo json_encode($result);

?>
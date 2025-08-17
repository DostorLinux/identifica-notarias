<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$plate       = getPostParameter('plate');
$description = getPostParameter('description');
$active      = (int)getPostParameter('active');
$isDenied    = (int)getPostParameter('isDenied');
$deniedNote  = getPostParameter('deniedNote');

$params = array($description, $active, $auth_user_id, $isDenied, $deniedNote, $plate);

$sql = 'select 1 from vehicle where plate = ?';
$exists = $con->exists($sql, $plate);

if (!$exists) {
    $audit_type = AUDIT_VEHICLE_CREATE;
    $sql = 'insert into vehicle (description, active, author, isDenied, deniedNote, plate) values (?, ?, ?, ?, ?, ?)';
    $con->execute($sql, $params);
} else {
    $audit_type = AUDIT_VEHICLE_MODIFY;
    $sql = 'update vehicle set description = ?, active = ?, author = ?, isDenied = ?, deniedNote = ?, updated = now() where plate = ?';
    $con->execute($sql, $params);
}

gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));

$result = array('id' => $id);
echo json_encode($result);


?>
<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$userId = getPostParameter('userId');
$plate  = getPostParameter('plate');

$sql = 'select 1 from driver where userId = ? and plate = ? ';
$exists = $con->exists($sql, array($userId, $plate));

if (!$exists) {
    $sql = 'insert into driver (userId, plate, author) values (?, ?, ?)';
    $params = array($userId, $plate, $auth_user_id);
    $con->execute($sql, $params);

    $audit_type = AUDIT_DRIVER_SAVE;
    gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));

    echo json_success();
} else {
    echo json_failure();
}


?>
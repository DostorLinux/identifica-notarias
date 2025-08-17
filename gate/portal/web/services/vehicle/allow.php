<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$plate = getPostParameter('plate');

$sql = 'select 1 from vehicle where plate = ? ';
$exists = $con->exists($sql, $plate);
if ($exists) {
    $audit_type = AUDIT_VEHICLE_ALLOWED;
    $sql = 'update vehicle set deniedNote = ?, isDenied = 0 where plate = ?';
    $params = array("", $plate);
    $con->execute($sql, $params);

    gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));
    $result = array('plate' => $plate);
    echo json_encode($result);
} else {
    echo json_failure();
}

?>
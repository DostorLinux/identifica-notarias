<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$id = getPostParameter('id');

$sql = 'select 1 from user where id = ?';
$exists = $con->exists($sql, $id);
if ($exists) {
    $audit_type = AUDIT_USER_ALLOWED;
    $sql = 'update user set deniedNote = ?, isDenied = 0 where id = ?';
    $params = array("", $id);
    $con->execute($sql, $params);

    gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));
    $result = array('id' => $id);
    echo json_encode($result);
} else {
    echo json_failure();
}

?>
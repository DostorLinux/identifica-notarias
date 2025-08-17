<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$userId    = getPostParameter('userId');
$companyId = getPostParameter('companyId');

$sql = 'select 1 from worker where userId = ? and companyId = ? ';
$exists = $con->exists($sql, array($userId, $companyId));

if (!$exists) {
    $sql = 'insert into worker (userId, companyId, author) values (?, ?, ?)';
    $params = array($userId, $companyId, $auth_user_id);
    $con->execute($sql, $params);

    $audit_type = AUDIT_WORKER_SAVE;
    gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));
    echo json_success();
} else {
    echo json_success();
}


?>
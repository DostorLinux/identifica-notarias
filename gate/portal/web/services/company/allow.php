<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$companyId  = getPostParameter('companyId');

$sql = 'select 1 from company where id = ? ';
$exists = $con->exists($sql, array($companyId));
if ($exists) {
    $audit_type = AUDIT_COMPANY_ALLOWED;
    $sql = 'update company set deniedNote = ?, isDenied = 0 where id = ?';
    $params = array("", $companyId);
    $con->execute($sql, $params);

    gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));
    $result = array('id' => $id);
    echo json_encode($result);
} else {
    echo json_failure();
}

?>
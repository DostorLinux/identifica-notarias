<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$companyId = getPostParameter('companyId');
$plate     = getPostParameter('plate');

$sql = 'select 1 from vehicle_in_company where companyId = ? and plate = ? ';
$exists = $con->exists($sql, array($companyId, $plate));

if (!$exists) {
    $sql = 'insert into vehicle_in_company (companyId, plate, author) values (?, ?, ?)';
    $params = array($companyId, $plate, $auth_user_id);
    $con->execute($sql, $params);

    $audit_type = AUDIT_VEHICLE_COMPANY_SAVE;
    gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));

    echo json_success();
} else {
    echo json_failure();
}


?>
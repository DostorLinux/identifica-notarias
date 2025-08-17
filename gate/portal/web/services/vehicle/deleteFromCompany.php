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

$params = array($companyId, $plate);

$sql = 'delete from vehicle_in_company where companyId = ? and plate = ? ';
$con->execute($sql, $params);

if ($con->get_affected_rows() > 0) {
    $audit_type = AUDIT_VEHICLE_COMPANY_DELETE;
    gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));
    echo json_success();
} else {
    echo json_failure();
}

?>
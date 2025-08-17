<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$rut  = getPostParameter('rut');
$deniedNote = getPostParameter('deniedNote');

$sql = 'select id from company where rut = ? ';
$companyId = $con->get_one($sql, $rut);
if (empty($companyId)) {
    $sql = 'insert into company (rut,deniedNote,isDenied) values (?, ?, 1)';
    $params = array($rut, $deniedNote);
    $con->execute($sql, $params);
    $companyId = $con->get_last_id();
}else{
    $sql = 'update company set deniedNote = ?, isDenied = 1 where rut = ?';
    $params = array($deniedNote, $rut);
    $con->execute($sql, $params);
}

$audit_type = AUDIT_COMPANY_DENIED;
gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));

$result = array('id' => $companyId);
echo json_encode($result);

?>
<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$id    = getPostParameter('id');
$name   = getPostParameter('name');
$rut  = getPostParameter('rut');
$address = getPostParameter('address');
$notes = getPostParameter('notes');


$params = array($name, $rut, $address, $notes);
if (empty($id)) {
    $audit_type = AUDIT_COMPANY_CREATE;
    $sql = 'insert into company (name,rut, address,notes, isDenied) values (?, ?, ?, ?,0)';
    $con->execute($sql, $params);
    $id = $con->get_last_id();
} else {
    $audit_type = AUDIT_COMPANY_MODIFY;
    $sql = 'update company set name = ?, rut = ?, address = ?, notes = ?, updated = now() where id = ?';
    $params[] = $id;
    $con->execute($sql, $params);
}

gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));

$result = array('id' => $id);
echo json_encode($result);


?>
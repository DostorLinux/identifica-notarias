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
$description   = getPostParameter('description');

$placeId  = getPostParameter('placeId');

$params = array($name, $description,$placeId);

if (empty($id)) {
    $audit_type = AUDIT_GATE_CREATE;
    $sql = 'insert into gate (name,description,placeId) values (?, ?, ?)';
    $con->execute($sql, $params);
    $id = $con->get_last_id();
} else {
    $audit_type = AUDIT_GATE_MODIFY;
    $sql = 'update gate set name = ?, description =?, placeId=?, updated = now() where id = ?';
    $params[] = $id;
    $con->execute($sql, $params);
}
gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));
$result = array('id' => $id);
echo json_encode($result);


?>
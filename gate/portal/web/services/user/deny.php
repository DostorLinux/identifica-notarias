<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$docId  = getPostParameter('docId');
$deniedNote = getPostParameter('deniedNote');

$sql = 'select id from `user` where doc_id = ?';
$userId = $con->get_one($sql, $docId);
if (empty($userId)) {
    $uuid = guidv4();
    $sql = 'insert into user (doc_id, pub_id, deniedNote, isDenied) values (?, ?, ?, 1)';
    $params = array($docId, $uuid, $deniedNote);
    $con->execute($sql, $params);
    $userId = $con->get_last_id();
}else{
    $sql = 'update user set deniedNote = ?, isDenied = 1 where doc_id = ?';
    $params = array($deniedNote, $docId);
    $con->execute($sql, $params);
}

$audit_type = AUDIT_USER_DENIED;
gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));

$result = array('id' => $userId);
echo json_encode($result);

?>
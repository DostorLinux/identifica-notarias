<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$allowId  = getPostParameter('id');


$sql = 'select * from allow_list where id = ?';
$allow = $con->get_row($sql, array($allowId));
if (!empty($allow)) {
   $sql = 'delete from allow_list where id = ?';
    $params = array($allowId);
    $con->execute($sql, $params);
}

$audit_type = AUDIT_ALLOW_REMOVE;
gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($allow));

echo json_success()

?>
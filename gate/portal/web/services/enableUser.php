<?php

include_once __DIR__ . '/../include/config.php';
include_once __DIR__ . '/../include/core.php';
include_once __DIR__ . '/../include/simpledb.php';
include_once __DIR__ . '/../include/gate.php';
include_once __DIR__ . '/../include/portal.php';

portal_auth();

$id = getPostParameter('id');

portal_check_mandatory($id,     'Id requerido');

if ($id != $auth_user_id) portal_check_admin();

$con = new SimpleDb();



$con->begin();

$params = array("Y",$id);
$audit_type = AUDIT_USER_MODIFY;
$sql = 'update user set active=? ,updated = now() where id = ?';

$con->execute($sql, $params);

gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));
$con->commit();

$result = array('doc_id' => $doc_id);
echo json_encode($result);


?>
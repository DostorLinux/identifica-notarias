<?php

include_once __DIR__ . '/../include/config.php';
include_once __DIR__ . '/../include/core.php';
include_once __DIR__ . '/../include/simpledb.php';
include_once __DIR__ . '/../include/gate.php';
include_once __DIR__ . '/../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$id = getPostParameter('id');

$con->begin();

$audit_type = AUDIT_AREA_DELETE;
$sql = 'delete from area where id = ?';
$con->execute($sql, $id);

gate_save_audit_log($con, $auth_user_id, $audit_type, $id);

$con->commit();

echo json_success();

?>
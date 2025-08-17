<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$params = [];

$id = getPostParameter('id');
if (empty($id)) {
    portal_abort('MANDATORY', 'id');
}


/*create table allow_group(
    id int auto_increment primary key,
    name varchar(400),
    description varchar(4000),
    deleted TINYINT(1) default 0,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
*/
    $audit_type = AUDIT_ALLOWGROUP_DELETE;
    $sql = 'update allow_group set deleted = 1, updated = now() where id = ?';
    $params[] = $id;
    $con->execute($sql, $params);

gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));
$result = array('id' => $id);
echo json_encode($result);


?>
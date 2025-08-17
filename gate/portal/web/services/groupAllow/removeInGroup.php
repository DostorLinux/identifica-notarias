<?php


include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$id    = getPostParameter('id');

if (empty($id)) {
    portal_abort('MANDATORY', 'id');
}
    $params = array($id);
    $audit_type = AUDIT_ALLOWGROUPUSR_DELETE;
    $sql = 'delete from allow_group_user  where id = ?';
    $con->execute($sql, $params);
    $id = $con->get_last_id();

    $quitar_allow = 'delete from allow_list where user_in_group = ? and access_day >=  CURDATE()';
    $con->execute($quitar_allow, $params);



gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));
$result = array('id' => $id);
echo json_encode($result);

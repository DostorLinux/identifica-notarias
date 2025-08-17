<?php

include_once __DIR__ . '/../include/config.php';
include_once __DIR__ . '/../include/core.php';
include_once __DIR__ . '/../include/simpledb.php';
include_once __DIR__ . '/../include/gate.php';
include_once __DIR__ . '/../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$id    = getPostParameter('id');
$name  = getPostParameter('name');
$areas = getPostParameter('areas');

$con->begin();
$params =array ("name"=>$name,"areas"=> $areas);

if (empty($id)) {
    $audit_type = AUDIT_GROUP_CREATE;
    $sql = 'insert into user_group (name) values (?)';
    $con->execute($sql, $name);
    $id = $con->get_last_id();
} else {
    $audit_type = AUDIT_GROUP_MODIFY;
    $sql = 'update user_group set name = ? where id = ?';
    $params["id"]=$id;
    $con->execute($sql, array($name,$id));
}

$sql = 'delete from area_group where userGroupId = ?';
$con->execute($sql, $id);

$areaIds = explode(',', $areas);
$sql = 'insert into area_group (userGroupId, areaId) values (?, ?)';
foreach($areaIds as $areaId) {
    $con->execute($sql, array($id, trim($areaId)));
};
gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));

$con->commit();

$result = array('id' => $id);
echo json_encode($result);


?>
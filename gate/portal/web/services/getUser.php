<?php

include_once __DIR__ . '/../include/config.php';
include_once __DIR__ . '/../include/core.php';
include_once __DIR__ . '/../include/simpledb.php';
include_once __DIR__ . '/../include/gate.php';
include_once __DIR__ . '/../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$id = getParameter('id');
if (empty($id)) {
	portal_abort('MANDATORY', 'id');
}

$sql = 'select id, doc_id, sec_id, username, first_name, last_name, email, role, active, pub_id, nationality, has_expiration, expiration_date, user_type from user where id = ?';
$user = $con->get_row($sql, $id);

if (empty($user)) {
	portal_abort('USER_NOT_FOUND');
}

$sql = 'select userGroupId id from user_group_user where userId = ?';
$group_rows = $con->get_array($sql, $id);

$groups = array();
foreach($group_rows as $group_row) {
    $groups[] = $group_row['id'];
}

$sql = 'select placeId from place_user where userId = ?';
$group_rows = $con->get_array($sql, $id);

$placeIds = array();
foreach($group_rows as $group_row) {
    $placeIds[] = $group_row['placeId'];
}

//table user_device
$sql = 'select device_id from user_device where user_id = ?';

$devices = $con->get_array($sql, $id);


$user['groups'] = $groups;
$user['places'] = $placeIds;

$devicesIds = [];
foreach ($devices as $device) {
    $devicesIds[] = $device['device_id'];
}
$user['devices'] = $devicesIds;
$result = array('user' => $user);

echo json_encode($result);

?>
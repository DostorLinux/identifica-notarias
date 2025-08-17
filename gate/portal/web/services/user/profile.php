<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

// This will set up $auth_user_id
portal_auth();

$con = new SimpleDb();

// Use the authenticated user's ID
$id = $auth_user_id;
if (empty($id)) {
    portal_abort('USER_NOT_FOUND');
}

$sql = 'select id, doc_id, sec_id, username, first_name, last_name, email, role, active, pub_id, nationality, has_expiration, expiration_date, user_type from user where id = ?';
$user = $con->get_row($sql, $id);

if (empty($user)) {
    portal_abort('USER_NOT_FOUND');
}

// Get user groups
$sql = 'select userGroupId id from user_group_user where userId = ?';
$group_rows = $con->get_array($sql, $id);

$groups = array();
foreach($group_rows as $group_row) {
    $groups[] = $group_row['id'];
}

// Get user places
$sql = 'select placeId from place_user where userId = ?';
$place_rows = $con->get_array($sql, $id);

$placeIds = array();
foreach($place_rows as $place_row) {
    $placeIds[] = $place_row['placeId'];
}

// Get user devices
$sql = 'select device_id from user_device where user_id = ?';
$devices = $con->get_array($sql, $id);

$devicesIds = [];
foreach ($devices as $device) {
    $devicesIds[] = $device['device_id'];
}

// Compose final result
$user['groups'] = $groups;
$user['places'] = $placeIds;
$user['devices'] = $devicesIds;
echo json_encode($user);
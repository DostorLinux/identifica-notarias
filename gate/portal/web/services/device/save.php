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

$hasDependency   = (getPostParameter('hasDependency')=="1"?1:0);
$dependencyId   = getPostParameter('dependencyId');
$maxMinutes   = getPostParameter('maxMinutes');
$placeId  = getPostParameter('placeId');
$hasPlate  = (getPostParameter('hasPlate')=="1"?1:0);
// d.lng, d.lat, d.radius
$lng   = getPostParameter('lng');
$lat   = getPostParameter('lat');
$radio   = getPostParameter('radio');
$allowInvitation = (getPostParameter('allowInvitation')=="1"?1:0);
$location = getPostParameter('location');


if ($lng==0||$lat==0||$lng==null||$lat==null|$radio==null||$radio==0){
    $lng = null;
    $lat = null;
    $radio = null;
}


$params = array($name, $hasDependency, $dependencyId, $maxMinutes, $hasPlate, $placeId, $lat, $lng, $radio, $allowInvitation, $location);

if (empty($id)) {
    $audit_type = AUDIT_DEVICE_CREATE;

    $sql = 'insert into device (name, hasDependency, dependencyId, maxMinutes, hasPlate, placeId, lat, lng, radio, allowInvitation, location) 
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    $con->execute($sql, $params);
    $id = $con->get_last_id();
} else {
    $audit_type = AUDIT_DEVICE_MODIFY;
    $sql = 'update device set name = ?, hasDependency = ?, dependencyId = ?, maxMinutes = ?, hasPlate = ?, placeId = ?, 
            lat = ?, lng = ?, radio = ?, allowInvitation = ?, location = ?, updated = now() 
            where id = ?';
    $params[] = $id;
    $con->execute($sql, $params);
}

gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));


$user_types = getPostParameter('user_types');
if (!empty(trim($user_types))) {
    $sql = 'delete from device_user_types where device_id = ?';
    $con->execute($sql, $id);
    $user_types = explode(',', $user_types);
    $sql = 'insert into device_user_types ( device_id,user_type) values (?, ?)';
    foreach ($user_types as $user_type) {
        $con->execute($sql, array($id, trim($user_type)));
    }
}



$result = array('id' => $id);
echo json_encode($result);


?>
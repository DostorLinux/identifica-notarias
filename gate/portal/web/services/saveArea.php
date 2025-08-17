<?php

include_once __DIR__ . '/../include/config.php';
include_once __DIR__ . '/../include/core.php';
include_once __DIR__ . '/../include/simpledb.php';
include_once __DIR__ . '/../include/gate.php';
include_once __DIR__ . '/../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$id    = getPostParameter('id');
$lat   = getPostParameter('lat');
$lng   = getPostParameter('lng');
$radio = getPostParameter('radio');
$name = getPostParameter('name');

$lat = portal_check_mandatory_float($lat, 'Latitud');
$lng = portal_check_mandatory_float($lng, 'Longitud');
$radio = portal_check_mandatory_int($radio, 'Radio');

$params = array($lat, $lng, $radio, $name);
if (empty($id)) {
    $audit_type = AUDIT_AREA_CREATE;
    $sql = 'insert into area (lat, lng, radio, name) values (?, ?, ?, ?)';
    $con->execute($sql, $params);
    $id = $con->get_last_id();
} else {
    $audit_type = AUDIT_AREA_MODIFY;
    $sql = 'update area set lat = ?, lng = ?, radio = ?, name = ?, updated = now() where id = ?';
    $params[] = $id;
    $con->execute($sql, $params);
}

gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));

$result = array('id' => $id);
echo json_encode($result);


?>
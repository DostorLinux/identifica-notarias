<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$eventId = getPostParameter('id');
$plate  = getPostParameter('plate');

$sql = 'select 1 from event where id = ? ';
$exists = $con->exists($sql, array($eventId));


if ($exists) {
   // $audit_type = AUDIT_DEVICE_CREATE;
    $sql = 'update event set plate = ? where id = ?';
    $params = array($plate, $eventId);

    $con->execute($sql, $params);
}
//gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));
$result = array('id' => $eventId);
echo json_encode($result);


?>
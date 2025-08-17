<?php
//update the register to set  has_notification = 1, and notification_date = now()


include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/api.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';


portal_auth_admin();

$id = getPostParameter('id');


$con = new SimpleDb();


$sql = 'select 1 from parking_register where id = ?';
$exists = $con->exists($sql, array($id));

if ($exists) {
    $sql = "update parking_register set has_notification=0, notification_date=null  where id = ?";
    $params = array($id);
    $con->execute($sql, $params);
}
echo json_success();

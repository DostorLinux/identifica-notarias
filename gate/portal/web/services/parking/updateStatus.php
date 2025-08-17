<?php


include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/api.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';


portal_auth_admin();

$id    = getPostParameter('id');
$status    = getPostParameter('status');



$con = new SimpleDb();


$sql = 'select 1 from parking_register where id = ?';
$exists = $con->exists($sql, array($id));

if ($exists) {
    if($status == 'IN_PARKING') {
        $sql = "update parking_register set status = 'IN_PARKING', enter_date=now() where id = ?";
    }
    if($status == 'IN_TRANSIT') {
        $sql = "update parking_register set status = 'IN_TRANSIT',in_transit_date=now(),has_notification=0  where id = ?";
    }
    if($status =='IN_PORT'){
        $sql = "update parking_register set status = 'IN_PORT',in_port_date=now(), has_notification=0  where id = ?";
    }
    //EXIT_PORT
    if($status =='EXIT_PORT'){
        $sql = "update parking_register set status = 'EXIT_PORT',out_port_date=now(), has_notification=0  where id = ?";
    }
    if($status =='EXIT'){
        $sql = "update parking_register set status = 'EXIT', has_notification=0  where id = ?";
    }
    $params = array($id);
    $con->execute($sql, $params);


}

echo json_success();
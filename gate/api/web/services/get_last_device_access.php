<?php

require __DIR__.'/../vendor/autoload.php';

include_once __DIR__.'/../include/config.php';
include_once __DIR__.'/../include/simpledb.php';
include_once __DIR__.'/../include/api.php';
include_once __DIR__.'/../include/gate.php';

api_json_header();
api_validate_shared_key();

$deviceId = getParameter('deviceId');
$con = new SimpleDb();
$params = array();


if (!empty($deviceId)) {
    if (!is_numeric($deviceId)) {
        api_abort('INVALID_PARAMETER', 'deviceId');
    }
    $params[] = $deviceId;
}else{
    api_abort('INVALID_PARAMETER', 'deviceId');
}


$sql = "select  last_access as , 
    NOW() AS current, 
    TIMESTAMPDIFF(SECOND, last_access, NOW()) AS secondDifference 
from device where id=? and last_access is not null ";  // Usamos deviceId en lugar de location
$last_event = $con->get_row($sql, $params);
if(empty($last_event)){
    $last_event = array('last_access' => null, 'current' => null, 'secondDifference' => null);
}

echo json_encode($last_event);

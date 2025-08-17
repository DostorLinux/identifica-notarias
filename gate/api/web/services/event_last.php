<?php

require __DIR__.'/../vendor/autoload.php';

include_once __DIR__.'/../include/config.php';
include_once __DIR__.'/../include/simpledb.php';
include_once __DIR__.'/../include/api.php';
include_once __DIR__.'/../include/gate.php';

api_json_header();
api_validate_shared_key();

$location = getParameter('location');

$con = new SimpleDb();
$params = array();
$where = '';

if (!empty($location)) {
    if (!is_numeric($location)) {
        api_abort('INVALID_PARAMETER', 'location');
    }
    $where = ' where deviceId = ?';  // Usamos deviceId en lugar de location
    $params[] = $location;
}

$sql = "select max(created) created, deviceId from event$where group by deviceId";  // Usamos deviceId en lugar de location
$last_events = $con->get_array($sql, $params);

$time = time();
foreach($last_events as &$last_event) {
    $last_event['elapsed'] = $time - $last_event['created'];
    unset($last_event['created']);
}

$result = array('last_events' => $last_events);

echo json_encode($result);

?>
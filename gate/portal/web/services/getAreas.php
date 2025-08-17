<?php
include_once __DIR__ . '/../include/config.php';
include_once __DIR__ . '/../include/core.php';
include_once __DIR__ . '/../include/simpledb.php';
include_once __DIR__ . '/../include/gate.php';
include_once __DIR__ . '/../include/portal.php';

portal_auth();

$con = new SimpleDb();

$sql = 'select id, lat, lng, radio, name from area order by created';
$areas = $con->get_array($sql);

$result = array();
foreach($areas as $area) {
	$row = array();
	$row[] = $area['id'];
	$row[] = $area['name'];
	$row[] = $area['lat'];
	$row[] = $area['lng'];
	$row[] = $area['radio'];
	$result[] = $row;
}

$response = array('data' => $result);

echo json_encode($response);

?>
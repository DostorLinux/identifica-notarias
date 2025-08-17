<?php
include_once __DIR__ . '/../include/config.php';
include_once __DIR__ . '/../include/core.php';
include_once __DIR__ . '/../include/simpledb.php';
include_once __DIR__ . '/../include/gate.php';
include_once __DIR__ . '/../include/portal.php';

portal_auth();

$con = new SimpleDb();

$sql = 'select id, name from user_group';
$groups = $con->get_array($sql);

$result = array();
foreach($groups as $group) {
	$row = array();
	$row[] = $group['id'];
	$row[] = $group['name'];
	$result[] = $row;
}

$response = array('data' => $result);

echo json_encode($response);

?>
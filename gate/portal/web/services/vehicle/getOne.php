<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$plate = getParameter('plate');
if (empty($plate)) {
	portal_abort('MANDATORY', 'plate');
}

$sql = 'select plate, description, active, isDenied, deniedNote, created, updated from vehicle where plate = ?';
$vehicle = $con->get_row($sql, $plate);

if (empty($vehicle)) {
	portal_abort('VEHICLE_NOT_FOUND');
}

$result = array('vehicle' => $vehicle);

echo json_encode($result);

?>
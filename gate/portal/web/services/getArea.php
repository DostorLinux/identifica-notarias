<?php

include_once __DIR__ . '/../include/config.php';
include_once __DIR__ . '/../include/core.php';
include_once __DIR__ . '/../include/simpledb.php';
include_once __DIR__ . '/../include/gate.php';
include_once __DIR__ . '/../include/portal.php';

portal_auth();

$con = new SimpleDb();

$id = getParameter('id');
if (empty($id)) {
	portal_abort('MANDATORY', 'id');
}

$sql = 'select id, lat, lng, radio, name from area where id = ?';
$area = $con->get_row($sql, $id);

if (empty($area)) {
	portal_abort('AREA_NOT_FOUND');
}

$result = array('area' => $area);

echo json_encode($result);

?>
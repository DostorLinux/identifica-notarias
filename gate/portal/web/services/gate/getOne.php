<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';


$con = new SimpleDb();

$id = getParameter('id');
if (empty($id)) {
	portal_abort('MANDATORY', 'id');
}

$sql = 'select g.id, g.name, g.description, g.placeId,
       p.name placeName,
       g.created ,g.updated 

from gate g
left join place p on g.placeId = p.id
where g.id = ? ';
$entity = $con->get_row($sql, $id);

if (empty($entity)) {
	portal_abort('GATE_NOT_FOUNT');
}

$result = array('gate' => $entity);

echo json_encode($result);

?>
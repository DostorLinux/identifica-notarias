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

$sql = 'select d.id, d.name, d.hasDependency, d.hasPlate, d.dependencyId, d.maxMinutes, d.placeId,
         d.lng, d.lat, d.radio, d.allowInvitation, d.location,
         p.name placeName,
         d.created, d.updated 
from device d
left join place p on d.placeId = p.id
where d.id = ? ';

$entity = $con->get_row($sql, $id);

if (empty($entity)) {
	portal_abort('DEVICE_NOT_FOUND');
}
//get user_types
//table device_user_types
$sql = 'select user_type from device_user_types where device_id = ?';
$user_types = $con->get_array($sql, $id);


$user_typesKey = [];
foreach ($user_types as $user_type) {
    $user_typesKey[] = $user_type['user_type'];
}

$entity['user_types'] = $user_typesKey;

$result = array('device' => $entity);

echo json_encode($result);

?>
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




$sql = 'select id, name, description, company, created, updated from allow_group where id =? ';
$entity = $con->get_row($sql, $id);

if (empty($entity)) {
	portal_abort('ALLOW_GROUP_NOT_FOUND');
}

$result = array('allowGroup' => $entity);

echo json_encode($result);

?>
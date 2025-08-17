<?php

include_once __DIR__ . '/../include/config.php';
include_once __DIR__ . '/../include/core.php';
include_once __DIR__ . '/../include/simpledb.php';
include_once __DIR__ . '/../include/gate.php';
include_once __DIR__ . '/../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$id = getParameter('id');
if (empty($id)) {
	portal_abort('MANDATORY', 'id');
}

$sql = 'select name from user_group where id = ?';
$group = $con->get_row($sql, $id);

if (empty($group)) {
	portal_abort('GROUP_NOT_FOUND');
}

$sql = 'select areaId id from area_group where userGroupId = ?';
$area_rows = $con->get_array($sql, $id);

$areas = array();
foreach($area_rows as $area_row) {
    $areas[] = $area_row["id"];
}

$group['areas'] = $areas;

$result = array('group' => $group);

echo json_encode($result);

?>
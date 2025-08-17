<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$plate    = getParameter('plate');
if (empty($plate)) {
	portal_abort('MANDATORY', 'plate');
}

// get pagination parameters
$request = json_from_post_body();
$page    = (int)api_get_number($request, 'page')-1;
$size    = (int)api_get_number($request, 'size');

if ($page < 0) $page = 0;
if ($size <= 0) $size = 10;
$offset = $page * $size;

$tables = 'user u, driver d';
$where  = 'where d.plate = ? and d.userId = u.id';
$params = array($plate);

$sql = 'select u.id userId, u.doc_id, u.first_name, u.last_name, d.plate '.
    "from $tables $where ".
    "order by u.last_name, u.first_name limit $offset, $size";
$drivers = $con->get_array($sql, $params);

// count all matching rows
$sql = "select count(1) from $tables $where";
$total = (int)$con->get_one($sql, $params);
$response = array('data' => $drivers, 'total' => $total);

echo json_encode($response);

?>
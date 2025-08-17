<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$companyId = getParameter('companyId');
if (empty($companyId)) {
	portal_abort('MANDATORY', 'companyId');
}

// get pagination parameters
$request = json_from_post_body();
$page    = (int)api_get_number($request, 'page')-1;
$size    = (int)api_get_number($request, 'size');

if ($page < 0) $page = 0;
if ($size <= 0) $size = 10;
$offset = $page * $size;

$tables = 'user u, worker w';
$where  = 'where w.companyId = ? and w.userId = u.id';
$params = array($companyId);

$con = new SimpleDb();
$sql = 'select u.id, u.doc_id, u.username, u.first_name, u.last_name '.
    "from $tables $where limit $offset, $size";
$workers = $con->get_array($sql, $params);

// count all matching rows
$sql = "select count(1) from $tables $where";
$total = (int)$con->get_one($sql, $params);
$response = array('data' => $workers, 'total' => $total);

echo json_encode($response);

?>
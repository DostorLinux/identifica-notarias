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

$tables = 'vehicle v, company c, vehicle_in_company vc';
$where  = 'c.id = ? and v.plate = vc.plate and c.id = vc.companyId';
$params = array($companyId);

$con = new SimpleDb();
$sql = 'select v.plate, v.description, c.id companyId, c.rut, c.name '.
    "from $tables where $where limit $offset, $size";

$vehicles = $con->get_array($sql, $params);

// count all matching rows
$sql = "select count(1) from $tables where $where";
$total = (int)$con->get_one($sql, $params);
$response = array('data' => $vehicles, 'total' => $total);

echo json_encode($response);

?>
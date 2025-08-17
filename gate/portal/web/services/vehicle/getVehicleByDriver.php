<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/api.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();
$driver = getParameter("driverId");

$request = json_from_post_body();
$column    = sanitize(api_get($request, 'column'));
$direction = sanitize(api_get($request, 'direction'));
$page      = (int)api_get_number($request, 'page')-1;
$size      = (int)api_get_number($request, 'size');
$filter    = sanitize(api_get($request, 'filter'));

$fields = 'v.plate, v.description, v.active, v.isDenied, v.created, v.updated, v.deniedNote ';
$tables = 'vehicle v, driver d';
$where  = ' d.userId = ? and v.plate=d.plate and  v.active = ? ';
$params = array($driver,1);

// create order expression
$order  = 'order by created desc';

if (!empty($order) && !empty($direction)) {
    $direction = $direction == 'asc' ? $direction : 'desc';
    $order = "order by $column $direction";
}

// create filter expression
if (!empty($filter)) {
    $where .= ' and (v.plate like ? or v.description like ?)';
    $filter_expr = "%$filter%";
    $params = array_merge($params, array($filter_expr, $filter_expr));
}

// row start for limit expression
$offset = $page * $size;

$con = new SimpleDb();
$sql = "select $fields from $tables where $where $order limit $offset, $size";
$events = $con->get_array($sql, $params);

$result = array();
foreach($events as $event) {
    $row = array();
    $row[] = $event['plate'];
    $row[] = $event['description'];
    $row[] = $event['active'];
    $row[] = portal_get_formatted_time($event['created']);
    $row[] = portal_get_formatted_time($event['updated']);
    $row[] = $event['isDenied'];
    $row[] = $event['deniedNote'];
    $result[] = $row;
}

// count all matching rows
$sql = "select count(1) from $tables where $where";
$total = (int)$con->get_one($sql, $params);
$response = array('data' => $result, 'total' => $total);
echo json_encode($response);

?>
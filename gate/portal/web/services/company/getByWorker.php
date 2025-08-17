<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/api.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';


portal_auth_admin();


$worker = getParameter("workerId");

$request = json_from_post_body();
$column    = sanitize(api_get($request, 'column'));
$direction = sanitize(api_get($request, 'direction'));
$page      = (int)api_get_number($request, 'page')-1;
$size      = (int)api_get_number($request, 'size');
$filter    = sanitize(api_get($request, 'filter'));



$fields = 'c.id, c.name, c.rut, c.isDenied, c.deniedNote, c.address, c.created ';
$tables = 'company c, worker w';
$where  = ' w.userId=? and w.companyId = c.id  and c.active = ?';
$params = array($worker,1);



// create order expression
$order  = 'order by created desc';
if (!empty($order) && !empty($direction)) {
    $direction = $direction == 'asc' ? $direction : 'desc';
    $order = "order by $column $direction";
}

// create filter expression
if (!empty($filter)) {
    $where .= ' and (c.rut like ? or c.name like ? or c.address like ? )';
    $filter_expr = "%$filter%";
    $params = array_merge($params, array($filter_expr, $filter_expr, $filter_expr, ));
}

// row start for limit expression
$offset = $page * $size;

$con = new SimpleDb();
$sql = "select $fields from $tables where $where $order limit $offset, $size";
$events = $con->get_array($sql, $params);

$result = array();
foreach($events as $event) {
    $row = array();
    $row[] = $event['id'];
    $row[] = $event['rut'];
    $row[] = $event['name'];
    $row[] = $event['address'];
    $row[] = portal_get_formatted_time($event['created']);
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
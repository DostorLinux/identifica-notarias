<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/api.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';


portal_auth_admin();

$request = json_from_post_body();
$column    = sanitize(api_get($request, 'column'));
$direction = sanitize(api_get($request, 'direction'));
$page      = (int)api_get_number($request, 'page')-1;
$size      = (int)api_get_number($request, 'size');
$filter    = sanitize(api_get($request, 'filter'));



$fields = 'g.id, g.name, g.description, g.placeId, p.name placeName, g.created ,g.updated';
$tables = 'gate g left join place p on g.placeId = p.id';

$params = array(1);

// create order expression
$order  = 'order by id asc';
if (!empty($order) && !empty($direction)) {
    $direction = $direction == 'asc' ? $direction : 'desc';
    $order = "order by $column $direction";
}

// create filter expression
if (!empty($filter)) {
    $filter_expr = "%$filter%";
    $params = array_merge($params, array($filter_expr, $filter_expr, $filter_expr, ));
}

// row start for limit expression
$offset = $page * $size;

$con = new SimpleDb();
$sql = "select $fields from $tables  $order limit $offset, $size";
$events = $con->get_array($sql, $params);

$result = array();

//g.name, g.hasDependecy, g.dependencyId, g.maxMinutes, g.created ,g.updated

foreach($events as $event) {
    $row = array();
    $row[] = $event['id'];
    $row[] = $event['name'];
    $row[] = $event['description'];
    $row[] = $event['placeId'];
    $row[] = $event['placeName'];
    $row[] = portal_get_formatted_time($event['created']);
    $row[] = portal_get_formatted_time($event['updated']);
    $result[] = $row;
}

// count all matching rows
$sql = "select count(1) from $tables  ";
$total = (int)$con->get_one($sql, $params);
$response = array('data' => $result, 'total' => $total);
echo json_encode($response);

?>
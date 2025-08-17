<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/api.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';


//print session


portal_auth_admin();

$role = portal_get_role();


$request = json_from_post_body();
$column    = sanitize(api_get($request, 'column'));
$direction = sanitize(api_get($request, 'direction'));
$page      = (int)api_get_number($request, 'page')-1;
$size      = (int)api_get_number($request, 'size');
$filter    = sanitize(api_get($request, 'filter'));


/*create table allow_group(
    id int auto_increment primary key,
    name varchar(400),
    description varchar(4000),
    deleted TINYINT(1) default 0,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

*/

$fields = ' g.id, g.name, g.company, g.description, g.created, g.updated ';
$tables = 'allow_group g';

$params = array(1);

$where = 'where g.deleted = 0';

// create order expression
$order  = 'order by created desc';
if (!empty($order) && !empty($direction)) {
    $direction = $direction == 'asc' ? $direction : 'desc';
    $order = "order by $column $direction";
}

// create filter expression
if (!empty($filter)) {
    $where .= ' and (g.name like ? or g.description like ?, g.company like ?)';
    $filter_expr = "%$filter%";
    $params = array_merge($params, array($filter_expr, $filter_expr, $filter_expr));
}

// row start for limit expression
$offset = $page * $size;

$con = new SimpleDb();
$sql = "select $fields from $tables $where  $order limit $offset, $size";
$events = $con->get_array($sql, $params);

$result = array();


foreach($events as $event) {
    $row = array();
    $row[] = $event['id'];
    $row[] = $event['name'];
    $row[] = $event['description'];
    $row[] = $event['company'];
    $row[] = portal_get_formatted_time($event['created']);
    $row[] = portal_get_formatted_time($event['updated']);
    $result[] = $row;
}

// count all matching rows
$sql = "select count(1) from $tables  $where";
$total = (int)$con->get_one($sql, $params);
$response = array('data' => $result, 'total' => $total);
echo json_encode($response);

?>
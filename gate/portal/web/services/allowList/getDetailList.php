<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/api.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';


portal_auth_admin();
$date = getParameter("day");
$request = json_from_post_body();
$column    = sanitize(api_get($request, 'column'));
$direction = sanitize(api_get($request, 'direction'));
$page      = (int)api_get_number($request, 'page')-1;
$size      = (int)api_get_number($request, 'size');
$filter    = sanitize(api_get($request, 'filter'));

/*
 * id int auto_increment primary key,
    doc_id varchar(50),
    first_name varchar(100),
    last_name varchar(100),
    plate varchar(10),
    access_day date,
    user_id int,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
 * */

$fields = 'a.id, u.doc_id, a.profile, u.first_name, u.last_name, a.plate, a.access_day, u.id user_id, a.created, a.updated, a.company ';
$tables = 'allow_list a, user u';

$params = array();

// create order expression
$order  = 'order by a.id asc';
if (!empty($order) && !empty($direction)) {
    $direction = $direction == 'asc' ? $direction : 'desc';
    $order = "order by $column $direction";
}
$where = "DATE(a.access_day) = ?";
$params = array($date);


// create filter expression
if (!empty($filter)) {
    $where .= ' and (a.plate like ? or a.company like ? or u.first_name like ? or u.last_name like ? or u.doc_id like ?)';
    $filter_expr = "%$filter%";
    $params = array_merge($params, array($filter_expr, $filter_expr, $filter_expr, $filter_expr, $filter_expr));
}
// row start for limit expression



$offset = $page * $size;

$where .= ' and u.id = a.user_id';

$con = new SimpleDb();
$sql = "select $fields from $tables where $where  $order limit $offset, $size";
$events = $con->get_array($sql, $params);
$result = array();

//id int auto_increment primary key,
//    doc_id varchar(50),
//    first_name varchar(100),
//    last_name varchar(100),
//    plate varchar(10),
//    access_day date,
//    user_id int,
//    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
foreach($events as $event) {
    $row = array();
    $row[] = $event['id'];
    $row[] = $event['doc_id'];
    $row[] = $event['first_name'];
    $row[] = $event['last_name'];
    $row[] = $event['plate'];
    $row[] = $event['profile'];
    $row[] = $event['company'];
    $result[] = $row;
}

// count all matching rows
$sql = "select count(1) from $tables where $where ";
$total = (int)$con->get_one($sql, $params);
$response = array('data' => $result, 'total' => $total);
echo json_encode($response);

?>
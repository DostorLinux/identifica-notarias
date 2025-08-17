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

$groupId = getParameter('groupId');

//mandaroty
if (empty($groupId)) {
    portal_abort('MANDATORY', 'groupId');
}

$request = json_from_post_body();
$column    = sanitize(api_get($request, 'column'));
$direction = sanitize(api_get($request, 'direction'));
$page      = (int)api_get_number($request, 'page')-1;
$size      = (int)api_get_number($request, 'size');
$filter    = sanitize(api_get($request, 'filter'));


/*

create table allow_group_user(
    id int auto_increment primary key,
    allow_group_id int,
    first_name varchar(100),
    last_name varchar(100),
    doc_id varchar(15),
    plate varchar(10),
    company varchar(400),
    profile    varchar(20),
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


*/

$fields = ' ag.id, ag.first_name, ag.last_name, ag.doc_id, ag.plate, ag.allow_group_id, g.company, ag.profile ,ag.created, ag.updated ';
$tables = 'allow_group_user ag, allow_group g ';

$params =[];

$where = 'where  ag.allow_group_id = ? and ag.allow_group_id = g.id ';
$params[] = $groupId;

// create order expression
$order  = 'order by created desc';
if (!empty($order) && !empty($direction)) {
    $direction = $direction == 'asc' ? $direction : 'desc';
    $order = "order by $column $direction";
}

// create filter expression
if (!empty($filter)) {
    $where .= ' and (ag.first_name like ? or ag.last_name like ? or ag.doc_id like ? or ag.plate like ? or g.company like ?  )';
    $filter_expr = "%$filter%";
    $params = array_merge($params, array($filter_expr, $filter_expr, $filter_expr, $filter_expr, $filter_expr));

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
    $row[] = $event['allow_group_id'];
    $row[] = $event['first_name'];
    $row[] = $event['last_name'];
    $row[] = $event['doc_id'];
    $row[] = $event['plate'];
    $row[] = $event['company'];
    $row[] = $event['profile'];

    $row[] = portal_get_formatted_time($event['created']);
    $row[] = portal_get_formatted_time($event['updated']);
    $result[] = $row;
}

// count all matching rows
$sql = "select count(1) from $tables $where ";
$total = (int)$con->get_one($sql, $params);
$response = array('data' => $result, 'total' => $total);
echo json_encode($response);

?>
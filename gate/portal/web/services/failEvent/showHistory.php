<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/api.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth();

$request = json_from_post_body();
$column    = sanitize(api_get($request, 'column'));
$direction = sanitize(api_get($request, 'direction'));
$page      = (int)api_get_number($request, 'page')-1;
$size      = (int)api_get_number($request, 'size');
$filter    = sanitize(api_get($request, 'filter'));
$advanced = api_get($request,'advanced');

// Handle advanced filters
$deviceId = null;
if(isset($advanced) && isset($advanced['deviceId'])) {
    $deviceId = $advanced['deviceId'];
}

$fields = 'mh.id, mh.device_id, mh.user_id, mh.shot_filename, ' .
    'mh.created, u.first_name, u.last_name, u.doc_id, ' .
    'd.name device_name, p.name place_name';
$tables = 'match_history mh ';
$join   = 'left join user u on u.id = mh.user_id ';
$join  .= 'left join device d on d.id = mh.device_id ';
$join  .= 'left join place p on p.id = d.placeId ';
$where  = 'mh.deleted = 0 ';


$params = array();

if ($deviceId !== null) {
    $where .= ' and mh.device_id = ?';
    $params[] = $deviceId;
}

// restrict data access
if ($auth_user_role != PROFILE_ADMIN && $auth_user_role != PROFILE_GATE && $auth_user_role != PROFILE_SUPER_ADMIN) {
    $where .= ' and mh.user_id = ?';
    $params[] = $auth_user_id;
}

// create order expression
$order  = 'order by mh.created desc';
if (!empty($column) && !empty($direction)) {
    $direction = $direction == 'asc' ? $direction : 'desc';
    $order = "order by $column $direction";
}

// create filter expression
if (!empty($filter)) {
    $where .= ' and (u.doc_id like ? or u.first_name like ? or u.last_name like ? or mh.shot_filename like ?)';
    $filter_expr = "%$filter%";
    $params = array_merge($params, array($filter_expr, $filter_expr, $filter_expr, $filter_expr));
}

// row start for limit expression
$offset = $page * $size;

$con = new SimpleDb();
$sql = "select $fields from $tables $join where $where $order limit $offset, $size";

$matches = $con->get_array($sql, $params);

// get timezone offset
$timezone = timezone_open("America/Santiago");
$datetime_cl = date_create("now", timezone_open("UTC"));
$datetime_offset = timezone_offset_get($timezone, $datetime_cl);

$result = array();
foreach($matches as $match) {
    $row = array();
    $row[] = $match['id'];
    $row[] = $match['device_id'];
    $row[] = $match['user_id'];

    // Check if there's user information
    if (!empty($match['first_name']) || !empty($match['last_name'])) {
        $row[] = trim($match['first_name'] . ' ' . $match['last_name']);
    } else {
        $row[] = 'NN';
    }

    $row[] = !empty($match['doc_id']) ? $match['doc_id'] : 'NN';
    $row[] = $match['shot_filename'];
    $row[] = $match['device_name'];
    $row[] = $match['place_name'];
    $row[] = gmdate("Y-m-d H:i:s", strtotime($match['created'])+$datetime_offset);
    $result[] = $row;
}

// count all matching rows
$sql = "select count(1) from $tables $join where $where";
$total = (int)$con->get_one($sql, $params);

$response = array('data' => $result, 'total' => $total);

echo json_encode($response);
?>
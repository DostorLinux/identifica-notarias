<?php
include_once __DIR__ . '/../include/config.php';
include_once __DIR__ . '/../include/core.php';
include_once __DIR__ . '/../include/simpledb.php';
include_once __DIR__ . '/../include/api.php';
include_once __DIR__ . '/../include/gate.php';
include_once __DIR__ . '/../include/portal.php';

portal_auth();

$type= getParameter("type");
$request = json_from_post_body();
$column    = sanitize(api_get($request, 'column'));
$direction = sanitize(api_get($request, 'direction'));
$page      = (int)api_get_number($request, 'page')-1;
$size      = (int)api_get_number($request, 'size');
$filter    = sanitize(api_get($request, 'filter'));
$advanced = api_get($request,'advanced');

//{placeId: "2", deviceId: null}
$placeId=null;
$deviceId=null;
if(isset($advanced)){

    if ($advanced['placeId']!=null){
        $placeId = $advanced['placeId'];
    }
    if ($advanced['deviceId']!=null){
        $deviceId = $advanced['deviceId'];
    }
}

$device= ($deviceId!=null)?$deviceId:getParameter("device");

$fields = 'e.id, u.doc_id, u.first_name, u.last_name, u.nationality, u.id userId,'.
        'e.plate, '.
        'u.pub_id, u.isDenied,u.deniedNote, '.
       'e.warning, '.
       'e.entry, e.hash, '.
    'e.created, e.deviceId, e.lat, e.lng, d.name device_name, p.name place_name';
$tables = 'user u, event e ';
$join   = 'left join device d on d.id = e.deviceId ';
$join  .= 'left join place p on p.id = d.placeId ';
$where  = 'e.userId = u.id ';

if (isset($device) && $device != '') {
    $where .= ' and e.deviceId = ?';
    $params = array( $device);
} else {
    $params = array();
}

if (isset($placeId)&&$placeId!=null){
    $where .= 'and p.id = ?';
    $params[] = $placeId;
}

// restrict data access
if ($auth_user_role != PROFILE_ADMIN && $auth_user_role != PROFILE_GATE && $auth_user_role != PROFILE_SUPER_ADMIN) {
    $where .= ' and u.id = ?';
    $params[] = $auth_user_id;
}

// create order expression
$order  = 'order by created desc';
if (!empty($order) && !empty($direction)) {
    $direction = $direction == 'asc' ? $direction : 'desc';
    $order = "order by $column $direction";
}

// create filter expression
if (!empty($filter)) {
    $where .= ' and (u.doc_id like ? or u.first_name like ? or u.last_name like ? or u.nationality like ? )';
    $filter_expr = "%$filter%";
    $params = array_merge($params, array($filter_expr, $filter_expr, $filter_expr,$filter_expr ));
}

// row start for limit expression
$offset = $page * $size;

$con = new SimpleDb();
$sql = "select $fields from $tables $join where $where $order limit $offset, $size";

$events = $con->get_array($sql, $params);
// get timezone offset
$timezone = timezone_open("America/Santiago"); 
$datetime_cl = date_create("now", timezone_open("UTC"));
$datetime_offset = timezone_offset_get($timezone, $datetime_cl);

$result = array();
foreach($events as $event) {
	$row = array();
	$row[] = $event['id'];
	$row[] = $event['doc_id'];
	$row[] = $event['first_name'].' '.$event['last_name'];
    $row[] = $event['userId'];
    $row[] = $event['pub_id'];
    $row[] = $event['isDenied'];
    $row[] = $event['deniedNote'];
    $row[] = $event['entry'];
	$row[] = gmdate("Y-m-d H:i:s", $event['created']+$datetime_offset);
	$row[] = $event['device_name'];
	$row[] = $event['lat'];
	$row[] = $event['lng'];
    $row[] = $event['nationality'];
    $row[] = $event['warning'];
    $row[] = $event['plate'];
    $row[] = $event['place_name'];
	$result[] = $row;
}


if(isset($type)&&($type=="tracking")){
    $total = $size;
}else {
// count all matching rows
    $sql = "select count(1) from $tables $join where $where";
    $total = (int)$con->get_one($sql, $params);
}
$response = array('data' => $result, 'total' => $total);

echo json_encode($response);



?>

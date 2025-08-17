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




$fields = 'd.id, d.name, d.hasDependency, d.hasPlate, d.dependencyId, d.maxMinutes, d.placeId, p.name placeName,
        d.lng, d.lat, d.radio, d.created ,d.updated, d.allowInvitation';
$tables = 'device d left join place p on d.placeId = p.id ';

$params = array(1);

//gatePlace by user
if ($role == "gate") {
    //place_user
    $tables .= ' left join place_user pu on d.placeId = pu.placeId ';
    $where = ' where pu.userId = ? ';
    $params = array($auth_user_id);
} else {
    $where = '';
}

// create order expression
$order  = 'order by created desc';
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
$sql = "select $fields from $tables $where  $order limit $offset, $size";
$events = $con->get_array($sql, $params);

// Get all device IDs from the results
$deviceIds = array_map(function($event) {
    return $event['id'];
}, $events);

// Fetch user types for all devices in one query if there are results
$deviceUserTypes = [];
if (!empty($deviceIds)) {
    $placeholders = str_repeat('?,', count($deviceIds) - 1) . '?';
    $sqlUserTypes = "SELECT device_id, user_type FROM device_user_types WHERE device_id IN ($placeholders)";
    $userTypesResults = $con->get_array($sqlUserTypes, $deviceIds);

    // Group user types by device_id
    foreach ($userTypesResults as $userType) {
        if (!isset($deviceUserTypes[$userType['device_id']])) {
            $deviceUserTypes[$userType['device_id']] = [];
        }
        $deviceUserTypes[$userType['device_id']][] = $userType['user_type'];
    }
}

$result = array();


//d.name, d.hasDependecy, d.dependencyId, d.maxMinutes, d.created ,d.updated

foreach($events as $event) {
    $row = array();
    $row[] = $event['id'];
    $row[] = $event['name'];
    $row[] = $event['hasDependency'];
    $row[] = $event['hasPlate'];
    $row[] = $event['dependencyId'];
    $row[] = $event['maxMinutes'];
    $row[] = $event['placeId'];
    $row[] = $event['placeName'];
    $row[] = $event['lat'];
    $row[] = $event['lng'];
    $row[] = $event['radio'];
    $row[] = portal_get_formatted_time($event['created']);
    $row[] = portal_get_formatted_time($event['updated']);
    $row[] = isset($deviceUserTypes[$event['id']]) ? $deviceUserTypes[$event['id']] : [];
    $row[] = isset($event['allowInvitation']) ? $event['allowInvitation'] : 0;
    $result[] = $row;
}

// count all matching rows
$sql = "select count(1) from $tables  ";
$total = (int)$con->get_one($sql, $params);
$response = array('data' => $result, 'total' => $total);
echo json_encode($response);

?>
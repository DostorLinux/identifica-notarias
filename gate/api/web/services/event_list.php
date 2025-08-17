<?php

require __DIR__.'/../vendor/autoload.php';

include_once __DIR__.'/../include/config.php';
include_once __DIR__.'/../include/simpledb.php';
include_once __DIR__.'/../include/api.php';
include_once __DIR__.'/../include/gate.php';

api_json_header();
$user_doc_id = getParameter('doc_id');
if ($user_doc_id == 'self') {
    $auth_info = gate_jwt_auth();
    $user_doc_id = $auth_info['doc_id'];
} else {
    $auth_info = gate_jwt_auth_admin();
}

$date_start = api_get_mandatory($_GET, 'date_start');
$date_end   = api_get_mandatory($_GET, 'date_end');


$date_format = 'Y-m-d H:i:s';
$ts_start = DateTime::createFromFormat($date_format, $date_start.' 00:00:00')->getTimestamp();
$ts_end   = DateTime::createFromFormat($date_format, $date_end.' 23:59:59')->getTimestamp();

$con = new SimpleDb();
$sql = 'select e.entry, e.location, e.lat, e.lng, e.created, u.doc_id, u.sec_id, u.username, u.first_name, u.last_name '.
    'from user u, event e '.
    'where u.id = e.userId and e.created between ? and ?';
$params = array($ts_start, $ts_end);
if (!empty($user_doc_id)) {
    $sql .= 'and u.doc_id = ?';
    $params[] = $user_doc_id;
}

$events = $con->get_array($sql, $params);
$response = array('events' => $events);

echo json_encode($response);

?>
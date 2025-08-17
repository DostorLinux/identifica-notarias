<?php 

include_once 'include/core.php';

$filter = '/api/v1/';

$request = $_SERVER['REQUEST_URI'];
if (!startsWith($request, $filter)) {
	error_log("unknown request $request");
	die();
}

$endpoint = str_replace($filter, '', $request);
$delim = strpos($endpoint, '?');
if ($delim) {
	$endpoint = substr($endpoint, 0, $delim);
}

$endpoints = array(
		'ping'       => 'ping.php',
		'ping_auth'  => 'ping_auth.php',
		'login'      => 'login.php',
		'event/save' => 'event_save.php',
		'event/list' => 'event_list.php',
		'event/last' => 'event_last.php',
        'device/last_access' => 'get_last_device_access.php',
		'user/save'  => 'user_save.php',
		'user/del'   => 'user_del.php',
		'user/picture'   => 'user_get_picture.php',
		'doc_id/exists'  => 'user_doc_id_exists.php',
        'parking/has_notification'   => 'get_vehicle_with_notifications.php',
		'allow/save'     => 'allow_save.php',
		'image/validate' => 'image_validate.php',
		'image/compare'  => 'image_compare.php',
		'document/read'  => 'document_read.php',
		'visitor/save_on_logbook'  => 'visitor_save_on_logbook.php',
		'company/save'   => 'company/save.php',
		'company/list'   => 'company/getList.php',
		'company/listget' => 'company/getListGET.php',
		'company/get'    => 'company/get.php',
		'company/delete' => 'company/delete.php',
);

if (!isset($endpoints[$endpoint])) {
	http_response_code(HTTP_NOT_FOUND);
	$msg = "unknown endpoint $endpoint";
	error_log($msg);
	die($msg);
}

include_once __DIR__.'/services/'.$endpoints[$endpoint];

?>
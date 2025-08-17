<?php

include_once __DIR__.'/include/config.php';
include_once __DIR__.'/include/test.php';
include_once __DIR__.'/../web/include/config.php';
include_once __DIR__.'/../web/include/api.php';

$resource = 'allow/save';
$headers = array('api-key' => $api_shared_key);

$request = array();
$request['doc_id']     = '22125443-6';
$request['first_name'] = 'Fernando';
$request['last_name']  = 'Poblete';
$request['plate']      = 'XDAF83';
$request['date']       = '2024-07-01';
$request['profile']    = 'transportista';
echo test_post($resource, $request, $headers);

?>
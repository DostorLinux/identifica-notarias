<?php

include_once __DIR__.'/include/config.php';
include_once __DIR__.'/include/test.php';
include_once __DIR__.'/../web/include/config.php';
include_once __DIR__.'/../web/include/api.php';

$resource = 'event/save';

$lat = -35.675147;
$lng = -71.542969;

$headers = array('api-key' => $api_shared_key);

$request = array();
$request['picture'] = base64_encode(file_get_contents(__DIR__.'/images/1234.jpg'));
$request['location'] = '1';
echo test_post($resource, $request, $headers);

$request['doc_id'] = $test_normal_user_id;
echo test_post($resource, $request, $headers);

?>
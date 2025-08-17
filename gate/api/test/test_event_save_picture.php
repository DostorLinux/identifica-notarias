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
$request['picture'] = base64_encode(file_get_contents(__DIR__.'/images/abbie.jpg'));
$request['entry'] = 'enter';
$request['location'] = '1';
$request['lat'] = $lat;
$request['lng'] = $lng;
$request['return_picture'] = true;

echo test_post($resource, $request, $headers);


?>
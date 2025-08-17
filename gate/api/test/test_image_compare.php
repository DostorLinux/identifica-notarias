<?php

include_once __DIR__.'/include/config.php';
include_once __DIR__.'/include/test.php';
include_once __DIR__.'/../web/include/config.php';
include_once __DIR__.'/../web/include/api.php';

$resource = 'image/compare';
$headers = array('api-key' => $api_shared_key);

$request = array();
$request['picture1'] = base64_encode(file_get_contents(__DIR__.'/images/abbie.jpg'));
$request['picture2'] = base64_encode(file_get_contents(__DIR__.'/images/abbie_vertical.jpg'));

echo test_post($resource, $request, $headers);


?>
<?php

include_once __DIR__.'/include/config.php';
include_once __DIR__.'/include/test.php';
include_once __DIR__.'/../web/include/config.php';
include_once __DIR__.'/../web/include/api.php';

$resource = 'document/read';
$headers = array('api-key' => $api_shared_key);

$request = array();
$request['picture'] = base64_encode(file_get_contents(__DIR__.'/images/document.jpg'));

echo test_post($resource, $request, $headers);


?>
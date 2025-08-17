<?php

include_once __DIR__.'/include/config.php';
include_once __DIR__.'/include/test.php';
include_once __DIR__.'/../web/include/config.php';
include_once __DIR__.'/../web/include/api.php';

$headers = array('api-key' => $api_shared_key);

$resource = 'event/last';

$request = array();
echo test_get($resource, $request, $headers);

$request['location'] = 2;
echo test_get($resource, $request, $headers);

?>
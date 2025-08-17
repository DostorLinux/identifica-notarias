<?php

include_once __DIR__.'/include/config.php';
include_once __DIR__.'/include/test.php';
include_once __DIR__.'/../web/include/config.php';
include_once __DIR__.'/../web/include/api.php';

$resource = 'user/picture';

$headers = array('api-key' => $api_shared_key);

$request = array('doc_id' => '13437725-9');

echo test_get($resource, $request, $headers);


?>
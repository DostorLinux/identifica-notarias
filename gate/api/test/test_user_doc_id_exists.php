<?php

include_once __DIR__.'/include/config.php';
include_once __DIR__.'/include/test.php';
include_once __DIR__.'/../web/include/config.php';
include_once __DIR__.'/../web/include/api.php';

$headers = array('api-key' => $api_shared_key);

$resource = 'doc_id/exists';

$request = array(); // INVALID REQUEST
echo test_get($resource, $request, $headers);

$request['doc_id'] = 'invalid_doc_id'; // NOT FOUND
echo test_get($resource, $request, $headers);

$request['doc_id'] = '22.125.343-6'; // Valid coc id NOT normalized
echo test_get($resource, $request, $headers);

$request['doc_id'] = '22125343-6'; // Valid coc id normalized
echo test_get($resource, $request, $headers);


?>
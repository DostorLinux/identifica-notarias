<?php

include_once __DIR__.'/include/config.php';
include_once __DIR__.'/include/test.php';
include_once __DIR__.'/../web/include/config.php';
include_once __DIR__.'/../web/include/api.php';

$token   = test_login_with_admin_credentials();
$headers = test_build_auth_headers($token);

$resource = 'user/save';

$request = array();
$request['picture']    = base64_encode(file_get_contents(__DIR__.'/images/noface.jpg'));
$request['doc_id']     = '33.333.333-3';
$request['role']       = 'user';

echo test_post($resource, $request, $headers);

?>

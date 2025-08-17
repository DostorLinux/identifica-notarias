<?php

include_once __DIR__.'/include/config.php';
include_once __DIR__.'/include/test.php';
include_once __DIR__.'/../web/include/config.php';
include_once __DIR__.'/../web/include/api.php';

$resource = 'user/picture';

$token   = test_login_with_admin_credentials();
$headers = test_build_auth_headers($token);

$request = array();

echo test_get($resource, $request, $headers);


?>
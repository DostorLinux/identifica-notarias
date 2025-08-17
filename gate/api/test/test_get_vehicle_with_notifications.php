<?php

include_once __DIR__.'/include/config.php';
include_once __DIR__.'/include/test.php';
include_once __DIR__.'/../web/include/config.php';
include_once __DIR__.'/../web/include/api.php';

$token   = test_login_with_admin_credentials();
$headers = test_build_auth_headers($token);

$resource = 'parking/has_notification';

$request = array();
echo test_get($resource, $request, $headers);

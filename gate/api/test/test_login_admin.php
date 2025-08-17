<?php

include_once __DIR__.'/include/config.php';
include_once __DIR__.'/include/test.php';
include_once __DIR__.'/../web/include/config.php';
include_once __DIR__.'/../web/include/api.php';

echo "call admin login\n";
$login_info = test_login_with_credentials($test_admin_user, $test_admin_pass);
echo("login_info ".print_r($login_info, true));

echo "call auth call with token\n";
// now try an authenticated call
$token = $login_info['token'];
$resource = 'ping_auth';
$request  = array();
$headers = test_build_auth_headers($token);
echo("auth call response ".test_post($resource, $request, $headers));

?>
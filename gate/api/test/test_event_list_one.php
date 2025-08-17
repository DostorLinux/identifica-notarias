<?php

include_once __DIR__.'/include/config.php';
include_once __DIR__.'/include/test.php';
include_once __DIR__.'/../web/include/config.php';
include_once __DIR__.'/../web/include/api.php';

$token   = test_login_with_admin_credentials();
$headers = test_build_auth_headers($token);

$resource = 'event/list';

$request = array();
$request['doc_id']     = $test_normal_user_id;
$request['date_start'] = '2010-03-12';
$request['date_end']   = '2023-01-20';
echo test_get($resource, $request, $headers);

?>
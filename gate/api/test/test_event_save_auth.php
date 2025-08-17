<?php

include_once __DIR__.'/include/config.php';
include_once __DIR__.'/include/test.php';
include_once __DIR__.'/../web/include/config.php';
include_once __DIR__.'/../web/include/api.php';

$token = test_login_with_admin_credentials();
$headers = test_build_auth_headers($token);

$resource = 'event/save';

$lat = -35.675147;
$lng = -71.542969;

$request = array();
$request['doc_id'] = $test_normal_user_id;
$request['picture'] = base64_encode(file_get_contents(__DIR__.'/images/1234.jpg'));
$request['entry'] = 'enter';
$request['location'] = '1';
$request['lat'] = $lat;
$request['lng'] = $lng;

echo test_post($resource, $request, $headers);


?>
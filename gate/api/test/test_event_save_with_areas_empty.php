<?php

include_once __DIR__.'/include/config.php';
include_once __DIR__.'/include/test.php';
include_once __DIR__.'/../web/include/config.php';
include_once __DIR__.'/../web/include/api.php';

/*
use this for testing:
delete from area where id = 100000;
delete from user_group where id = 200000;
delete from user_group_user where userGroupId = 200000;
delete from area_group where areaId = 100000;
delete from area_user where areaId = 100000;

insert into area (id, lat, lng, radio) values(100000, -33.04654537816439, -71.44533386841354, 200);
insert into user_group (id, name) values(200000, 'test');
*/

$resource = 'event/save';

$lat = -33.04654537816439;
$lng = -71.44533386841354;

$headers = array('api-key' => $api_shared_key);

$request = array();
$request['picture'] = base64_encode(file_get_contents(__DIR__.'/images/abbie.jpg'));
$request['entry'] = 'enter';
$request['location'] = '1';
$request['lat'] = $lat;
$request['lng'] = $lng;

echo "should pass\n";
echo test_post($resource, $request, $headers);

$request['lat'] = -33.048289887666975;
$request['lng'] = -71.43963064565231;

echo "should pass\n";
echo test_post($resource, $request, $headers);

?>
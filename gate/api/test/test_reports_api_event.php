<?php

include_once __DIR__.'/include/config.php';
include_once __DIR__.'/include/test.php';
include_once __DIR__.'/../web/include/config.php';
include_once __DIR__.'/../web/include/api.php';
include_once __DIR__.'/../web/include/http.php';
include_once __DIR__.'/../web/include/reports.php';

$doc_id = '1';
$type = 'enter';
$lat = -35.675147;
$lng = -71.542969;

$result = reports_event_save($doc_id, $type, $lat, $lng);
print_r($result);

?>
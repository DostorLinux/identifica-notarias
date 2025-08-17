<?php

require __DIR__.'/../vendor/autoload.php';

include_once __DIR__.'/../include/config.php';
include_once __DIR__.'/../include/simpledb.php';
include_once __DIR__.'/../include/http.php';
include_once __DIR__.'/../include/api.php';
include_once __DIR__.'/../include/gate.php';

api_json_header();
api_validate_shared_key();

$request = json_from_post_body();

$doc_id     = api_get_mandatory($request, 'doc_id');
$first_name = api_get_mandatory($request, 'first_name');
$last_name  = api_get_mandatory($request, 'last_name');
$profile    = api_get_mandatory($request, 'profile');
$plate      = api_get_mandatory($request, 'plate');
$date       = api_get_mandatory($request, 'date');
$plate = strtoupper($plate);


$doc_id = gate_normalize_doc_id($doc_id);
$access_day_date = DateTimeImmutable::createFromFormat("Y-m-d", $date); // ping-pong just to validate the date
$access_day = $access_day_date->format("Y-m-d");

$con = new SimpleDb();
$allow_info = gate_allow($con, $doc_id, $first_name, $last_name, $plate, $access_day,$profile);

echo json_encode($allow_info);

?>
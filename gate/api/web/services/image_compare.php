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
$picture1 = api_get_mandatory($request, 'picture1');
$picture2 = api_get_mandatory($request, 'picture2');

$face_image1 = base64_decode($picture1);
$face_image2 = base64_decode($picture2);

$vector1 = gate_get_face_signature_from_image($face_image1, $gate_check_mask);
$vector2 = gate_get_face_signature_from_image($face_image2, $gate_check_mask);

$distance = gate_match_vector($vector1, $vector2);

$response = array('distance' => $distance);

echo json_encode($response);

?>
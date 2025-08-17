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
$picture = api_get_mandatory($request, 'picture');

$doc_image = base64_decode($picture);
$info = gate_document_read($doc_image);

echo json_encode($info);

?>
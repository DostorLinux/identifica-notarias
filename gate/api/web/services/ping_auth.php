<?php

require __DIR__.'/../vendor/autoload.php';

include_once __DIR__.'/../include/config.php';
include_once __DIR__.'/../include/simpledb.php';
include_once __DIR__.'/../include/api.php';
include_once __DIR__.'/../include/gate.php';

api_json_header();

$token = api_get_bearer_token();
if (empty($token)) api_abort('NO TOKEN');

echo json_encode(gate_jwt_get_auth_info($token));


?>

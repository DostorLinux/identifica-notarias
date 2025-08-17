<?php

require __DIR__.'/../../vendor/autoload.php';

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/http.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/api.php';
include_once __DIR__ . '/../../include/gate.php';

$response = array(
    'requires_pin'     => $portal_requires_pin,
    'confirm_identity' => $portal_confirm_identity,
    'lang'=>'es',
    'use_time_photo'=>true,
    'time_photo_sec'=>3
);

echo json_encode($response);

?>
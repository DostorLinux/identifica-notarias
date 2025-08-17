<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth();


$response = array(
    'max_devices' => $portal_max_devices,
    'max_gates' => $portal_max_gates,
    'max_places' => $portal_max_places,
    'show_gates' => $portal_show_gates,
    'show_buffer' => $portal_show_buffer,
    'user_types' => $user_types_csv,

);

echo json_encode($response);
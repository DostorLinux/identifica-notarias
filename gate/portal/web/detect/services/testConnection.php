<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

echo json_encode([
    'success' => true,
    'message' => 'Conexión exitosa',
    'timestamp' => date('Y-m-d H:i:s'),
    'params' => $_GET
]);

?>
<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Datos ficticios para prueba
$mockRecords = [
    [
        'id' => 'mock-1',
        'rut' => '13878116-K',
        'firstName' => 'Samuel',
        'lastName' => 'Enrique Pizarro Silva',
        'fullName' => 'Samuel Enrique Pizarro Silva',
        'auditNumber' => 'CERT-' . substr(time(), -6) . 'A1B2C',
        'eventId' => time(),
        'timestamp' => date('Y-m-d H:i:s'),
        'userId' => 1,
        'source' => 'mock'
    ],
    [
        'id' => 'mock-2',
        'rut' => '12345678-9',
        'firstName' => 'Usuario',
        'lastName' => 'De Prueba',
        'fullName' => 'Usuario De Prueba',
        'auditNumber' => 'CERT-' . substr(time()-3600, -6) . 'X9Y8Z',
        'eventId' => time()-3600,
        'timestamp' => date('Y-m-d H:i:s', time()-3600),
        'userId' => 2,
        'source' => 'mock'
    ]
];

$searchRut = isset($_GET['searchRut']) ? $_GET['searchRut'] : '';
$searchAuditNumber = isset($_GET['searchAuditNumber']) ? $_GET['searchAuditNumber'] : '';

// Filtrar por búsqueda si se proporciona
$filteredRecords = $mockRecords;

if (!empty($searchRut)) {
    $filteredRecords = array_filter($filteredRecords, function($record) use ($searchRut) {
        return stripos($record['rut'], $searchRut) !== false;
    });
}

if (!empty($searchAuditNumber)) {
    $filteredRecords = array_filter($filteredRecords, function($record) use ($searchAuditNumber) {
        return stripos($record['auditNumber'], $searchAuditNumber) !== false;
    });
}

$response = [
    'success' => true,
    'data' => array_values($filteredRecords),
    'pagination' => [
        'page' => 1,
        'size' => 20,
        'total' => count($filteredRecords),
        'totalPages' => 1
    ]
];

echo json_encode($response);

?>
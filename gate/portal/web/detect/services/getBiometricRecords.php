<?php

// Headers para permitir acceso desde React Native
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Manejar preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require __DIR__.'/../../vendor/autoload.php';

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/http.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';

$page = getParameter('page', 1);
$size = getParameter('size', 20);
$searchRut = getParameter('searchRut');
$searchAuditNumber = getParameter('searchAuditNumber');

error_log("Getting biometric records - Page: $page, Size: $size, SearchRUT: $searchRut, SearchAudit: $searchAuditNumber");

$con = new SimpleDb();

try {
    // Construir query base que une captured_images con user para obtener datos completos
    $query = "
        SELECT 
            ci.rut,
            ci.event_id,
            ci.audit_number,
            ci.operator_rut,
            ci.created_at,
            u.first_name,
            u.last_name,
            u.doc_id,
            u.id as user_id
        FROM captured_images ci
        LEFT JOIN user u ON ci.rut = u.doc_id
        WHERE 1=1
    ";
    
    $params = array();
    
    // Agregar filtros de búsqueda
    if (!empty($searchRut)) {
        $query .= " AND ci.rut LIKE ?";
        $params[] = '%' . $searchRut . '%';
    }
    
    if (!empty($searchAuditNumber)) {
        $query .= " AND ci.audit_number LIKE ?";
        $params[] = '%' . $searchAuditNumber . '%';
    }
    
    // Ordenar por fecha más reciente primero
    $query .= " ORDER BY ci.created_at DESC";
    
    // Calcular offset para paginación
    $offset = ($page - 1) * $size;
    $query .= " LIMIT $size OFFSET $offset";
    
    error_log("Executing query: " . $query);
    error_log("With params: " . json_encode($params));
    
    if (empty($params)) {
        $records = $con->get_array($query);
    } else {
        $records = $con->get_array($query, $params);
    }
    
    // Contar total de registros para paginación
    $countQuery = "
        SELECT COUNT(*) as total
        FROM captured_images ci
        LEFT JOIN user u ON ci.rut = u.doc_id
        WHERE 1=1
    ";
    
    $countParams = array();
    
    if (!empty($searchRut)) {
        $countQuery .= " AND ci.rut LIKE ?";
        $countParams[] = '%' . $searchRut . '%';
    }
    
    if (!empty($searchAuditNumber)) {
        $countQuery .= " AND ci.audit_number LIKE ?";
        $countParams[] = '%' . $searchAuditNumber . '%';
    }
    
    if (empty($countParams)) {
        $totalRecords = $con->get_one($countQuery);
    } else {
        $totalRecords = $con->get_one($countQuery, $countParams);
    }
    
    // Formatear los resultados
    $formattedRecords = array();
    foreach ($records as $record) {
        $formattedRecords[] = array(
            'id' => 'db-' . $record['event_id'],
            'rut' => $record['rut'],
            'firstName' => $record['first_name'] ?? '',
            'lastName' => $record['last_name'] ?? '',
            'fullName' => trim(($record['first_name'] ?? '') . ' ' . ($record['last_name'] ?? '')),
            'auditNumber' => $record['audit_number'],
            'operatorRut' => $record['operator_rut'],
            'eventId' => $record['event_id'],
            'timestamp' => $record['created_at'],
            'userId' => $record['user_id'],
            'source' => 'database'
        );
    }
    
    $response = array(
        'success' => true,
        'data' => $formattedRecords,
        'pagination' => array(
            'page' => intval($page),
            'size' => intval($size),
            'total' => intval($totalRecords),
            'totalPages' => intval(ceil($totalRecords / $size))
        )
    );
    
    error_log("Returning " . count($formattedRecords) . " biometric records");
    
    echo json_encode($response);
    
} catch (Exception $e) {
    error_log("Error getting biometric records: " . $e->getMessage());
    echo json_encode(array(
        'success' => false,
        'error' => 'Error getting biometric records: ' . $e->getMessage(),
        'data' => []
    ));
}

?>
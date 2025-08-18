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

// Obtener parámetros
$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
$size = isset($_GET['size']) ? intval($_GET['size']) : 20;
$searchRut = isset($_GET['searchRut']) ? trim($_GET['searchRut']) : '';
$searchAuditNumber = isset($_GET['searchAuditNumber']) ? trim($_GET['searchAuditNumber']) : '';

error_log("FIXED: Getting biometric records - Page: $page, Size: $size, SearchRUT: '$searchRut', SearchAudit: '$searchAuditNumber'");

// Configuración de base de datos - usar la misma configuración que otros servicios
require __DIR__.'/../../vendor/autoload.php';
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/http.php';
include_once __DIR__ . '/../../include/simpledb.php';

$con = new SimpleDb();

try {
    // Construir query base
    $whereConditions = [];
    $params = [];
    
    // Agregar filtros de búsqueda
    if (!empty($searchRut)) {
        $whereConditions[] = "rut LIKE ?";
        $params[] = '%' . $searchRut . '%';
        error_log("FIXED: Added RUT filter: " . $searchRut);
    }
    
    if (!empty($searchAuditNumber)) {
        $whereConditions[] = "audit_number LIKE ?";
        $params[] = '%' . $searchAuditNumber . '%';
        error_log("FIXED: Added audit number filter: " . $searchAuditNumber);
    }
    
    $whereClause = empty($whereConditions) ? '' : 'WHERE ' . implode(' AND ', $whereConditions);
    
    // Verificar si existe la tabla biometric_attempts
    $tableExists = false;
    try {
        $checkResult = $con->get_one("SHOW TABLES LIKE 'biometric_attempts'");
        $tableExists = !empty($checkResult);
        error_log("FIXED: biometric_attempts table exists: " . ($tableExists ? 'yes' : 'no'));
    } catch (Exception $e) {
        error_log("FIXED: Error checking table: " . $e->getMessage());
    }
    
    // Query principal que incluye tanto exitosos como fallidos
    if ($tableExists) {
        // Usar datos de biometric_attempts que incluye tanto exitosos como fallidos
        $query = "
            SELECT 
                ba.rut,
                ba.event_id,
                ba.audit_number,
                ba.created_at,
                ba.first_name,
                ba.last_name,
                ba.rut as doc_id,
                ba.user_id,
                ba.verification_result,
                ba.error_code
            FROM biometric_attempts ba
            $whereClause
            ORDER BY ba.created_at DESC
            LIMIT $size OFFSET " . (($page - 1) * $size);
    } else {
        // Fallback a solo registros exitosos
        $query = "
            SELECT 
                ci.rut,
                ci.event_id,
                ci.audit_number,
                ci.created_at,
                u.first_name,
                u.last_name,
                u.doc_id,
                u.id as user_id,
                'SUCCESS' as verification_result,
                NULL as error_code
            FROM captured_images ci
            LEFT JOIN user u ON ci.rut = u.doc_id
            $whereClause
            ORDER BY ci.created_at DESC
            LIMIT $size OFFSET " . (($page - 1) * $size);
    }
    
    error_log("FIXED: Executing query: " . $query);
    error_log("FIXED: With params: " . json_encode($params));
    
    if (empty($params)) {
        $records = $con->get_array($query);
    } else {
        $records = $con->get_array($query, $params);
    }
    
    error_log("FIXED: Found " . count($records) . " records");
    
    // Query para contar total
    if ($tableExists) {
        $countQuery = "
            SELECT COUNT(*) as total
            FROM biometric_attempts ba
            $whereClause";
    } else {
        $countQuery = "
            SELECT COUNT(*) as total
            FROM captured_images ci
            LEFT JOIN user u ON ci.rut = u.doc_id
            $whereClause";
    }
    
    if (empty($params)) {
        $totalRecords = $con->get_one($countQuery);
    } else {
        $totalRecords = $con->get_one($countQuery, $params);
    }
    
    error_log("FIXED: Total records: " . $totalRecords);
    
    // Formatear los resultados
    $formattedRecords = [];
    foreach ($records as $record) {
        $verificationResult = $record['verification_result'] ?? 'SUCCESS';
        $isSuccess = $verificationResult === 'SUCCESS';
        
        $formatted = [
            'id' => 'db-' . $record['event_id'],
            'rut' => $record['rut'],
            'firstName' => $record['first_name'] ?? '',
            'lastName' => $record['last_name'] ?? '',
            'fullName' => trim(($record['first_name'] ?? '') . ' ' . ($record['last_name'] ?? '')),
            'auditNumber' => $record['audit_number'] ?? 'N/A',
            'eventId' => $record['event_id'],
            'timestamp' => $record['created_at'],
            'userId' => $record['user_id'],
            'verificationResult' => $verificationResult,
            'isSuccess' => $isSuccess,
            'errorCode' => $record['error_code'] ?? null,
            'source' => $tableExists ? 'database_enhanced' : 'database'
        ];
        $formattedRecords[] = $formatted;
        
        // Log primer registro para debug
        if (count($formattedRecords) == 1) {
            error_log("FIXED: First formatted record: " . json_encode($formatted));
        }
    }
    
    $response = [
        'success' => true,
        'data' => $formattedRecords,
        'pagination' => [
            'page' => $page,
            'size' => $size,
            'total' => intval($totalRecords),
            'totalPages' => intval(ceil($totalRecords / $size))
        ],
        'enhanced' => $tableExists,
        'includesFailedAttempts' => $tableExists
    ];
    
    error_log("FIXED: Returning " . count($formattedRecords) . " biometric records");
    
    echo json_encode($response);
    
} catch (Exception $e) {
    error_log("FIXED: Error getting biometric records: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Error getting biometric records: ' . $e->getMessage(),
        'data' => []
    ]);
}

?>
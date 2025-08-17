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

// Configuración de base de datos - ajustar según tu configuración
$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'gate';

try {
    // Conectar a la base de datos
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Construir query base
    $whereConditions = [];
    $params = [];
    
    // Agregar filtros de búsqueda
    if (!empty($searchRut)) {
        $whereConditions[] = "ci.rut LIKE ?";
        $params[] = '%' . $searchRut . '%';
        error_log("FIXED: Added RUT filter: " . $searchRut);
    }
    
    if (!empty($searchAuditNumber)) {
        $whereConditions[] = "ci.audit_number LIKE ?";
        $params[] = '%' . $searchAuditNumber . '%';
        error_log("FIXED: Added audit number filter: " . $searchAuditNumber);
    }
    
    $whereClause = empty($whereConditions) ? '' : 'WHERE ' . implode(' AND ', $whereConditions);
    
    // Query principal
    $query = "
        SELECT 
            ci.rut,
            ci.event_id,
            ci.audit_number,
            ci.created_at,
            u.first_name,
            u.last_name,
            u.doc_id,
            u.id as user_id
        FROM captured_images ci
        LEFT JOIN user u ON ci.rut = u.doc_id
        $whereClause
        ORDER BY ci.created_at DESC
        LIMIT $size OFFSET " . (($page - 1) * $size);
    
    error_log("FIXED: Executing query: " . $query);
    error_log("FIXED: With params: " . json_encode($params));
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("FIXED: Found " . count($records) . " records");
    
    // Query para contar total
    $countQuery = "
        SELECT COUNT(*) as total
        FROM captured_images ci
        LEFT JOIN user u ON ci.rut = u.doc_id
        $whereClause";
    
    $countStmt = $pdo->prepare($countQuery);
    $countStmt->execute($params);
    $totalRecords = $countStmt->fetchColumn();
    
    error_log("FIXED: Total records: " . $totalRecords);
    
    // Formatear los resultados
    $formattedRecords = [];
    foreach ($records as $record) {
        $formatted = [
            'id' => 'db-' . $record['event_id'],
            'rut' => $record['rut'],
            'firstName' => $record['first_name'] ?? '',
            'lastName' => $record['last_name'] ?? '',
            'fullName' => trim(($record['first_name'] ?? '') . ' ' . ($record['last_name'] ?? '')),
            'auditNumber' => $record['audit_number'],
            'eventId' => $record['event_id'],
            'timestamp' => $record['created_at'],
            'userId' => $record['user_id'],
            'source' => 'database'
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
        ]
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
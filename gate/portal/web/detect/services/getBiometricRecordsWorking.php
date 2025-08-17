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

error_log("WORKING: Getting biometric records - Page: $page, Size: $size, SearchRUT: '$searchRut', SearchAudit: '$searchAuditNumber'");

// Configuración de base de datos - usar la misma configuración del sistema
$db_host = 'mysql-identifica';
$db_user = 'root';
$db_pass = 'gate';
$db_name = 'access_control_test';
$db_port = 3306;

try {
    // Conectar a la base de datos
    $pdo = new PDO("mysql:host=$db_host;port=$db_port;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Construir WHERE clause de forma segura
    $whereConditions = [];
    $params = [];
    
    if (!empty($searchRut)) {
        $whereConditions[] = "ci.rut LIKE :searchRut";
        $params[':searchRut'] = '%' . $searchRut . '%';
        error_log("WORKING: Added RUT filter: " . $searchRut);
    }
    
    if (!empty($searchAuditNumber)) {
        $whereConditions[] = "ci.audit_number LIKE :searchAuditNumber";
        $params[':searchAuditNumber'] = '%' . $searchAuditNumber . '%';
        error_log("WORKING: Added audit number filter: " . $searchAuditNumber);
    }
    
    $whereClause = empty($whereConditions) ? '' : 'WHERE ' . implode(' AND ', $whereConditions);
    
    // Calcular offset
    $offset = ($page - 1) * $size;
    
    // Query principal - usar valores directos para LIMIT y OFFSET
    $mainQuery = "
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
        LIMIT $size OFFSET $offset";
    
    error_log("WORKING: Executing main query: " . $mainQuery);
    error_log("WORKING: With params: " . json_encode($params));
    
    // Ejecutar query principal
    if (empty($params)) {
        // Sin filtros, query directa
        $stmt = $pdo->query($mainQuery);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        // Con filtros, prepared statement
        $stmt = $pdo->prepare($mainQuery);
        $stmt->execute($params);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    error_log("WORKING: Found " . count($records) . " records");
    
    // Query para contar total
    $countQuery = "
        SELECT COUNT(*) as total
        FROM captured_images ci
        LEFT JOIN user u ON ci.rut = u.doc_id
        $whereClause";
    
    if (empty($params)) {
        $countStmt = $pdo->query($countQuery);
        $totalRecords = $countStmt->fetchColumn();
    } else {
        $countStmt = $pdo->prepare($countQuery);
        $countStmt->execute($params);
        $totalRecords = $countStmt->fetchColumn();
    }
    
    error_log("WORKING: Total records: " . $totalRecords);
    
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
            error_log("WORKING: First formatted record: " . json_encode($formatted));
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
    
    error_log("WORKING: Returning " . count($formattedRecords) . " biometric records");
    
    echo json_encode($response);
    
} catch (Exception $e) {
    error_log("WORKING: Error getting biometric records: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Error getting biometric records: ' . $e->getMessage(),
        'data' => []
    ]);
}

?>
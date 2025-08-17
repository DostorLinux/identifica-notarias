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
$searchRut = isset($_GET['searchRut']) ? $_GET['searchRut'] : '';
$searchAuditNumber = isset($_GET['searchAuditNumber']) ? $_GET['searchAuditNumber'] : '';

error_log("SIMPLE: Getting biometric records - Page: $page, Size: $size, SearchRUT: $searchRut, SearchAudit: $searchAuditNumber");

// Intentar cargar configuración de base de datos del sistema
$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'gate';

// Intentar cargar configuración desde el archivo del sistema
try {
    if (file_exists(__DIR__ . '/../../include/config.php')) {
        include_once __DIR__ . '/../../include/config.php';
        // Las variables globales $db_host, $db_user, $db_pass, $db_name deberían estar disponibles
    }
} catch (Exception $configError) {
    error_log("SIMPLE: No se pudo cargar configuración del sistema, usando valores por defecto");
}

try {
    // Conectar a la base de datos
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Construir query base que une captured_images con user para obtener datos completos
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
    
    error_log("SIMPLE: Executing query: " . $query);
    error_log("SIMPLE: With params: " . json_encode($params));
    
    if (empty($params)) {
        $stmt = $pdo->query($query);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
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
    
    $countStmt = $pdo->prepare($countQuery);
    $countStmt->execute($countParams);
    $totalRecords = $countStmt->fetchColumn();
    
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
            'page' => $page,
            'size' => $size,
            'total' => intval($totalRecords),
            'totalPages' => intval(ceil($totalRecords / $size))
        )
    );
    
    error_log("SIMPLE: Returning " . count($formattedRecords) . " biometric records");
    if (count($formattedRecords) > 0) {
        error_log("SIMPLE: First record: " . json_encode($formattedRecords[0]));
    }
    
    echo json_encode($response);
    
} catch (Exception $e) {
    error_log("SIMPLE: Error getting biometric records: " . $e->getMessage());
    echo json_encode(array(
        'success' => false,
        'error' => 'Error getting biometric records: ' . $e->getMessage(),
        'data' => []
    ));
}

?>
<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth();
portal_check_scheduler_permissions();

// Crear la conexión a la base de datos
$con = new SimpleDb();

// Obtener y sanitizar los datos POST
$request = json_from_post_body();

// Parámetros por defecto
$page = isset($request['page']) ? max(1, (int)$request['page']) : 1;
$size = isset($request['size']) ? max(1, (int)$request['size']) : 10;
$direction = isset($request['direction']) ? sanitize($request['direction']) : 'desc';
$column = isset($request['column']) ? sanitize($request['column']) : 'created';
$filter = isset($request['filter']) ? sanitize($request['filter']) : '';

// Calcular offset
$offset = ($page - 1) * $size;

// Construir la consulta base
$whereClause = "1=1";
$params = array();

// Filtrar por usuario si es rol 'empresa'
$currentUserId = get_auth_id();
$currentUserRole = portal_get_role();

if ($currentUserRole === 'empresa') {
    // Las empresas solo ven sus propios agendamientos
    $whereClause .= " AND created_by = ?";
    $params[] = $currentUserId;
}
// Para admin, super_admin, worker - ven todos los agendamientos (no se agrega filtro adicional)

// Aplicar filtro de búsqueda si existe
if (!empty($filter)) {
    $whereClause .= " AND (numero_contenedor LIKE ? OR nombre_conductor LIKE ? OR apellido_conductor LIKE ? OR patente_vehiculo LIKE ? OR rut_usuario LIKE ?)";
    $filterParam = '%' . $filter . '%';
    array_push($params, $filterParam, $filterParam, $filterParam, $filterParam, $filterParam);
}

// Validar columna de ordenamiento
$validColumns = array('id', 'numero_contenedor', 'nombre_conductor', 'apellido_conductor', 'patente_vehiculo', 'fecha_asignacion', 'status', 'created', 'updated');
if (!in_array($column, $validColumns)) {
    $column = 'created';
}

// Validar dirección de ordenamiento
$direction = strtolower($direction);
if (!in_array($direction, array('asc', 'desc'))) {
    $direction = 'desc';
}

try {
    // Consulta para contar el total de registros
    $countSql = "SELECT COUNT(*) as total FROM scheduler_appointment WHERE $whereClause";
    $countResult = $con->get_array($countSql, $params);
    $total = $countResult[0]['total'];

    // Consulta principal con paginación
    $sql = "SELECT 
                id,
                numero_contenedor,
                rut_usuario,
                nombre_conductor,
                apellido_conductor,
                patente_vehiculo,
                fecha_asignacion,
                status,
                en_puerta_status,
                en_puerta_timestamp,
                gate_status,
                gate_timestamp,
                patio_status,
                patio_timestamp,
                salida_status,
                salida_timestamp,
                created_by,
                created,
                updated
            FROM scheduler_appointment 
            WHERE $whereClause 
            ORDER BY $column $direction 
            LIMIT $size OFFSET $offset";

    $result = $con->get_array($sql, $params);

    // Formatear los datos para el frontend
    $data = array();
    foreach ($result as $row) {
        $data[] = array(
            $row['id'],                     // 0
            $row['numero_contenedor'],      // 1
            $row['rut_usuario'],           // 2
            $row['nombre_conductor'],       // 3
            $row['apellido_conductor'],     // 4
            $row['patente_vehiculo'],      // 5
            $row['fecha_asignacion'],      // 6
            $row['status'],                // 7
            $row['en_puerta_status'],      // 8
            $row['en_puerta_timestamp'],   // 9
            $row['gate_status'],           // 10
            $row['gate_timestamp'],        // 11
            $row['patio_status'],          // 12
            $row['patio_timestamp'],       // 13
            $row['salida_status'],         // 14
            $row['salida_timestamp'],      // 15
            $row['created_by'],            // 16
            $row['created'],               // 17
            $row['updated']                // 18
        );
    }

    // Calcular información de paginación
    $totalPages = ceil($total / $size);

    // Respuesta exitosa
    echo json_encode(array(
        'success' => true,
        'data' => $data,
        'total' => (int)$total,
        'page' => (int)$page,
        'size' => (int)$size,
        'totalPages' => (int)$totalPages,
        'hasMore' => $page < $totalPages
    ));

} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'error' => 'Error al obtener agendamientos: ' . $e->getMessage()
    ));
}
?>
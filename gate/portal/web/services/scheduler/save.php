<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth();
portal_check_scheduler_permissions();

// Obtener y sanitizar los datos POST
$request = json_from_post_body();

// Validar datos requeridos
$required_fields = array('numero_contenedor', 'rut_usuario', 'nombre_conductor', 'apellido_conductor', 'patente_vehiculo', 'fecha_asignacion');
foreach ($required_fields as $field) {
    if (!isset($request[$field]) || empty($request[$field])) {
        echo json_encode(array(
            'success' => false,
            'error' => "Campo requerido faltante: $field"
        ));
        exit;
    }
}

// Sanitizar los datos
$id = isset($request['id']) ? (int)$request['id'] : null;
$numero_contenedor = sanitize($request['numero_contenedor']);
$rut_usuario = sanitize($request['rut_usuario']);
$nombre_conductor = sanitize($request['nombre_conductor']);
$apellido_conductor = sanitize($request['apellido_conductor']);
$patente_vehiculo = sanitize($request['patente_vehiculo']);
$fecha_asignacion = sanitize($request['fecha_asignacion']);
$status = isset($request['status']) ? sanitize($request['status']) : 'Pendiente';
$created_by = get_auth_id();

// Crear la conexión a la base de datos
$con = new SimpleDb();

try {
    if ($id) {
        // Actualizar agendamiento existente
        $sql = "UPDATE scheduler_appointment SET 
                    numero_contenedor = ?,
                    rut_usuario = ?,
                    nombre_conductor = ?,
                    apellido_conductor = ?,
                    patente_vehiculo = ?,
                    fecha_asignacion = ?,
                    status = ?,
                    updated = CURRENT_TIMESTAMP
                WHERE id = ?";
        
        $params = array(
            $numero_contenedor,
            $rut_usuario,
            $nombre_conductor,
            $apellido_conductor,
            $patente_vehiculo,
            $fecha_asignacion,
            $status,
            $id
        );
        
        $con->execute($sql, $params);
        
        echo json_encode(array(
            'success' => true,
            'result' => 'updated',
            'id' => $id,
            'message' => 'Agendamiento actualizado correctamente'
        ));
        
    } else {
        // Crear nuevo agendamiento
        
        // Verificar si ya existe un agendamiento para el mismo contenedor y fecha
        $checkSql = "SELECT id FROM scheduler_appointment 
                     WHERE numero_contenedor = ? AND fecha_asignacion = ?";
        $existing = $con->get_row($checkSql, array($numero_contenedor, $fecha_asignacion));
        
        if (!empty($existing)) {
            echo json_encode(array(
                'success' => false,
                'error' => 'Ya existe un agendamiento para este contenedor en la fecha seleccionada'
            ));
            exit;
        }
        
        $sql = "INSERT INTO scheduler_appointment (
                    numero_contenedor,
                    rut_usuario,
                    nombre_conductor,
                    apellido_conductor,
                    patente_vehiculo,
                    fecha_asignacion,
                    status,
                    created_by,
                    created,
                    updated
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";
        
        $params = array(
            $numero_contenedor,
            $rut_usuario,
            $nombre_conductor,
            $apellido_conductor,
            $patente_vehiculo,
            $fecha_asignacion,
            $status,
            $created_by
        );
        
        $con->execute($sql, $params);
        $newId = $con->get_last_id();
        
        echo json_encode(array(
            'success' => true,
            'result' => 'created',
            'id' => (int)$newId,
            'message' => 'Agendamiento creado correctamente'
        ));
    }
    
} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'error' => 'Error al guardar agendamiento: ' . $e->getMessage()
    ));
}
?>
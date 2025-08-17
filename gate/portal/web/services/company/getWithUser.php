<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

// Obtener y sanitizar los datos POST
$request = json_from_post_body();

// Validar que se proporcionó el ID de la empresa
if (!isset($request['id']) || empty($request['id'])) {
    echo json_encode(array(
        'success' => false,
        'error' => 'ID de empresa es requerido'
    ));
    exit;
}

$companyId = (int)$request['id'];

// Crear la conexión a la base de datos
$con = new SimpleDb();

try {
    // Obtener datos de la empresa
    $companySql = "SELECT id, name, rut, address, notes, isDenied, deniedNote, created
                   FROM company 
                   WHERE id = ?";
    
    $company = $con->get_row($companySql, array($companyId));
    
    if (!$company) {
        echo json_encode(array(
            'success' => false,
            'error' => 'Empresa no encontrada'
        ));
        exit;
    }
    
    // Buscar usuario asociado (buscar por nombre de empresa y rol 'empresa')
    $userSql = "SELECT id, username, email, first_name, last_name, active
                FROM user 
                WHERE role = 'empresa' 
                AND (first_name = ? OR last_name LIKE ?)
                AND active = 'Y'
                ORDER BY created DESC";
    
    $user = $con->get_row($userSql, array($company['name'], '%' . $company['name'] . '%'));
    
    // Formatear respuesta
    $response = array(
        'success' => true,
        'company' => array(
            'id' => (int)$company['id'],
            'name' => $company['name'],
            'rut' => $company['rut'],
            'address' => $company['address'],
            'notes' => $company['notes'],
            'isDenied' => (int)$company['isDenied'],
            'deniedNote' => $company['deniedNote'],
            'created' => $company['created']
        )
    );
    
    if ($user) {
        $response['user'] = array(
            'id' => (int)$user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'first_name' => $user['first_name'],
            'last_name' => $user['last_name'],
            'active' => $user['active']
        );
    }
    
    echo json_encode($response);
    
} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'error' => 'Error al obtener empresa con usuario: ' . $e->getMessage()
    ));
}
?>
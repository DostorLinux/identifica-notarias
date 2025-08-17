<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

// Crear la conexión a la base de datos
$con = new SimpleDb();

// Obtener y sanitizar los datos POST
$request = json_from_post_body();

// Validar que se proporcionó el RUT
if (empty($request['rut'])) {
    echo json_encode(array(
        'success' => false,
        'error' => 'El RUT es requerido'
    ));
    exit;
}

$rut = sanitize($request['rut']);

try {
    // Buscar usuario por RUT (doc_id) con role = 'user' (conductores)
    $sql = "SELECT 
                id,
                doc_id,
                first_name,
                last_name,
                email,
                role,
                active,
                user_type,
                pub_id
            FROM user 
            WHERE doc_id = ? 
            AND role = 'user' 
            AND active = 'Y'";
    
    $user = $con->get_row($sql, array($rut));
    
    if ($user) {
        // Verificar si el usuario tiene foto
        $has_photo = false;
        $photo_url = null;
        
        if (!empty($user['pub_id'])) {
            // Verificar si existe el archivo de foto
            $image_file = gate_get_face_path(FACE_TYPE_USER, $user['id']);
            if (file_exists($image_file)) {
                $has_photo = true;
                // Construir URL para obtener la foto
                $photo_url = 'services/getPicture.php?id=' . $user['id'] . '&pub_id=' . $user['pub_id'];
            }
        }
        
        // Usuario encontrado
        echo json_encode(array(
            'success' => true,
            'user' => array(
                'id' => $user['id'],
                'doc_id' => $user['doc_id'],
                'first_name' => $user['first_name'],
                'last_name' => $user['last_name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'active' => $user['active'],
                'user_type' => $user['user_type'],
                'pub_id' => $user['pub_id'],
                'has_photo' => $has_photo,
                'photo_url' => $photo_url
            )
        ));
    } else {
        // Usuario no encontrado
        echo json_encode(array(
            'success' => false,
            'error' => 'No se encontró un conductor activo con este RUT'
        ));
    }

} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'error' => 'Error al buscar usuario: ' . $e->getMessage()
    ));
}
?>
<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

// Obtener y sanitizar los datos POST
$request = json_from_post_body();

// Debug: log de datos recibidos
error_log("updateWithUser.php - Datos recibidos: " . json_encode($request));

// Validar datos requeridos
$required_fields = array('id', 'name', 'rut', 'username', 'email');
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
$company_id = (int)$request['id'];
$company_name = sanitize($request['name']);
$company_rut = sanitize($request['rut']);
$company_address = isset($request['address']) ? sanitize($request['address']) : '';
$company_notes = isset($request['notes']) ? sanitize($request['notes']) : '';

$username = sanitize($request['username']);
$email = sanitize($request['email']);
$user_id = isset($request['userId']) ? (int)$request['userId'] : null;

// Contraseña es opcional en la actualización
$password = isset($request['password']) ? sanitize($request['password']) : null;

// Crear la conexión a la base de datos
$con = new SimpleDb();

try {
    // Verificar que la empresa existe
    $checkCompanySql = "SELECT id FROM company WHERE id = ?";
    $existingCompany = $con->get_row($checkCompanySql, array($company_id));
    
    if (!$existingCompany) {
        echo json_encode(array(
            'success' => false,
            'error' => 'Empresa no encontrada'
        ));
        exit;
    }
    
    // Verificar que el username no esté en uso por otro usuario
    if ($user_id) {
        $checkUserSql = "SELECT id FROM user WHERE username = ? AND id != ?";
        $existingUser = $con->get_row($checkUserSql, array($username, $user_id));
    } else {
        $checkUserSql = "SELECT id FROM user WHERE username = ?";
        $existingUser = $con->get_row($checkUserSql, array($username));
    }
    
    if ($existingUser) {
        echo json_encode(array(
            'success' => false,
            'error' => 'El nombre de usuario ya está en uso'
        ));
        exit;
    }
    
    // SimpleDb no maneja transacciones automáticamente, pero podemos usar try/catch
    
    try {
        // 1. Actualizar la empresa
        $companySql = "UPDATE company SET 
                       name = ?,
                       rut = ?,
                       address = ?,
                       notes = ?,
                       updated = CURRENT_TIMESTAMP
                       WHERE id = ?";
        
        $companyParams = array(
            $company_name,
            $company_rut,
            $company_address,
            $company_notes,
            $company_id
        );
        
        $con->execute($companySql, $companyParams);
        
        // 2. Actualizar o crear el usuario
        if ($user_id) {
            // Actualizar usuario existente
            if ($password) {
                // Actualizar con nueva contraseña usando el sistema gate
                $password_hash = gate_hash_password($password);
                $userSql = "UPDATE user SET 
                           username = ?,
                           password = ?,
                           first_name = ?,
                           email = ?,
                           updated = CURRENT_TIMESTAMP
                           WHERE id = ?";
                
                $userParams = array(
                    $username,
                    $password_hash,
                    $company_name,
                    $email,
                    $user_id
                );
            } else {
                // Actualizar sin cambiar contraseña
                $userSql = "UPDATE user SET 
                           username = ?,
                           first_name = ?,
                           email = ?,
                           updated = CURRENT_TIMESTAMP
                           WHERE id = ?";
                
                $userParams = array(
                    $username,
                    $company_name,
                    $email,
                    $user_id
                );
            }
            
            $con->execute($userSql, $userParams);
            $final_user_id = $user_id;
            
        } else {
            // Crear nuevo usuario (caso raro, pero posible si no había usuario asociado)
            if (!$password) {
                throw new Exception('Contraseña requerida para crear nuevo usuario');
            }
            
            $password_hash = gate_hash_password($password);
            $userSql = "INSERT INTO user (
                       username,
                       password,
                       role,
                       first_name,
                       last_name,
                       email,
                       active,
                       isDenied,
                       created_by,
                       created,
                       updated
                   ) VALUES (?, ?, 'empresa', ?, 'Empresa', ?, 'Y', 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";
            
            $userParams = array(
                $username,
                $password_hash,
                $company_name,
                $email,
                get_auth_id()
            );
            
            $con->execute($userSql, $userParams);
            $final_user_id = $con->get_last_id();
        }
        
        echo json_encode(array(
            'success' => true,
            'id' => $company_id,
            'user_id' => (int)$final_user_id,
            'message' => 'Empresa y usuario actualizados correctamente'
        ));
        
    } catch (Exception $e) {
        throw $e;
    }
    
} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'error' => 'Error al actualizar empresa y usuario: ' . $e->getMessage()
    ));
}
?>
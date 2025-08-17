<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

// Obtener y sanitizar los datos POST
$request = json_from_post_body();

// Validar datos requeridos (password already removed from required fields)
$required_fields = array('name', 'rut', 'username', 'email');
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
$company_name = sanitize($request['name']);
$company_rut = sanitize($request['rut']);
$company_address = isset($request['address']) ? sanitize($request['address']) : '';
$company_notes = isset($request['notes']) ? sanitize($request['notes']) : '';

$username = sanitize($request['username']);
$email = sanitize($request['email']);

// Generate temporary password
$temporary_password = generate_temporary_password(12);

$created_by = get_auth_id();

// Crear la conexión a la base de datos
$con = new SimpleDb();

try {
    // Verificar que el username no exista
    $checkUserSql = "SELECT id FROM user WHERE username = ?";
    $existingUser = $con->get_row($checkUserSql, array($username));
    
    if ($existingUser) {
        echo json_encode(array(
            'success' => false,
            'error' => 'El nombre de usuario ya existe'
        ));
        exit;
    }
    
    // Verificar que el RUT de la empresa no exista
    $checkCompanySql = "SELECT id FROM company WHERE rut = ?";
    $existingCompany = $con->get_row($checkCompanySql, array($company_rut));
    
    if ($existingCompany) {
        echo json_encode(array(
            'success' => false,
            'error' => 'Ya existe una empresa con este RUT'
        ));
        exit;
    }
    
    // Hash de la contraseña temporal usando el sistema gate
    $password_hash = gate_hash_password($temporary_password);
    
    // SimpleDb no maneja transacciones automáticamente, pero podemos usar try/catch
    
    try {
        // 1. Crear la empresa
        $companySql = "INSERT INTO company (
            name,
            rut,
            address,
            notes,
            active,
            isDenied,
            created,
            updated
        ) VALUES (?, ?, ?, ?, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";
        
        $companyParams = array(
            $company_name,
            $company_rut,
            $company_address,
            $company_notes
        );
        
        $con->execute($companySql, $companyParams);
        $companyId = $con->get_last_id();
        
        // 2. Crear el usuario (with temporary password flag)
        $userSql = "INSERT INTO user (
            username,
            password,
            role,
            first_name,
            last_name,
            email,
            active,
            isDenied,
            must_change_password,
            created_by,
            created,
            updated
        ) VALUES (?, ?, 'empresa', ?, ?, ?, 'Y', 0, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";
        
        $userParams = array(
            $username,
            $password_hash,
            $company_name, // first_name
            'Empresa',     // last_name
            $email,
            $created_by
        );
        
        $con->execute($userSql, $userParams);
        $userId = $con->get_last_id();
        
        // Send temporary password email
        error_log("[COMPANY_CREATION] Attempting to send temporary password email to: $email for username: $username, company: $company_name");
        $email_sent = gate_send_temporary_password_email($email, $username, $temporary_password, $company_name);
        error_log("[COMPANY_CREATION] Email sending result: " . ($email_sent ? 'SUCCESS' : 'FAILED'));
        
        $response = array(
            'success' => true,
            'id' => (int)$companyId,
            'user_id' => (int)$userId,
            'message' => 'Empresa y usuario creados correctamente'
        );
        
        if ($email_sent) {
            $response['message'] .= '. Se ha enviado un correo con las credenciales temporales.';
        } else {
            $response['message'] .= '. ADVERTENCIA: No se pudo enviar el correo con las credenciales.';
            $response['warning'] = 'Email no enviado';
        }
        
        echo json_encode($response);
        
    } catch (Exception $e) {
        throw $e;
    }
    
} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'error' => 'Error al crear empresa y usuario: ' . $e->getMessage()
    ));
}
?>
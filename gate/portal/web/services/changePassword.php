<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth();

$request = json_from_post_body();

// Validar datos requeridos
$required_fields = array('current_password', 'new_password');
foreach ($required_fields as $field) {
    if (!isset($request[$field]) || empty($request[$field])) {
        echo json_encode(array(
            'success' => false,
            'error' => "Campo requerido faltante: $field"
        ));
        exit;
    }
}

$current_password = sanitize($request['current_password']);
$new_password = sanitize($request['new_password']);

// Validar longitud mínima de nueva contraseña
if (strlen($new_password) < 6) {
    echo json_encode(array(
        'success' => false,
        'error' => 'La nueva contraseña debe tener al menos 6 caracteres'
    ));
    exit;
}

$con = new SimpleDb();
$auth_user_id = get_auth_id();

try {
    // Verificar contraseña actual
    $current_password_hash = gate_hash_password($current_password);
    $sql = "SELECT id FROM user WHERE id = ? AND password = ?";
    $user_exists = $con->get_one($sql, array($auth_user_id, $current_password_hash));
    
    if (!$user_exists) {
        echo json_encode(array(
            'success' => false,
            'error' => 'La contraseña actual es incorrecta'
        ));
        exit;
    }
    
    // Hash de la nueva contraseña
    $new_password_hash = gate_hash_password($new_password);
    
    // Actualizar contraseña y marcar must_change_password como 0
    $update_sql = "UPDATE user SET password = ?, must_change_password = 0, updated = CURRENT_TIMESTAMP WHERE id = ?";
    $con->execute($update_sql, array($new_password_hash, $auth_user_id));
    
    // Registrar auditoría
    gate_save_audit_log($con, $auth_user_id, AUDIT_USER_PASSWORD_CHANGE, json_encode(array('user_id' => $auth_user_id)));
    
    echo json_encode(array(
        'success' => true,
        'message' => 'Contraseña cambiada exitosamente'
    ));
    
} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'error' => 'Error al cambiar la contraseña: ' . $e->getMessage()
    ));
}

?>
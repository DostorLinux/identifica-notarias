<?php

include_once __DIR__ . '/../include/config.php';
include_once __DIR__ . '/../include/core.php';
include_once __DIR__ . '/../include/simpledb.php';
include_once __DIR__ . '/../include/gate.php';
include_once __DIR__ . '/../include/portal.php';

portal_auth();

// Only admins can delete users
portal_check_admin();

$id = getPostParameter('id');

if (empty($id)) {
    abort('MISSING_PARAMETERS');
}

$con = new SimpleDb();

try {
    // Check if user exists
    $sql = 'SELECT username, role FROM user WHERE id = ?';
    $user = $con->get_row($sql, array($id));
    
    if (empty($user)) {
        abort('USER_NOT_FOUND');
    }
    
    // Don't allow deleting super_admin users
    if ($user['role'] === 'super_admin') {
        abort('CANNOT_DELETE_SUPER_ADMIN');
    }
    
    // Don't allow users to delete themselves
    if ($id == $auth_user_id) {
        abort('CANNOT_DELETE_SELF');
    }
    
    $con->begin();
    
    // Delete related records first (foreign key constraints)
    
    // Delete user groups
    $sql = 'DELETE FROM user_group_user WHERE userId = ?';
    $con->execute($sql, array($id));
    
    // Delete user places
    $sql = 'DELETE FROM place_user WHERE userId = ?';
    $con->execute($sql, array($id));
    
    // Delete user devices
    $sql = 'DELETE FROM user_device WHERE user_id = ?';
    $con->execute($sql, array($id));
    
    // Delete user photos (if any)
    try {
        $face_path = gate_get_face_path(FACE_TYPE_USER, $id);
        if (file_exists($face_path)) {
            unlink($face_path);
        }
    } catch (Exception $e) {
        // Log error but don't stop deletion
        error_log("Error deleting user photo: " . $e->getMessage());
    }
    
    // Delete user signatures (if any)
    try {
        $signature_path = gate_get_signature_path($id);
        if (file_exists($signature_path)) {
            unlink($signature_path);
        }
    } catch (Exception $e) {
        // Log error but don't stop deletion
        error_log("Error deleting user signature: " . $e->getMessage());
    }
    
    // Finally delete the user
    $sql = 'DELETE FROM user WHERE id = ?';
    $con->execute($sql, array($id));
    
    // Log the deletion
    gate_save_audit_log($con, $auth_user_id, AUDIT_USER_DELETE, json_encode(['deleted_user_id' => $id, 'username' => $user['username']]));
    
    $con->commit();
    
    echo json_encode(['success' => true, 'message' => 'Usuario eliminado correctamente']);
    
} catch (Exception $e) {
    $con->rollback();
    error_log("Error deleting user: " . $e->getMessage());
    abort('DELETE_ERROR');
}

?>
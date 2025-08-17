<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

// Ensure user is authenticated
portal_auth();

$con = new SimpleDb();

// Get the authenticated user's ID
$id = $auth_user_id;
if (empty($id)) {
    portal_abort('USER_NOT_FOUND');
}

// Get required parameters
$current_password = getPostParameter('current_password');
$new_password = getPostParameter('new_password');
$confirm_password = getPostParameter('confirm_password');

// Validate inputs
if (empty($current_password) || empty($new_password) || empty($confirm_password)) {
    portal_abort('MISSING_REQUIRED_FIELDS');
}

if ($new_password !== $confirm_password) {
    portal_abort('PASSWORDS_DO_NOT_MATCH');
}

// Verify current password
if (!portal_validate_user_password($con, $auth_user_name, $current_password)) {
    portal_abort('INVALID_CURRENT_PASSWORD');
}

// Hash new password
$new_hash = gate_hash_password($new_password);

// Begin transaction
$con->begin();

try {
    // Update password
    $sql = 'UPDATE user SET password = ?, updated = NOW() WHERE id = ?';
    $con->execute($sql, array($new_hash, $id));

    $audit_details = json_encode([
        'user_id' => $id,
        'action' => 'password_change',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    gate_save_audit_log($con, $auth_user_id, AUDIT_USER_PASSWORD_CHANGE, $audit_details);


    $con->commit();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    $con->rollback();
    portal_abort('PASSWORD_UPDATE_FAILED');
}
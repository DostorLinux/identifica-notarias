<?php

require __DIR__.'/../../vendor/autoload.php';

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/http.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/api.php';
include_once __DIR__ . '/../../include/gate.php';

$image      = getPostParameter('image');
$type       = getPostParameter('type');
$deviceId   = getPostParameter('deviceId');
$rut        = getPostParameter('rut');
$plate      = getPostParameter('plate');
$probe      = getPostParameter('probe') == 'true';
$operatorRut = getPostParameter('operatorRut'); // RUT del operario que realiza la verificación

$con = new SimpleDb();

// Generar número de auditoría único para este intento
$auditNumber = 'CERT-' . substr(time(), -6) . strtoupper(substr(md5(rand()), 0, 5));
$timestamp = time();

error_log("ENHANCED POSTEVENT: Starting verification for RUT: $rut, Audit: $auditNumber");

// Validar imagen
$picture = str_replace('data:image/jpeg;base64,', '', $image);
if (empty($picture)) {
    // Registrar intento fallido
    registerFailedAttempt($con, $rut, $auditNumber, $operatorRut, $timestamp, 'EMPTY_IMAGE');
    abort('EMPTY_IMAGE');
}

$face_image = base64_decode($picture);
if (empty($face_image)) {
    // Registrar intento fallido
    registerFailedAttempt($con, $rut, $auditNumber, $operatorRut, $timestamp, 'INVALID_BASE64_IMAGE');
    abort('INVALID_BASE64_IMAGE');
}

// Intentar hacer match facial
$user_id = gate_match_face($con, $face_image, $gate_match_face_tolerance, null, $rut);
if (empty($user_id)) {
    error_log("ENHANCED POSTEVENT: Face match failed for RUT: $rut");
    
    // Registrar intento fallido
    registerFailedAttempt($con, $rut, $auditNumber, $operatorRut, $timestamp, 'CANNOT_IDENTIFY');
    
    // Guardar imagen del intento fallido para evidencia
    saveFailedAttemptImage($face_image, $rut, $timestamp);
    
    abort('CANNOT_IDENTIFY');
}

error_log("ENHANCED POSTEVENT: Face match successful for RUT: $rut, UserID: $user_id");

$user_info = gate_find_user($con, $user_id);

if ($probe) {
    $response = array(
        'type' => $type,
        'first_name' => $user_info['first_name'],
        'last_name'  => $user_info['last_name']
    );
} else {
    $event = gate_save_event($con, $user_id, $deviceId, $type, 0, 0, $plate);

    // Registrar intento exitoso
    registerSuccessfulAttempt($con, $rut, $auditNumber, $operatorRut, $timestamp, $event, $user_info);

    // Guardar imagen capturada
    try {
        error_log("ENHANCED POSTEVENT: Starting to save captured image for RUT: $rut");
        
        // Usar ruta absoluta para evitar problemas
        $upload_dir = '/var/www/html/gate/portal/web/uploads/captured_images/';
        
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0755, true);
            error_log("ENHANCED POSTVENT: Created directory: $upload_dir");
        }
        
        $filename = 'captured_' . $rut . '_' . $timestamp . '.jpg';
        $filepath = $upload_dir . $filename;
        
        error_log("ENHANCED POSTVENT: Saving image to: $filepath");
        
        if (file_put_contents($filepath, $face_image) !== false) {
            error_log("ENHANCED POSTVENT: Image saved successfully, inserting to DB");
            
            // Guardar referencia en base de datos incluyendo número de auditoría y operador
            $query = "INSERT INTO captured_images (rut, event_id, audit_number, operator_rut, filename, filepath, created_at) VALUES (?, ?, ?, ?, ?, ?, FROM_UNIXTIME(?))
                      ON DUPLICATE KEY UPDATE filename = VALUES(filename), filepath = VALUES(filepath), audit_number = VALUES(audit_number), operator_rut = VALUES(operator_rut), created_at = VALUES(created_at)";
            
            // Usar el timestamp como event_id ya que es único y consistente
            $event_id = $timestamp;
            
            $con->execute($query, array($rut, $event_id, $auditNumber, $operatorRut, $filename, $filepath, $timestamp));
            error_log("ENHANCED POSTVENT: Image reference saved to database successfully");
        } else {
            error_log("ENHANCED POSTVENT: Failed to save image file to: $filepath");
        }
    } catch (Exception $e) {
        error_log("ENHANCED POSTVENT ERROR: " . $e->getMessage());
        // No abortar el proceso por este error, solo registrarlo
    }

    // send notification email
    $user_email = $user_info['email'];
    if (!empty($user_email) && $gate_send_email_on_event) {
        $user_name  = gate_build_name($user_info['first_name'], $user_info['last_name']);
        gate_send_email($user_email,$user_info['doc_id'], $user_name, $timestamp, $type);
    }
    
    $response = array(
        'type' => $type,
        'time' => $timestamp,
        'first_name' => $user_info['first_name'],
        'last_name'  => $user_info['last_name'],
        'event_id' => $timestamp,
        'audit_number' => $auditNumber,
        'verification_result' => 'SUCCESS'
    );
}

echo json_encode($response);

function registerFailedAttempt($con, $rut, $auditNumber, $operatorRut, $timestamp, $errorCode) {
    try {
        // Crear tabla si no existe
        createBiometricAttemptsTable($con);
        
        $query = "INSERT INTO biometric_attempts (rut, event_id, audit_number, operator_rut, verification_result, error_code, created_at) 
                  VALUES (?, ?, ?, ?, 'FAILED', ?, FROM_UNIXTIME(?))";
        
        $con->execute($query, array($rut, $timestamp, $auditNumber, $operatorRut, $errorCode, $timestamp));
        error_log("ENHANCED POSTEVENT: Failed attempt registered for RUT: $rut, Error: $errorCode");
        
    } catch (Exception $e) {
        error_log("ENHANCED POSTEVENT: Error registering failed attempt: " . $e->getMessage());
    }
}

function registerSuccessfulAttempt($con, $rut, $auditNumber, $operatorRut, $timestamp, $event, $user_info) {
    try {
        // Crear tabla si no existe
        createBiometricAttemptsTable($con);
        
        $query = "INSERT INTO biometric_attempts (rut, event_id, audit_number, operator_rut, verification_result, user_id, first_name, last_name, created_at) 
                  VALUES (?, ?, ?, ?, 'SUCCESS', ?, ?, ?, FROM_UNIXTIME(?))";
        
        $con->execute($query, array(
            $rut, 
            $timestamp, 
            $auditNumber, 
            $operatorRut, 
            $user_info['id'],
            $user_info['first_name'],
            $user_info['last_name'],
            $timestamp
        ));
        error_log("ENHANCED POSTEVENT: Successful attempt registered for RUT: $rut");
        
    } catch (Exception $e) {
        error_log("ENHANCED POSTEVENT: Error registering successful attempt: " . $e->getMessage());
    }
}

function createBiometricAttemptsTable($con) {
    try {
        $createTableQuery = "
            CREATE TABLE IF NOT EXISTS biometric_attempts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                rut VARCHAR(20) NOT NULL,
                event_id VARCHAR(50),
                audit_number VARCHAR(50),
                operator_rut VARCHAR(20),
                verification_result ENUM('SUCCESS', 'FAILED', 'ERROR') NOT NULL,
                error_code VARCHAR(50) NULL,
                user_id INT NULL,
                first_name VARCHAR(100) NULL,
                last_name VARCHAR(100) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_rut (rut),
                INDEX idx_created_at (created_at),
                INDEX idx_audit_number (audit_number),
                INDEX idx_verification_result (verification_result)
            )
        ";
        $con->execute($createTableQuery);
        error_log("ENHANCED POSTEVENT: biometric_attempts table ensured");
    } catch (Exception $e) {
        error_log("ENHANCED POSTEVENT: Error creating biometric_attempts table: " . $e->getMessage());
    }
}

function saveFailedAttemptImage($face_image, $rut, $timestamp) {
    try {
        $upload_dir = '/var/www/html/gate/portal/web/uploads/failed_attempts/';
        
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }
        
        $filename = 'failed_' . $rut . '_' . $timestamp . '.jpg';
        $filepath = $upload_dir . $filename;
        
        if (file_put_contents($filepath, $face_image) !== false) {
            error_log("ENHANCED POSTEVENT: Failed attempt image saved: $filepath");
        }
    } catch (Exception $e) {
        error_log("ENHANCED POSTEVENT: Error saving failed attempt image: " . $e->getMessage());
    }
}

?>
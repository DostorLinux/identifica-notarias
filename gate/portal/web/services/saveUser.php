<?php

// Handle CORS preflight requests
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Allow local development origins
$is_local_origin = false;
if (!empty($origin)) {
    $parsed = parse_url($origin);
    $host = $parsed['host'] ?? '';
    
    // Allow localhost, 127.0.0.1, and local network IPs
    if ($host === 'localhost' || 
        $host === '127.0.0.1' || 
        preg_match('/^192\.168\./', $host) ||
        preg_match('/^10\./', $host) ||
        preg_match('/^172\.(1[6-9]|2[0-9]|3[0-1])\./', $host)) {
        $is_local_origin = true;
    }
}

$cors_origin = $is_local_origin ? $origin : 'http://localhost:3000';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: $cors_origin");
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
    exit(0);
}

// Set CORS headers for all requests
header("Access-Control-Allow-Origin: $cors_origin");
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

include_once __DIR__ . '/../include/config.php';
include_once __DIR__ . '/../include/core.php';
include_once __DIR__ . '/../include/simpledb.php';
include_once __DIR__ . '/../include/gate.php';
include_once __DIR__ . '/../include/portal.php';

// Check if this is a request from lector-notarias (skip authentication)
$mode = getPostParameter('mode');
$skip_auth = ($mode === 'notaria-scan');

// También verificar si tiene picture/signature (indicador de lector-notarias)
$picture = getPostParameter('picture');
$signature = getPostParameter('signature');
$has_biometric_data = (!empty($picture) || !empty($signature));

// Si tiene datos biométricos pero no modo, asumir notaria-scan
if (!$skip_auth && $has_biometric_data) {
    $skip_auth = true;
    error_log("SAVEUSER: Auto-detected notaria-scan mode due to biometric data");
}

error_log("SAVEUSER: Mode parameter: '$mode', Skip auth: " . ($skip_auth ? 'true' : 'false') . ", Has biometric data: " . ($has_biometric_data ? 'true' : 'false'));

if (!$skip_auth) {
    portal_auth();
    $id = getPostParameter('id');
    if ($id != $auth_user_id) portal_check_admin();
} else {
    // For notaria-scan mode, we'll get/create the user ID differently
    $id = getPostParameter('id') ?: null;
}

$con = new SimpleDb();

$doc_id = getPostParameter('doc_id');
$sec_id = getPostParameter('sec_id');
$login = getPostParameter('login');
$first_name = getPostParameter('first_name');
$last_name = getPostParameter('last_name');
$email = getPostParameter('email');
$role = getPostParameter('role');
$user_type = getPostParameter('user_type');
// picture y signature ya se obtuvieron arriba para detectar modo

if ($role == "super_admin") {
    $role = "admin";
}

$active = getPostParameter('active');
$groups = getPostParameter('groups');
$password = getPostParameter('password');
$pin = getPostParameter('pin');
$nationality = getPostParameter("nationality");
$placeIds = getPostParameter('placeIds');

//hasExpiratio
//expirationDate
$expirationDate = getPostParameter('expirationDate');
$hasExpiration = getPostParameter('hasExpiration');
if ($hasExpiration == null) {
    $hasExpiration = 0;
    $expirationDate = null;
} else {
    if ($hasExpiration == 1) {
        $dateObject = DateTime::createFromFormat('d/m/Y', $expirationDate);
        // Format the DateTime object to the desired output format
        $expirationDate = $dateObject->format('Y-m-d');
    } else {
        $expirationDate = null;
    }
}

// Only check admin permissions if not in notaria-scan mode
if (!$skip_auth) {
    if ($auth_user_role != PROFILE_ADMIN && $auth_user_role != PROFILE_SUPER_ADMIN) {
        $role = $auth_user_role;
    }
}

portal_check_mandatory($role, 'Rol');

//Se quita pues los conductores no tienen email.
//portal_check_email($email, 'Email');

// check for existing users with the same doc_id
if (!empty($doc_id)) {
    error_log("SAVEUSER: Checking for existing user with doc_id: $doc_id, current id: " . ($id ?: 'null'));
    $user_info = gate_find_user_by_doc_id($con, $doc_id, $id);
    if (!empty($user_info)) {
        error_log("SAVEUSER: Found existing user: " . json_encode($user_info));
        
        // En modo notaria-scan, permitir actualizar usuario existente
        if ($skip_auth) {
            $id = $user_info['id'];
            error_log("SAVEUSER: In notaria-scan mode, will update existing user ID: $id");
        } else {
            error_log("SAVEUSER: Aborting due to existing doc_id (not in notaria-scan mode)");
            portal_abort_existing_doc_id($user_info);
        }
    } else {
        error_log("SAVEUSER: No existing user found with doc_id: $doc_id");
    }
}

// role changes require that users enter their password (only if not in notaria-scan mode)
if (!$skip_auth && !empty($id)) {
    $sql = 'select role from user where id = ?';
    $old_role = $con->get_one($sql, $id);
    if ($old_role != $role) {
        if (!portal_validate_user_password($con, $auth_user_name, $password)) {
            abort('PASSWORD_REQUIRED');
        }
    }
}

portal_check_max_active_users($con, $active);

error_log("SAVEUSER: Starting database transaction for user - ID: " . ($id ?: 'new') . ", doc_id: $doc_id, first_name: $first_name, last_name: $last_name");

$con->begin();

$params = array($doc_id, $sec_id, $login, $first_name, $last_name, $email, $role, $active, $nationality);
error_log("SAVEUSER: Prepared params: " . json_encode($params));

if (empty($id)) {
    error_log("SAVEUSER: Creating new user (INSERT)");
    if (empty($password)) {
        $hash = null;
    } else {
        $hash = gate_hash_password($password);
    }
    $params[] = $pin;
    $params[] = $hash;
    $audit_type = AUDIT_USER_CREATE;
    $uuid = guidv4();
    $params[] = $uuid;
    $params[] = $hasExpiration;
    $params[] = $expirationDate;
    $params[] = $user_type;
    $sql = 'insert into user (doc_id, sec_id, username, first_name, last_name, email, role, active,nationality, pin, 
                  password, pub_id, has_expiration, expiration_date, user_type) ' .
        'values (?, ?, ?, ?, ?, ? ,?, ?, ?, ?, ?,?,?,?,?) ';
    error_log("SAVEUSER: Executing INSERT SQL: $sql");
    error_log("SAVEUSER: INSERT params: " . json_encode($params));
    $con->execute($sql, $params);
    $id = $con->get_last_id();
    error_log("SAVEUSER: New user created with ID: $id");
} else {
    error_log("SAVEUSER: Updating existing user (UPDATE) - ID: $id");
    $audit_type = AUDIT_USER_MODIFY;

    if (empty($pin)) {
        $sql = 'update user set doc_id = ?, sec_id = ?, username = ?, first_name = ?' .
            ', last_name = ?, email = ?, role = ?, active = ?, nationality=?,updated = now() , has_expiration = ?, expiration_date = ?, user_type = ? ';
    } else {
        $sql = 'update user set doc_id = ?, sec_id = ?, username = ?, first_name = ?' .
            ', last_name = ?, email = ?, role = ?, active = ?, nationality=?, pin=?, updated = now()  , has_expiration = ?, expiration_date = ? , user_type = ? ';
        $params[] = $pin;
    }
    $params[] = $hasExpiration;
    $params[] = $expirationDate;
    $params[] = $user_type;

    if (!empty($password)) {
        $sql = $sql . ", password=?";
        $hash = gate_hash_password($password);
        $params[] = $hash;
    }

    $sql = $sql . " where id = ?";
    $params[] = $id;

    error_log("SAVEUSER: Executing UPDATE SQL: $sql");
    error_log("SAVEUSER: UPDATE params: " . json_encode($params));
    $con->execute($sql, $params);
    error_log("SAVEUSER: User updated successfully - ID: $id");
}

if (empty($doc_id)) {
    $doc_id = gate_create_user_id($id);
    $sql = 'update user set doc_id = ? where id = ?';
    $con->execute($sql, array($doc_id, $id));
}

if (!empty($groups)) {
    $sql = 'delete from user_group_user where userId = ?';
    $con->execute($sql, $id);

    $groupIds = explode(',', $groups);
    $sql = 'insert into user_group_user (userId, userGroupId) values (?, ?)';
    foreach ($groupIds as $groupId) {
        $con->execute($sql, array($id, trim($groupId)));
    }
}

if (!empty($placeIds)) {
    $sql = 'delete from place_user where userId = ?';
    $con->execute($sql, $id);
    $placeIds = explode(',', $placeIds);
    $sql = 'insert into place_user (userId, placeId) values (?, ?)';
    foreach ($placeIds as $placeId) {
        $con->execute($sql, array($id, trim($placeId)));
    }
}

//device
$devices = getPostParameter('devicesIds');
if (!empty($devices)) {
    $sql = 'delete from user_device where user_id = ?';
    $con->execute($sql, $id);
    $devices = explode(',', $devices);
    $sql = 'insert into user_device (user_id, device_id) values (?, ?)';
    foreach ($devices as $deviceId) {
        $con->execute($sql, array($id, trim($deviceId)));
    }
}

// *** PROCESAMIENTO BIOMÉTRICO Y DE IMÁGENES ***
// Guardar foto del usuario y procesar patrón biométrico si está disponible
if (!empty($picture)) {
    try {
        error_log("SAVEUSER: Processing user picture for user ID: $id");
        
        // Limpiar el base64 (remover prefijo data:image si existe)
        $picture_clean = preg_replace('/^data:image\/[^;]+;base64,/', '', $picture);
        $picture_data = base64_decode($picture_clean);
        
        if ($picture_data !== false) {
            // *** PASO 1: Guardar imagen facial para reconocimiento biométrico ***
            error_log("SAVEUSER: Saving facial image for biometric recognition");
            try {
                $save_result = gate_save_face(FACE_TYPE_USER, $id, $picture_data);
                error_log("SAVEUSER: gate_save_face result: " . ($save_result ? 'SUCCESS' : 'FAILED'));
                
                // Verificar si se creó el archivo
                $face_path = gate_get_face_path(FACE_TYPE_USER, $id);
                error_log("SAVEUSER: Expected face path: " . $face_path);
                error_log("SAVEUSER: Face file exists: " . (file_exists($face_path) ? 'YES' : 'NO'));
                
                if (file_exists($face_path)) {
                    error_log("SAVEUSER: Face file size: " . filesize($face_path) . " bytes");
                }
            } catch (Exception $e) {
                error_log("SAVEUSER: Error calling gate_save_face: " . $e->getMessage());
            }
            
            // *** PASO 2: Generar y guardar vector biométrico ***
            error_log("SAVEUSER: Generating biometric pattern from facial image");
            $face_vector = gate_get_face_signature_from_image($picture_data);
            
            if (!empty($face_vector)) {
                // Guardar vector biométrico en la base de datos
                $vector_json = json_encode($face_vector);
                $sql_vector = 'UPDATE user SET vector = ? WHERE id = ?';
                $con->execute($sql_vector, array($vector_json, $id));
                error_log("SAVEUSER: Biometric pattern saved successfully for user ID: $id");
            } else {
                error_log("SAVEUSER: Warning - Could not generate biometric pattern from facial image");
            }
            
            // *** PASO 3: Crear directorio biométrico adicional si no existe ***
            global $dir_face_save;
            $id_mod = $id % 100;
            $biometric_dir = $dir_face_save . "/" . $id_mod;
            error_log("SAVEUSER: Biometric directory for user_id $id (mod 100 = $id_mod): $biometric_dir");
            
            if (!is_dir($biometric_dir)) {
                $mkdir_result = mkdir($biometric_dir, 0755, true);
                error_log("SAVEUSER: Created biometric subdirectory: $biometric_dir (result: " . ($mkdir_result ? 'SUCCESS' : 'FAILED') . ")");
                
                // Verificar permisos
                if (is_dir($biometric_dir)) {
                    error_log("SAVEUSER: Directory permissions: " . substr(sprintf('%o', fileperms($biometric_dir)), -4));
                    error_log("SAVEUSER: Directory owner: " . fileowner($biometric_dir));
                    error_log("SAVEUSER: Directory is writable: " . (is_writable($biometric_dir) ? 'YES' : 'NO'));
                }
            } else {
                error_log("SAVEUSER: Biometric directory already exists: $biometric_dir");
            }
            
            // *** PASO 4: Guardar copia de backup de la imagen (opcional) ***
            global $dir_user_pictures;
            if (!is_dir($dir_user_pictures)) {
                mkdir($dir_user_pictures, 0755, true);
                error_log("SAVEUSER: Created backup directory: $dir_user_pictures");
            }
            
            $picture_filename = 'user_' . $id . '_picture.jpg';
            $picture_filepath = rtrim($dir_user_pictures, '/') . '/' . $picture_filename;
            
            if (file_put_contents($picture_filepath, $picture_data) !== false) {
                error_log("SAVEUSER: Backup picture saved to: $picture_filepath");
                
                // Guardar ruta de backup (crear columna si no existe)
                try {
                    $sql_check = "SHOW COLUMNS FROM user LIKE 'picture_path'";
                    $column_exists = $con->get_one($sql_check);
                    
                    if (!$column_exists) {
                        $sql_add_column = "ALTER TABLE user ADD COLUMN picture_path VARCHAR(500) NULL";
                        $con->execute($sql_add_column);
                        error_log("SAVEUSER: Added picture_path column to user table");
                    }
                    
                    $sql_picture = 'UPDATE user SET picture_path = ? WHERE id = ?';
                    $con->execute($sql_picture, array($picture_filepath, $id));
                    error_log("SAVEUSER: Backup picture path saved to database");
                } catch (Exception $e) {
                    error_log("SAVEUSER: Error updating picture_path in database: " . $e->getMessage());
                }
            } else {
                error_log("SAVEUSER: Failed to save backup picture file");
            }
        } else {
            error_log("SAVEUSER: Invalid base64 picture data");
        }
    } catch (Exception $e) {
        error_log("SAVEUSER: Error processing picture: " . $e->getMessage());
    }
}

// Guardar firma del usuario si está disponible
if (!empty($signature)) {
    try {
        error_log("SAVEUSER: Processing user signature for user ID: $id");
        
        // Limpiar el base64 (remover prefijo data:image si existe)
        $signature_clean = preg_replace('/^data:image\/[^;]+;base64,/', '', $signature);
        $signature_data = base64_decode($signature_clean);
        
        if ($signature_data !== false) {
            // *** PASO 1: Guardar en ubicación del sistema biométrico (donde generateCertificate.php la busca) ***
            global $dir_face_save;
            $biometric_dir = $dir_face_save . "/" . ($id % 100);
            if (!is_dir($biometric_dir)) {
                mkdir($biometric_dir, 0755, true);
                error_log("SAVEUSER: Created biometric directory for signatures: $biometric_dir");
            }
            
            $system_signature_path = $biometric_dir . "/signature_" . $id . ".jpg";
            if (file_put_contents($system_signature_path, $signature_data) !== false) {
                error_log("SAVEUSER: System signature saved to: $system_signature_path");
            } else {
                error_log("SAVEUSER: Failed to save system signature to: $system_signature_path");
            }
            
            // *** PASO 2: Guardar backup en uploads ***
            global $dir_user_signatures;
            if (!is_dir($dir_user_signatures)) {
                mkdir($dir_user_signatures, 0755, true);
                error_log("SAVEUSER: Created directory: $dir_user_signatures");
            }
            
            // Nombre del archivo de firma
            $signature_filename = 'user_' . $id . '_signature.jpg';
            $signature_filepath = rtrim($dir_user_signatures, '/') . '/' . $signature_filename;
            
            // Guardar archivo
            if (file_put_contents($signature_filepath, $signature_data) !== false) {
                error_log("SAVEUSER: Signature saved successfully to: $signature_filepath");
                
                // Intentar actualizar base de datos con ruta de la firma (crear columna si no existe)
                try {
                    $sql_check = "SHOW COLUMNS FROM user LIKE 'signature_path'";
                    $column_exists = $con->get_one($sql_check);
                    
                    if (!$column_exists) {
                        $sql_add_column = "ALTER TABLE user ADD COLUMN signature_path VARCHAR(500) NULL";
                        $con->execute($sql_add_column);
                        error_log("SAVEUSER: Added signature_path column to user table");
                    }
                    
                    $sql_signature = 'UPDATE user SET signature_path = ? WHERE id = ?';
                    $con->execute($sql_signature, array($signature_filepath, $id));
                    error_log("SAVEUSER: Signature path saved to database");
                } catch (Exception $e) {
                    error_log("SAVEUSER: Error updating signature_path in database: " . $e->getMessage());
                }
            } else {
                error_log("SAVEUSER: Failed to save signature file");
            }
        } else {
            error_log("SAVEUSER: Invalid base64 signature data");
        }
    } catch (Exception $e) {
        error_log("SAVEUSER: Error processing signature: " . $e->getMessage());
    }
}

// Only save audit log if we have a valid auth_user_id (skip for notaria-scan mode)
if (!$skip_auth) {
    gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));
} else {
    error_log("SAVEUSER: Skipping audit log for notaria-scan mode");
}

$con->commit();
error_log("SAVEUSER: Transaction committed successfully. Final user ID: $id");

$result = array('id' => $id);
error_log("SAVEUSER: Returning result: " . json_encode($result));
echo json_encode($result);

?>
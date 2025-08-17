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

$picture = str_replace('data:image/jpeg;base64,', '', $image);
if (empty($picture)) {
    abort('EMPTY_IMAGE');
}

$face_image = base64_decode($picture);
if (empty($face_image)) {
    abort('INVALID_BASE64_IMAGE');
}

$user_id = gate_match_face($con, $face_image, $gate_match_face_tolerance, null, $rut);
if (empty($user_id)) {
    abort('CANNOT_IDENTIFY');
}

$user_info = gate_find_user($con, $user_id);

if ($probe) {
    $response = array(
        'type' => $type,
        'first_name' => $user_info['first_name'],
        'last_name'  => $user_info['last_name']
    );
} else {
    $event = gate_save_event($con, $user_id, $deviceId, $type, 0, 0, $plate);

    // Generar número de auditoría único
    $auditNumber = 'CERT-' . substr(time(), -6) . strtoupper(substr(md5(rand()), 0, 5));
    error_log("POSTEVENT: Generated audit number: $auditNumber");

    // Guardar imagen capturada
    try {
        error_log("POSTEVENT: Starting to save captured image for RUT: $rut");
        
        // Usar ruta absoluta para evitar problemas
        $upload_dir = '/var/www/html/gate/portal/web/uploads/captured_images/';
        
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0755, true);
            error_log("POSTVENT: Created directory: $upload_dir");
        } else {
            error_log("POSTVENT: Directory already exists: $upload_dir");
        }
        
        $filename = 'captured_' . $rut . '_' . $event['timestamp'] . '.jpg';
        $filepath = $upload_dir . $filename;
        
        error_log("POSTVENT: Saving image to: $filepath");
        
        if (file_put_contents($filepath, $face_image) !== false) {
            error_log("POSTVENT: Image saved successfully, inserting to DB");
            
            // Guardar referencia en base de datos incluyendo número de auditoría y operador
            $query = "INSERT INTO captured_images (rut, event_id, audit_number, operator_rut, filename, filepath, created_at) VALUES (?, ?, ?, ?, ?, ?, FROM_UNIXTIME(?))
                      ON DUPLICATE KEY UPDATE filename = VALUES(filename), filepath = VALUES(filepath), audit_number = VALUES(audit_number), operator_rut = VALUES(operator_rut), created_at = VALUES(created_at)";
            
            // Usar el timestamp como event_id ya que es único y consistente
            $event_id = $event['timestamp'];
            error_log("POSTVENT: Executing DB query with RUT: $rut, EventID: $event_id, AuditNumber: $auditNumber, OperatorRUT: $operatorRut, Filename: $filename");
            error_log("POSTVENT: Event data: " . json_encode($event));
            
            $con->execute($query, array($rut, $event_id, $auditNumber, $operatorRut, $filename, $filepath, $event['timestamp']));
            error_log("POSTVENT: Image reference saved to database successfully");
        } else {
            error_log("POSTVENT: Failed to save image file to: $filepath");
        }
    } catch (Exception $e) {
        error_log("POSTVENT ERROR: " . $e->getMessage());
        // No abortar el proceso por este error, solo registrarlo
    }

    // send notification email
    $user_email = $user_info['email'];
    if (!empty($user_email) && $gate_send_email_on_event) {
        $user_name  = gate_build_name($user_info['first_name'], $user_info['last_name']);
        //gate_send_email($user_email, $user_name, $event['timestamp'], $type);
        gate_send_email($user_email,$user_info['doc_id'], $user_name, $event['timestamp'], $type);
    }
    $response = array(
        'type' => $type,
        'time' => $event['timestamp'],
        'first_name' => $user_info['first_name'],
        'last_name'  => $user_info['last_name'],
        'event_id' => $event['id'] ?? $event['timestamp'],
        'audit_number' => $auditNumber
    );
}

echo json_encode($response);

?>

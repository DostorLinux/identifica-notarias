<?php

require __DIR__.'/../../vendor/autoload.php';

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/http.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/api.php';

$image = getPostParameter('image');
$rut = getPostParameter('rut');
$eventId = getPostParameter('eventId');

if (empty($image)) {
    abort('EMPTY_IMAGE');
}

if (empty($rut)) {
    abort('EMPTY_RUT');
}

$con = new SimpleDb();

// Limpiar imagen base64
$picture = str_replace('data:image/jpeg;base64,', '', $image);
$face_image = base64_decode($picture);

if (empty($face_image)) {
    abort('INVALID_BASE64_IMAGE');
}

try {
    // Crear directorio si no existe
    $upload_dir = __DIR__ . '/../../uploads/captured_images/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }
    
    // Generar nombre único para la imagen
    $filename = 'captured_' . $rut . '_' . time() . '.jpg';
    $filepath = $upload_dir . $filename;
    
    // Guardar imagen en el servidor
    if (file_put_contents($filepath, $face_image) === false) {
        abort('FAILED_TO_SAVE_IMAGE');
    }
    
    // Guardar referencia en base de datos
    $query = "INSERT INTO captured_images (rut, event_id, filename, filepath, created_at) VALUES (?, ?, ?, ?, NOW())
              ON DUPLICATE KEY UPDATE filename = VALUES(filename), filepath = VALUES(filepath), created_at = NOW()";
    
    $result = $con->query($query, array($rut, $eventId, $filename, $filepath));
    
    if (!$result) {
        error_log("Error saving captured image reference");
        abort('DATABASE_ERROR');
    }
    
    $response = array(
        'success' => true,
        'filename' => $filename,
        'message' => 'Imagen capturada guardada exitosamente'
    );
    
} catch (Exception $e) {
    error_log("Error in saveCapturedImage.php: " . $e->getMessage());
    abort('SAVE_ERROR: ' . $e->getMessage());
}

echo json_encode($response);

?>
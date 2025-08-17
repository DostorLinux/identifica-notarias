<?php

require __DIR__.'/../../vendor/autoload.php';

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/http.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/api.php';

$rut = getParameter('rut');
$eventId = getParameter('eventId');

if (empty($rut)) {
    abort('EMPTY_RUT');
}

$con = new SimpleDb();

try {
    // Buscar imagen capturada por RUT (y eventId si se proporciona)
    if (!empty($eventId)) {
        $query = "SELECT filename, filepath FROM captured_images WHERE rut = ? AND event_id = ? ORDER BY created_at DESC";
        $row = $con->get_row($query, array($rut, $eventId));
    } else {
        $query = "SELECT filename, filepath FROM captured_images WHERE rut = ? ORDER BY created_at DESC";
        $row = $con->get_row($query, array($rut));
    }
    
    if (empty($row)) {
        abort('IMAGE_NOT_FOUND');
    }
    
    $filepath = $row['filepath'];
    
    // Verificar que el archivo existe
    if (!file_exists($filepath)) {
        abort('FILE_NOT_FOUND');
    }
    
    // Leer y convertir imagen a base64
    $imageData = file_get_contents($filepath);
    if ($imageData === false) {
        abort('FAILED_TO_READ_IMAGE');
    }
    
    $base64Image = base64_encode($imageData);
    
    $response = array(
        'success' => true,
        'image' => 'data:image/jpeg;base64,' . $base64Image,
        'filename' => $row['filename']
    );
    
} catch (Exception $e) {
    error_log("Error in getCapturedImage.php: " . $e->getMessage());
    abort('GET_ERROR: ' . $e->getMessage());
}

echo json_encode($response);

?>
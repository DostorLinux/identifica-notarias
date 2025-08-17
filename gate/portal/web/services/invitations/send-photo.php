<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/api.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

header('Access-Control-Allow-Origin: http://localhost:4200');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('HTTP/1.1 200 OK');
    exit();
}

$raw_input = file_get_contents('php://input');
$request = json_decode($raw_input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    error_log("JSON Error: " . json_last_error_msg());
    portal_abort("Error en el formato JSON");
}

// Validar parámetros requeridos
$latitude = (float)sanitize(api_get($request, 'latitude'));
$longitude = (float)sanitize(api_get($request, 'longitude'));
$accuracy = (float)sanitize(api_get($request, 'accuracy'));
$qr = sanitize(api_get($request, 'qr'));
$photo = api_get($request, 'photo');

portal_check_mandatory($qr, 'qr');
portal_check_mandatory($photo, 'photo');

try {
    $con = new SimpleDb();

    // Obtener información de la invitación y dispositivo
    $sql = "SELECT 
        wi.id as invitation_id,
        wi.device_id,
        wiv.id as invited_id,
        wiv.status as invited_status,
        d.lat as device_latitude,
        d.lng as device_longitude,
        d.radio as device_radio
    FROM worker_invited wiv
    INNER JOIN worker_invitation wi ON wi.id = wiv.worker_invitation_id
    INNER JOIN device d ON d.id = wi.device_id
    WHERE wiv.qr_code = ?";

    $data = $con->get_row($sql, array($qr));

    if (!$data) {
        portal_abort("Invitación no encontrada o dispositivo no asignado");
    }

    // Validar que no esté ya validada
    if ($data['invited_status'] === 'VALIDATED') {
        portal_abort("La invitación ya ha sido validada anteriormente");
    }

    // Calcular distancia usando Haversine
    function calculateDistance($lat1, $lon1, $lat2, $lon2) {
        $earthRadius = 6371000;

        $lat1 = deg2rad($lat1);
        $lon1 = deg2rad($lon1);
        $lat2 = deg2rad($lat2);
        $lon2 = deg2rad($lon2);

        $latDelta = $lat2 - $lat1;
        $lonDelta = $lon2 - $lon1;

        $a = sin($latDelta/2) * sin($latDelta/2) +
            cos($lat1) * cos($lat2) *
            sin($lonDelta/2) * sin($lonDelta/2);

        $c = 2 * atan2(sqrt($a), sqrt(1-$a));

        return $earthRadius * $c;
    }

    // Validar posición
    $distance = calculateDistance(
        $latitude,
        $longitude,
        $data['device_latitude'],
        $data['device_longitude']
    );

    $isWithinRange = $distance <= ($data['device_radio']);

    if (!$isWithinRange) {
        portal_abort(sprintf(
            "Fuera del rango permitido. Distancia actual: %d metros. Rango máximo: %d metros.",
            round($distance),
            $data['device_radio']
        ));
    }

    // Procesar la imagen
    $photo = str_replace('data:image/jpeg;base64,', '', $photo);
    $photo = str_replace(' ', '+', $photo);
    $photoData = base64_decode($photo);

    if ($photoData === false) {
        portal_abort("Error al procesar la imagen");
    }

    // Actualizar worker_invited con la foto y cambiar estado
    $updateSql = "UPDATE worker_invited 
                  SET img =  ?, status = 'VALIDATED', 
                      enter_time = CURRENT_TIMESTAMP,
                      lat = ?,
                      lng = ?
                  WHERE id = ?";
    try {
        $con->execute(
            $updateSql,
            array($photo, $latitude, $longitude, $data['invited_id'])
        );
    }catch (Exception $e) {
        error_log("Error al actualizar invitación: " . $e->getMessage());
        portal_abort("Error al actualizar la invitación");
    }

    echo json_encode(array(
        'success' => true,
        'message' => 'Validación completada exitosamente',
        'data' => array(
            'invited_id' => $data['invited_id'],
            'distance' => round($distance),
            'validated_at' => date('Y-m-d H:i:s')
        )
    ));
} catch (Exception $e) {
    error_log("Error en validación con foto: " . $e->getMessage());
    portal_abort("Error al procesar la validación");
}
?>
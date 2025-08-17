<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/api.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';




// Debugging para ver el input raw
$raw_input = file_get_contents('php://input');
error_log("Raw input: " . $raw_input);

// Intentar decodificar directamente el input
$request = json_decode($raw_input, true);

// Debugging para ver si hay errores en el JSON
if (json_last_error() !== JSON_ERROR_NONE) {
    error_log("JSON Error: " . json_last_error_msg());
    portal_abort("Error en el formato JSON: " . json_last_error_msg());
}

// Si aún así request es null, intentar leer de otras fuentes
if ($request === null) {
    // Intentar leer del POST tradicional
    $request = $_POST;
    error_log("Using POST data: " . print_r($_POST, true));

    // Si sigue siendo null, intentar leer de php://input de otra manera
    if (empty($request)) {
        parse_str($raw_input, $request);
        error_log("Using parsed input: " . print_r($request, true));
    }
}

// Validar que tenemos datos
if (empty($request)) {
    error_log("No data received in any form");
    portal_abort("No se recibieron datos");
}

// Debug para ver qué datos tenemos
error_log("Final request data: " . print_r($request, true));


error_log(json_encode($request));
$value = json_encode($request);
// Validate required parameters
$latitude = (float)sanitize(api_get($request, 'latitude'));
$longitude = (float)sanitize(api_get($request, 'longitude'));
$qr = sanitize(api_get($request, 'qr'));

portal_check_mandatory($qr, 'qr');

error_log("Validating position for QR: $qr");
error_log("Latitude: $latitude, Longitude: $longitude");

try {
    $con = new SimpleDb();

    // Get invitation and device info
    $sql = "SELECT 
        wi.id as invitation_id,
        wi.device_id,
        d.lat as device_latitude,
        d.lng as device_longitude,
        d.radio as device_radio,
        d.name as device_name
    FROM worker_invited wiv
    INNER JOIN worker_invitation wi ON wi.id = wiv.worker_invitation_id
    INNER JOIN device d ON d.id = wi.device_id
    WHERE wiv.qr_code = ?";

    $data = $con->get_row($sql, array($qr));

    if (!$data) {
        portal_abort("Invitación no encontrada o dispositivo no asignado");
    }

    // Function to calculate distance between two points using Haversine formula
    function calculateDistance($lat1, $lon1, $lat2, $lon2) {
        $earthRadius = 6371000; // Radio de la tierra en metros

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

    // Calculate distance between user and device
    $distance = calculateDistance(
        $latitude,
        $longitude,
        $data['device_latitude'],
        $data['device_longitude']
    );

    // Check if user is within device radius (adding accuracy for tolerance)
    $isWithinRange = $distance <= ($data['device_radio']);

    $result = array(
        'success' => true,
        'within_range' => $isWithinRange,
        'distance' => round($distance),
        'device' => array(
            'id' => $data['device_id'],
            'name' => $data['device_name'],
            'latitude' => $data['device_latitude'],
            'longitude' => $data['device_longitude'],
            'radio' => $data['device_radio']
        ),
        'user_position' => array(
            'latitude' => $latitude,
            'longitude' => $longitude
        ),
        'access_allowed' => $isWithinRange
    );

    if (!$isWithinRange) {
        $result['message'] = sprintf(
            "Fuera del rango permitido. Distancia actual: %d metros. Rango máximo: %d metros.",
            round($distance),
            $data['device_radio']
        );
    }

    echo json_encode($result);

} catch (Exception $e) {
    error_log("Error validando posición: " . $e->getMessage());
    portal_abort("Error al validar la posición");
}
?>


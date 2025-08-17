<?php

header('Content-Type: application/json');

require __DIR__.'/../../vendor/autoload.php';

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/http.php';
include_once __DIR__ . '/../../include/simpledb.php';

$con = new SimpleDb();

try {
    echo json_encode([
        'timestamp' => date('Y-m-d H:i:s'),
        'database_info' => [
            'host' => DB_HOST,
            'database' => DB_NAME
        ],
        'captured_images_structure' => $con->get_array("DESCRIBE captured_images"),
        'captured_images_count' => $con->get_one("SELECT COUNT(*) FROM captured_images"),
        'recent_records' => $con->get_array("SELECT rut, event_id, audit_number, operator_rut, created_at FROM captured_images ORDER BY created_at DESC LIMIT 10"),
        'user_table_count' => $con->get_one("SELECT COUNT(*) FROM user"),
        'sample_users' => $con->get_array("SELECT id, username, doc_id, first_name, last_name, role FROM user WHERE role = 'super-admin' OR username LIKE '%admin%' LIMIT 5")
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode([
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}

?>
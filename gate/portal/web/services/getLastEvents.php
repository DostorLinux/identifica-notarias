<?php
include_once __DIR__ . '/../include/config.php';
include_once __DIR__ . '/../include/core.php';
include_once __DIR__ . '/../include/simpledb.php';
include_once __DIR__ . '/../include/portal.php';

portal_auth();

$location = getParameter('location');
$con = new SimpleDb();

// Build query for last events from audit_log table
$sql = "SELECT a.id, u.doc_id, u.first_name, u.last_name, a.ip as location, a.type, a.created
        FROM audit_log a
        LEFT JOIN user u ON a.userId = u.id
        ORDER BY a.created DESC 
        LIMIT 20";

$params = array();

// Add location filter if provided (using IP as location filter)
if (!empty($location)) {
    $sql = "SELECT a.id, u.doc_id, u.first_name, u.last_name, a.ip as location, a.type, a.created
            FROM audit_log a
            LEFT JOIN user u ON a.userId = u.id
            WHERE a.ip LIKE ? 
            ORDER BY a.created DESC 
            LIMIT 20";
    $params[] = '%' . $location . '%';
}

$events = $con->get_array($sql, $params);

$response = array(
    'success' => true,
    'data' => $events ? $events : array(),
    'status' => 'success'
);

echo json_encode($response);
?>
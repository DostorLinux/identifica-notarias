<?php
include_once __DIR__ . '/../include/config.php';
include_once __DIR__ . '/../include/core.php';
include_once __DIR__ . '/../include/simpledb.php';
include_once __DIR__ . '/../include/portal.php';
include_once __DIR__ . '/../../common/include/gate.php';

portal_auth();

// Debug: Log user role and constants
error_log("[USERS_PAGINATED] User role: " . $auth_user_role . " | PROFILE_ADMIN: " . PROFILE_ADMIN . " | PROFILE_SUPER_ADMIN: " . PROFILE_SUPER_ADMIN);

// Get pagination parameters from POST body
$request = json_from_post_body();

$page = isset($request['page']) ? (int)$request['page'] : 1;
$size = isset($request['size']) ? (int)$request['size'] : 10;
$filter = isset($request['filter']) ? $request['filter'] : '';
$column = isset($request['column']) ? $request['column'] : 'first_name';
$direction = isset($request['direction']) ? $request['direction'] : 'asc';

$con = new SimpleDb();

// Build base query
$sql = "SELECT id, doc_id, sec_id, username, first_name, last_name, email, role, active, pub_id, isDenied, deniedNote, user_type FROM user";
$params = array();

// Add filter if provided
if (!empty($filter)) {
    $sql .= " WHERE (first_name LIKE ? OR last_name LIKE ? OR doc_id LIKE ? OR username LIKE ?)";
    $filterParam = '%' . $filter . '%';
    $params = array($filterParam, $filterParam, $filterParam, $filterParam);
}

// Add role restrictions for non-admin users
if ($auth_user_role != PROFILE_ADMIN && $auth_user_role != PROFILE_SUPER_ADMIN) {
    if (!empty($filter)) {
        $sql .= " AND id = ?";
    } else {
        $sql .= " WHERE id = ?";
    }
    $params[] = $auth_user_id;
}

// Add ordering
$allowedColumns = ['first_name', 'last_name', 'doc_id', 'username', 'role', 'active'];
if (in_array($column, $allowedColumns)) {
    $sql .= " ORDER BY $column";
    if (strtolower($direction) === 'desc') {
        $sql .= " DESC";
    } else {
        $sql .= " ASC";
    }
}

// Count total records
$countSql = "SELECT COUNT(*) as total FROM (" . $sql . ") as counted_query";
$totalResult = $con->get_row($countSql, $params);
$total = (int)$totalResult['total'];

// Add pagination
$offset = ($page - 1) * $size;
$sql .= " LIMIT $size OFFSET $offset";

// Execute main query
$users = $con->get_array($sql, $params);

// Convert to expected format (array of arrays)
$userData = array();
if ($users) {
    foreach ($users as $user) {
        $userData[] = array(
            $user['pub_id'],      // 0
            $user['doc_id'],      // 1  
            $user['sec_id'],      // 2
            $user['username'],    // 3
            $user['first_name'],  // 4
            $user['last_name'],   // 5
            $user['email'],       // 6
            $user['role'],        // 7
            $user['active'],      // 8
            $user['id'],          // 9
            $user['isDenied'],    // 10
            $user['deniedNote'],  // 11
            $user['user_type']    // 12
        );
    }
}

$totalPages = ceil($total / $size);

$response = array(
    'success' => true,
    'data' => $userData,
    'total' => $total,
    'page' => $page,
    'size' => $size,
    'totalPages' => $totalPages,
    'hasMore' => $page < $totalPages
);

echo json_encode($response);
?>
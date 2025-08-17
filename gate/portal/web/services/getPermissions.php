<?php
include_once __DIR__ . '/../include/config.php';
include_once __DIR__ . '/../include/core.php';
include_once __DIR__ . '/../include/simpledb.php';
include_once __DIR__ . '/../include/portal.php';

portal_auth();

// Return user permissions based on role
$permissions = array(
    'canViewUsers' => in_array($auth_user_role, [PROFILE_ADMIN, PROFILE_SUPER_ADMIN]),
    'canCreateUsers' => in_array($auth_user_role, [PROFILE_ADMIN, PROFILE_SUPER_ADMIN]),
    'canEditUsers' => in_array($auth_user_role, [PROFILE_ADMIN, PROFILE_SUPER_ADMIN]),
    'canDeleteUsers' => in_array($auth_user_role, [PROFILE_ADMIN, PROFILE_SUPER_ADMIN]),
    'canViewCompanies' => in_array($auth_user_role, [PROFILE_ADMIN, PROFILE_SUPER_ADMIN]),
    'canCreateCompanies' => in_array($auth_user_role, [PROFILE_ADMIN, PROFILE_SUPER_ADMIN]),
    'canViewDevices' => in_array($auth_user_role, [PROFILE_ADMIN, PROFILE_SUPER_ADMIN]),
    'canViewEvents' => true, // All authenticated users can view events
    'canViewReports' => in_array($auth_user_role, [PROFILE_ADMIN, PROFILE_SUPER_ADMIN]),
    'role' => $auth_user_role,
    'userId' => $auth_user_id,
    'username' => $auth_user_name
);

$response = array(
    'success' => true,
    'permissions' => $permissions
);

echo json_encode($response);
?>
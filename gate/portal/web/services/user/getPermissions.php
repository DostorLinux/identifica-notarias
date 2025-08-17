<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth();

// Ensure constants are defined
if (!defined('PROFILE_ADMIN')) {
    define('PROFILE_ADMIN', 'admin');
}
if (!defined('PROFILE_SUPER_ADMIN')) {
    define('PROFILE_SUPER_ADMIN', 'super_admin');
}

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

// Create dashboard actions based on permissions
$dashboard_actions = array(
    array(
        'id' => 'usuarios',
        'title' => 'Usuarios',
        'icon' => 'people-outline',
        'color' => '#10B981',
        'route' => 'explore',
        'enabled' => $permissions['canViewUsers']
    ),
    array(
        'id' => 'empresas',
        'title' => 'Empresas',
        'icon' => 'business-outline',
        'color' => '#10B981',
        'route' => 'companies',
        'enabled' => $permissions['canViewCompanies']
    ),
    array(
        'id' => 'dispositivos',
        'title' => 'Dispositivos',
        'icon' => 'hardware-chip-outline',
        'color' => '#10B981',
        'route' => 'dispositivos',
        'enabled' => $permissions['canViewDevices']
    ),
    array(
        'id' => 'marcaciones',
        'title' => 'Marcaciones',
        'icon' => 'time-outline',
        'color' => '#10B981',
        'route' => 'marcaciones',
        'enabled' => $permissions['canViewEvents']
    ),
    array(
        'id' => 'seguridad',
        'title' => 'Seguridad',
        'icon' => 'shield-checkmark-outline',
        'color' => '#10B981',
        'route' => 'security',
        'enabled' => $permissions['canViewReports']
    ),
    array(
        'id' => 'agendamiento',
        'title' => 'Agendamiento',
        'icon' => 'calendar-outline',
        'color' => '#10B981',
        'route' => 'agendamiento',
        'enabled' => $permissions['canViewEvents']
    ),
    array(
        'id' => 'invitaciones',
        'title' => 'Invitaciones',
        'icon' => 'mail-outline',
        'color' => '#10B981',
        'route' => 'invitaciones',
        'enabled' => $permissions['canViewEvents']
    )
);

$response = array(
    'success' => true,
    'permissions' => $permissions,
    'dashboard_actions' => $dashboard_actions
);

echo json_encode($response);
?>
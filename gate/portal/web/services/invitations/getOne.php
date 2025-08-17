<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();
$invitation_id = getParameter('id');

// Verificar si el usuario es admin o es el propietario de la invitación
$auth_check_sql = "SELECT worker_id FROM worker_invitation WHERE id = ?";
$worker_id = $con->get_one($auth_check_sql, array($invitation_id));

if (!is_admin() && $worker_id != get_auth_id()) {
    echo json_encode(array(
        'success' => false,
        'message' => 'No tiene permisos para ver esta invitación'
    ));
    exit;
}

// Obtener los detalles de la invitación
$sql = "SELECT wi.id,
               wi.worker_id,
               wi.company,
               wi.description,
               wi.init,
               wi.end,
               wi.event_duration,
               wi.created,
               wi.updated,
               u.first_name as creator_first_name,
               u.last_name as creator_last_name,
               u.email as creator_email
        FROM worker_invitation wi
        LEFT JOIN user u ON u.id = wi.worker_id
        WHERE wi.id = ?";

$invitation = $con->get_row($sql, array($invitation_id));

if (!$invitation) {
    echo json_encode(array(
        'success' => false,
        'message' => 'Invitación no encontrada'
    ));
    exit;
}

// Obtener la lista de invitados
$sql_invited = "SELECT wi.id,
                       wi.user_id,
                       wi.name,
                       wi.email,
                       wi.qr_code,
                       wi.created,
                       wi.updated
                FROM worker_invited wi
                WHERE wi.worker_invitation_id = ?
                ORDER BY wi.created ASC";

$invited_users = $con->get_array($sql_invited, array($invitation_id));

// Preparar la respuesta
//getGenericEmail($email, $code, $nombre, $fechaAcceso)

$init = $invitation['init'];
$result = array(
    'success' => true,
    'data' => array(
        'invitation' => array(
            'id' => $invitation['id'],
            'company' => $invitation['company'],
            'description' => $invitation['description'],
            'init' => $invitation['init'],
            'end' => $invitation['end'],
            'event_duration' => $invitation['event_duration'],
            'created' => $invitation['created'],
            'updated' => $invitation['updated'],
            'invited_users' => array_map(function($user) {
                global $init;
                $templateEmail = getGenericEmail($user['email'],$user['qr_code'],$user['name'],$init);
                return array(
                    'id' => $user['id'],
                    'user_id' => $user['user_id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'qr_code' => $user['qr_code'],
                    'templateEmail' => $templateEmail,
                    'created' => $user['created'],
                    'updated' => $user['updated']
                );
            }, $invited_users),
            'creator' => array(
                'id' => $invitation['worker_id'],
                'first_name' => $invitation['creator_first_name'],
                'last_name' => $invitation['creator_last_name'],
                'email' => $invitation['creator_email']
            )
        ),
    )
);

echo json_encode($result);
?>
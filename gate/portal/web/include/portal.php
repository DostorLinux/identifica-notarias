<?php
require __DIR__.'/../vendor/autoload.php';

include_once __DIR__ . '/api.php';
include_once __DIR__ . '/../include/gate.php';
include_once __DIR__.'/qrcode/qrcode.php';

$auth_user_id   = null;
$auth_user_name = null;
$auth_user_role = null;

$timezone_offset = null;

function portal_auth() {
    global $auth_user_id;
    global $auth_user_name;
    global $auth_user_role;

    if (api_get_authorization_header()!=null){
        try {
            $token = gate_jwt_auth();
            $auth_user_id   = $token["userId"];
            $auth_user_name = $token["username"];
            $auth_user_role = $token["role"];
            return;
        }catch (ErrorException $exception){
            die('INVALID_SESSION');
        }
    }
    session_start();
    $token = getValue($_SESSION, 'token');

    if (empty($token)) {
        die('INVALID_SESSION');
    }

    $auth_user_id   = getValue($_SESSION, 'user_id');
    $auth_user_name = getValue($_SESSION, 'user_name');
    $auth_user_role = getValue($_SESSION, 'user_role');
}

function portal_auth_admin() {
    portal_auth();
    portal_check_admin();
}
function portal_get_role(){
    global $auth_user_role;
    return $auth_user_role;
}

function portal_check_admin() {
    global $auth_user_role;
    if ($auth_user_role == 'admin'||$auth_user_role=='super_admin') return;
    gate_abort('Esta operación requiere rol de Administrador');
}

function portal_check_scheduler_permissions() {
    global $auth_user_role;
    if ($auth_user_role == 'admin' || $auth_user_role == 'super_admin' || $auth_user_role == 'empresa') return;
    gate_abort('Esta operación requiere permisos de administrador o empresa');
}

function portal_abort($msg) {
    $result = array('error' => $msg);
    die(json_encode($result));
}

function portal_check_mandatory($value, $name) {
    if (empty($value)) {
        portal_abort("El campo '$name' es obligatorio");
    }
}

function portal_check_mandatory_float($value, $name) {
    portal_check_mandatory($value, $name);
    return portal_check_float($value, $name);
}

function portal_check_mandatory_int($value, $name) {
    portal_check_mandatory($value, $name);
    return portal_check_int($value, $name);
}

function portal_check_float($value, $name) {
    if (!is_numeric($value)) {
        portal_abort("El campo '$name' no es un número válido");
    }
    return (float)$value;
}

function portal_check_int($value, $name) {
    $int_value = (int)$value;
    if (!is_numeric($value) || "$int_value" != $value) {
        portal_abort("El campo '$name' no es un número entero válido");
    }
    return (int)$value;
}

function portal_check_email($value, $name) {
    if (!isValidEmail($value)) {
        portal_abort("El campo '$name' debe ser un email válido");
    }
}

function portal_abort_existing_doc_id($user) {
    $active_status  = $user['active'] == 'Y' ? '' : '(inactivo)';
    $user_full_name = $user['first_name'].' '.$user['last_name'];
    $user_summary   = "$user_full_name $active_status";
    portal_abort("Ya existe un usuario con el mismo Id de documento: $user_summary");
}

function portal_validate_user_password($con, $username, $password) {
    if (empty($password)) return false;
    return gate_login($con, $username, $password) != null;
}

function portal_get_timezone_offset() {
    global $timezone_offset;

    if (empty($timezone_offset)) {
        $timezone = timezone_open("America/Santiago");
        $datetime_cl = date_create("now", timezone_open("UTC"));
        $timezone_offset = timezone_offset_get($timezone, $datetime_cl);
    }
    return $timezone_offset;
}

function portal_get_formatted_time($time) {
    return gmdate("Y-m-d H:i:s", $time + portal_get_timezone_offset());
}

function portal_check_max_active_users($con, $active) {
    global $max_active_users;

    if ($active != 'Y') return;

    $sql = 'select count(1) from user where active = ?';
    $active_users = (int)$con->get_one($sql, 'Y');
    if ($active_users < $max_active_users) return;

    portal_abort("No se pueden activar más de $max_active_users usuarios");
}

function portal_create_qr_code_image($code) {
    global $user_id_qr_code_options;
    $generator = new QRCode($code, $user_id_qr_code_options);

    return $generator->render_image();
}

function sendEmailWithQRCode($email, $code, $nombre, $fechaAcceso)
{
    try{
        error_log("Antes de generar el código QR".$code."----".$email);
        $generator = new QRCode("identifica-access;".$code,  array('sf' => 15));
        error_log("Luego");
        ob_start();
        $image = $generator->render_image();
        imagepng ($image);
        $image_data = ob_get_contents();
        ob_end_clean ();
        $qr_code = base64_encode ($image_data);

    }catch (Exception $e){
        error_log("Error al generar el código QR");
        portal_abort("Error al generar el código QR");
    }
    if ($email != null) {
        try {
            gate_email_qr_raw($email, 'Acceso', "Invitación a reunión", "
            <p>Estimado/a $nombre, </p>
            <p>Usted ha sido invitado a una reunión programada para el $fechaAcceso.</p>
            <p>Una vez llegue al acceso pinche el siguiente link:</p>
            <p><a href='".getURL($code)."'>Registrar Acceso</a></p>
            <p>Debe estar cerca de la puerta de acceso y sólo se abrirá si todos los invitados han registrado su acceso</p>
            ",
                "Link de un uso no comparta este correo. Generado por identifica.ai", $qr_code);
        } catch (Exception $e) {
            error_log("Error al enviar el correo con el código QR");
            portal_abort("Error al generar el código QR");
        }
    }
}


function getGenericEmail($email, $code, $nombre, $fechaAcceso)
{
    try{
        error_log("Antes de generar el código QR".$code."----".$email);
        $generator = new QRCode("identifica-access;".$code,  array('sf' => 15));
        error_log("Luego");
        ob_start();
        $image = $generator->render_image();
        imagepng ($image);
        $image_data = ob_get_contents();
        ob_end_clean ();
        $qr_code = base64_encode ($image_data);

    }catch (Exception $e){
        error_log("Error al generar el código QR");
        portal_abort("Error al generar el código QR");
    }
    $response= array();
        try {
            $response['email']="Estimado/a $nombre,
            <p>Usted ha sido invitado a una reunión programada para el $fechaAcceso.</p>
            <p>Una vez llegue al acceso pinche el siguiente link:</p>
            <p><a href='".getURL($code)."'>Registrar Acceso</a></p>
            <p>Debe estar cerca de la puerta de acceso y sólo se abrirá si todos los invitados han registrado su acceso</p>
            ";
            $response['qr_code']=$qr_code;
        } catch (Exception $e) {
            error_log("Error al enviar el correo con el código QR");
            portal_abort("Error al generar el código QR");
        }
    return $response;
}


function getURL($code){
    global $base_URL;
    return $base_URL.'/invitation/access/qr/'.$code;
}
function updateAccessAndNotify($accessId, $email, $nombre, $fechaAcceso, $code)
{
    try{
        error_log("Antes de generar el código QR".$code."----".$email);
        $generator = new QRCode("identifica-access;".$code,  array('sf' => 15));
        error_log("Luego");
        ob_start();
        $image = $generator->render_image();
        imagepng ($image);
        $image_data = ob_get_contents();
        ob_end_clean ();
        $qr_code = base64_encode ($image_data);

    }catch (Exception $e){
        error_log("Error al generar el código QR");
        portal_abort("Error al generar el código QR");
    }
        try {
            gate_email_qr_raw($email, 'Actualización de Acceso', "Modificación de invitación", "
            <p>Estimado/a $nombre, </p>
            <p>Su acceso ha sido modificado con los siguientes detalles:</p>
            <p>Nueva fecha de acceso: $fechaAcceso</p>
            <p>Para registrar su acceso cuando llegue, por favor utilice el siguiente link:</p>
            <p><a href='".getURL($code)."'>Registrar Acceso</a></p>
            <p>Recuerde que debe estar cerca de la puerta de acceso y sólo se abrirá si todos los invitados han visitado el link</p>
            <p>Este correo reemplaza cualquier invitación anterior.</p>
            ",
                "Link de un uso no comparta este correo. Generado por identifica.ai",
                $qr_code);
            // Registrar en el log la actualización
            error_log("Acceso actualizado - ID: $accessId, Email: $email, Fecha: $fechaAcceso");
            return true;
        } catch (Exception $e) {
            error_log("Error al enviar la notificación de actualización: " . $e->getMessage());
            portal_abort("Error al enviar la notificación de actualización del acceso");
        }

}



?>
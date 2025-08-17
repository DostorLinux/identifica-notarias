<?php 

$db_user = 'identifica';
$db_pass = 'identifica_pass';
$db_name = 'identifica_dev';
$db_host = '127.0.0.1';
$db_port = '3306';
$mysql_use_utf8 = true;

$url_face_match = 'http://localhost:5000';
$dir_face_match = '/opt/face_match';
$dir_face_save  = '/opt/face_match/faces';
$dir_face_history = '/opt/face_match/history';
$dir_face_save_visitor = '/opt/face_match/faces_visitor';

$match_history_enabled = false;
$match_history_size = 50;

$api_shared_key = 'pla2020pli';
$gate_password_salt = 'superduper';
$gate_match_face_tolerance = 0.56;
$gate_first_internal_user_id = 87532;
$gate_default_location = 1;
$gate_send_email_on_event = false;
$gate_check_mask = false;
$gate_validate_plates = true;
$gate_validate_plates_abort_on_fail = false;
$gate_has_dependencies = true;

$portal_max_devices=10;
$portal_max_gates=4;
$portal_max_places=4;
$portal_show_gates=true;
$portal_show_buffer=true;
$user_types_csv = "conductor,visitante,trabajador";
$allowed_login_roles = ["admin","super_admin","gate","worker","empresa"];
$invitation_device=2;

$gate_image_max_size = 1024;

$portal_requires_pin = true;
$portal_confirm_identity = false;

$user_id_base_seq = 16936857;
$user_id_base_offset = 512823876;
$user_id_qr_code_options = array('sf' => 10);

$max_active_users = 200;

$cas_enabled = false;
$cas_wsdl_url = '';
$cas_user = '';
$cas_password = '';

$xps_enabled = true;

$reports_url = '';
$reports_user = '';
$reports_pass = '';


//Callback:

$detect_has_callback=true;
$detect_URL_callback='http://localhost:8080/portal/web/services/CALLBACK/event.php?status=<%status%>&event=<%event%>&uuid=<%uuid%>&detail=<%detail%>';


$reports_event_type_enter = 1;
$reports_event_type_exit  = 4;

$email_login = '';
$email_password = '';
$email_doc_id_name = 'RUT';
$email_event_subject = 'Marcación registrada';
$email_event_content =
    "Usuario: {name}\n".
    "{doc_id_name}: {doc_id}\n".
    "Tipo: {type}\n".
    "Fecha: {timestamp}\n\n".
    "Atte. El equipo de Identifica.";

// SMTP Configuration for temporary passwords
$smtp_host = 'smtp.office365.com';
$smtp_port = 587;
$smtp_username = 'contactosai@alcatrans.cl';
$smtp_password = 'SAI.050825';
$smtp_from_email = 'contactosai@alcatrans.cl';
$smtp_from_name = 'Sistema Identifica';

// https://techdocs.akamai.com/iot-token-access-control/docs/generate-rsa-keys
$gate_jwt_private_key = __DIR__.'/keys/jwtRSA256-private.pem';
$gate_jwt_public_key  = __DIR__.'/keys/jwtRSA256-public.pem';

$gate_has_areas = true;

$base_URL='http://localhost:8081';




$extra_config_files = array(
    __DIR__.'/localconfig.php',
    '/opt/localconfig/newstack/gate/api.php',
    '/opt/privateconfig/newstack/gate/api.php');

foreach ($extra_config_files as $extra_config_file) {
	if (file_exists($extra_config_file)) include_once($extra_config_file);
}

?>
<?php

include_once __DIR__ . '/image.php';
include_once __DIR__ . '/http.php';
include_once __DIR__ . '/cas.php';
include_once __DIR__ . '/xps.php';

// Load PHPMailer classes
$phpmailer_autoload = __DIR__ . '/../vendor/autoload.php';
if (file_exists($phpmailer_autoload)) {
    require_once $phpmailer_autoload;
} else {
    error_log("[EMAIL_ERROR] PHPMailer autoload not found at: $phpmailer_autoload");
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

$api_abort_hook = 'gate_abort';

$gate_valid_entries = array(
    'none',
    'enter',
    'exit',
    'enter_break',
    'exit_break'
);

define('PROFILE_SUPER_ADMIN', 'super_admin');
define('PROFILE_ADMIN', 'admin');

define('PROFILE_GATE', 'gate');
define('PROFILE_NORMAL', 'normal');
define('PROFILE_USER', 'user');
define('PROFILE_WORKER', 'worker');


define('AUDIT_USER_CREATE', 'USER_CREATE');
define('AUDIT_USER_MODIFY', 'USER_MODIFY');
define('AUDIT_USER_ALLOWED', 'USER_ALLOWED');
define('AUDIT_USER_DENIED', 'USER_DENIED');
define('AUDIT_USER_PASSWORD_CHANGE','PASSWORD_CHANGED');

define('AUDIT_AREA_CREATE', 'AREA_CREATE');
define('AUDIT_AREA_MODIFY', 'AREA_MODIFY');
define('AUDIT_AREA_DELETE', 'AREA_DELETE');

define('AUDIT_GROUP_CREATE', 'GROUP_CREATE');
define('AUDIT_GROUP_MODIFY', 'GROUP_MODIFY');
define('AUDIT_GROUP_DELETE', 'GROUP_DELETE');

define('AUDIT_COMPANY_CREATE', 'COMPANY_CREATE');
define('AUDIT_COMPANY_MODIFY', 'COMPANY_MODIFY');
define('AUDIT_COMPANY_DENIED', 'COMPANY_DENIED');
define('AUDIT_COMPANY_ALLOWED', 'COMPANY_ALLOWED');

define('AUDIT_DEVICE_CREATE', 'DEVICE_CREATE');
define('AUDIT_DEVICE_MODIFY', 'DEVICE_MODIFY');

define('AUDIT_ALLOWGROUP_CREATE', 'ALLOWGROUP_CREATE');
define('AUDIT_ALLOWGROUP_MODIFY', 'ALLOWGROUP_MODIFY');
define('AUDIT_ALLOWGROUP_DELETE', 'ALLOWGROUP_DELETE');

define('AUDIT_ALLOWGROUPUSR_ADD', 'ALLOWGROUPUSR_ADD');
define('AUDIT_ALLOWGROUPUSR_MODIFY', 'ALLOWGROUPUSR_MODIFY');
define('AUDIT_ALLOWGROUPUSR_DELETE', 'ALLOWGROUPUSR_DELETE');


define('ALLOW_LIST_ADD', 'ALLOW_LIST_ADD');


define('AUDIT_GATE_CREATE', 'GATE_CREATE');
define('AUDIT_GATE_MODIFY', 'GATE_MODIFY');

define('AUDIT_LOGBOOK_CREATE', 'LOGBOOK_CREATE');
define('AUDIT_LOGBOOK_SAVE', 'LOGBOOK_SAVE');

define('AUDIT_PLACE_CREATE', 'PLACE_CREATE');
define('AUDIT_PLACE_MODIFY', 'PLACE_MODIFY');
define('AUDIT_PLACE_DELETE', 'PLACE_DELETE');

define('AUDIT_VEHICLE_CREATE', 'VEHICLE_CREATE');
define('AUDIT_VEHICLE_MODIFY', 'VEHICLE_MODIFY');
define('AUDIT_VEHICLE_ALLOWED', 'VEHICLE_ALLOWED');
define('AUDIT_VEHICLE_DENIED', 'VEHICLE_DENIED');

define('AUDIT_DRIVER_SAVE', 'DRIVER_SAVE');
define('AUDIT_DRIVER_DELETE', 'DRIVER_DELETE');

define('AUDIT_VEHICLE_COMPANY_SAVE', 'VEHICLE_COMPANY_SAVE');
define('AUDIT_VEHICLE_COMPANY_DELETE', 'VEHICLE_COMPANY_DELETE');

define('AUDIT_VISITOR_CREATE', 'VISITOR_CREATE');
define('AUDIT_VISITOR_MODIFY', 'VISITOR_MODIFY');

define('AUDIT_WORKER_SAVE', 'WORKER_SAVE');
define('AUDIT_WORKER_DELETE', 'WORKER_DELETE');

define('AUDIT_ALLOW_CREATE', 'ALLOW_CREATE');
define('AUDIT_ALLOW_UPDATE', 'ALLOW_UPDATE');
define('AUDIT_ALLOW_REMOVE', 'ALLOW_REMOVE');



define('FACE_TYPE_USER', 'USER');
define('FACE_TYPE_VISITOR', 'VISITOR');

function gate_abort($code, $data = null)
{
    if ($code == 'INVALID_EMAIL') {
        http_response_code(HTTP_BAD_REQUEST);
        return "Invalid email address for field $data";
    } else if ($code == 'UNAUTHORIZED') {
        http_response_code(HTTP_FORBIDDEN);
        return "Invalid authorization";
    } else if ($code == 'INVALID_ROLE') {
        http_response_code(HTTP_FORBIDDEN);
        return "Invalid role for this operation";
    } else if ($code == 'INVALID_IMAGE') {
        http_response_code(HTTP_BAD_REQUEST);
        return $data;
    } else if ($code == 'INVALID_IMAGE_MASK') {
        http_response_code(HTTP_BAD_REQUEST);
        return $data;
    } else if ($code == 'INTERNAL_ERROR') {
        http_response_code(HTTP_INTERNAL_ERROR);
        error_log($data);
    } else if ($code == 'USER_NOT_FOUND') {
        http_response_code(HTTP_NOT_FOUND);
        return 'User not found';
    } else if ($code == 'AREA_NOT_FOUND') {
        http_response_code(HTTP_NOT_FOUND);
        return 'User not found';
    } else if ($code == 'NO_MATCHING_AREAS') {
        http_response_code(HTTP_FORBIDDEN);
        return 'No matching areas for ' . json_encode($data);
    } else if ($code == 'DEPENDENCY_FAILED') {
        http_response_code(HTTP_FORBIDDEN);
        $device_name = $data['device_name'];
        $max_minutes = $data['max_minutes'];
        return "Se requiere marcación por puerta $device_name hace máximo $max_minutes minutos";
    } else if ($code == 'IMAGE_NOT_FOUND') {
        http_response_code(HTTP_NOT_FOUND);
        return $data;
    } else if ($code == 'VEHICLE_DENIED') {
        http_response_code(HTTP_FORBIDDEN);
        return "Vehicle not allowed: $data";
    } else if ($code == 'INVALID_VEHICLE') {
        http_response_code(HTTP_FORBIDDEN);
        return "Patente Inválida: $data";
    }
    return $code;
}

function gate_login($con, $user, $pass)
{
    $hash = gate_hash_password($pass);
    $sql = 'select id, must_change_password from user where (username = ? or doc_id = ?) and password = ?';
    $result = $con->get_row($sql, array($user, $user, $hash));
    if (empty($result)) return null;

    $userId = $result['id'];
    $mustChangePassword = $result['must_change_password'] ?? 0;
    
    $userInfo = gate_find_user($con, $userId);
    if ($userInfo) {
        $userInfo['must_change_password'] = $mustChangePassword;
    }
    
    return $userInfo;
}

function get_jwt_config()
{
    global $gate_jwt_private_key;
    global $gate_jwt_public_key;
    $private_key = Lcobucci\JWT\Signer\Key\InMemory::file($gate_jwt_private_key);
    $public_key = Lcobucci\JWT\Signer\Key\InMemory::file($gate_jwt_public_key);

    return Lcobucci\JWT\Configuration::forAsymmetricSigner(new Lcobucci\JWT\Signer\Rsa\Sha256(), $private_key, $public_key);
}

function gate_create_token($user_info)
{
    $config = get_jwt_config();

    $now = new DateTimeImmutable();
    $token = $config->builder()
        ->issuedBy('gate')
        ->permittedFor('gate')
        ->identifiedBy($user_info['doc_id'])
        ->issuedAt($now)
        ->withClaim('userId', $user_info['id'])
        ->withClaim('username', $user_info['username'])
        ->withClaim('role', $user_info['role'])
        ->expiresAt($now->modify('+1 hour'))
        ->getToken($config->signer(), $config->signingKey());
    return $token->toString();
}

function gate_jwt_get_auth_info($encoded_token)
{
    $config = get_jwt_config();
    $token = $config->parser()->parse($encoded_token);

    $auth_info = array(
        'doc_id' => $token->claims()->get('jti'),
        'userId' => $token->claims()->get('userId'),
        'username' => $token->claims()->get('username'),
        'role' => $token->claims()->get('role')
    );

    return $auth_info;
}

function gate_jwt_auth()
{
    $encoded_token = api_get_bearer_token();
    if (empty($encoded_token)) api_abort('UNAUTHORIZED');
    try {
        return gate_jwt_get_auth_info($encoded_token);
    } catch (Exception $e) {
        error_log("ERROR gate_jwt_auth: " . $e->getMessage());
        api_abort('INVALID_REQUEST');
    }
}

function gate_jwt_auth_admin()
{
    $auth_info = gate_jwt_auth();
    if ($auth_info['role'] != 'admin') {
        api_abort('INVALID_ROLE');
    }
    return $auth_info;
}


function is_admin() {
    global $auth_user_role;
    return in_array($auth_user_role, [PROFILE_ADMIN, PROFILE_SUPER_ADMIN]);
}
function is_super_admin() {
    global $auth_user_role;
    return $auth_user_role == PROFILE_SUPER_ADMIN;
}

function get_auth_id() {
    global $auth_user_id;
    return $auth_user_id;
}


function gate_prepare_face_image($face_image)
{
    global $dir_face_match;
    global $gate_image_max_size;

    $face_file_name = @tempnam("$dir_face_match/tmp", "face_prepare");
    file_put_contents($face_file_name, $face_image);
    error_log("image saved on $face_file_name");

    $image = imagecreatefromjpeg($face_file_name);
    $image = image_restrict_size($face_file_name, $image, $gate_image_max_size);
    $image = image_rotate_from_exif($face_file_name, $image);

    // unlink($face_file_name);
    return $image;
}

function gate_get_face_signature_from_image($face_image, $must_check_mask = false)
{
    global $dir_face_match;

    $face_image = gate_prepare_face_image($face_image);

    $face_file_name = @tempnam("$dir_face_match/tmp", "face_vector");
    error_log("get signature from $face_file_name");

    imagejpeg($face_image, $face_file_name);
    chmod($face_file_name, 0664);

    $result = gate_get_face_signature_from_file($face_file_name, $must_check_mask);
    // unlink($face_file_name);
    return $result;
}

function gate_get_face_signature_from_file($file_name, $must_check_mask)
{
    global $url_face_match;

    $request = array('file_name' => $file_name);
    try {
        if ($must_check_mask) {
            $url = "$url_face_match/is_mask";
            $response = http_post_json($url, $request);
            if ($response['is_mask']) api_abort('INVALID_IMAGE_MASK', 'Face has a mask');
        }

        $url = "$url_face_match/encode";
        $response = http_post_json($url, $request);
        if (isset($response['error'])) api_abort('INVALID_IMAGE', $response['error']);
        return $response;
    } catch (Exception $e) {
        $msg = 'Cannot encode image: ' . $e->getMessage();
        api_abort('INTERNAL_ERROR', $msg);
    }
}

function gate_document_read($doc_image)
{
    $doc_file_name = gate_prepare_document_image($doc_image);
    return gate_document_read_from_file($doc_file_name);
}

function gate_prepare_document_image($doc_image)
{
    global $dir_face_match;
    global $gate_image_max_size;

    $doc_file_name = @tempnam("$dir_face_match/tmp", "doc_image");
    file_put_contents($doc_file_name, $doc_image);
    error_log("image saved on $doc_file_name");

    $image = imagecreatefromjpeg($doc_file_name);
    $image = image_restrict_size($doc_file_name, $image, $gate_image_max_size);
    $image = image_rotate_from_exif($doc_file_name, $image);

    imagejpeg($image, $doc_file_name);
    chmod($doc_file_name, 0664);

    return $doc_file_name;
}

function gate_document_read_from_file($file_name)
{
    global $url_face_match;

    $request = array('file_name' => $file_name);
    try {
        $url = "$url_face_match/document_read";
        $response = http_post_json($url, $request);
        if (isset($response['error'])) api_abort('INVALID_IMAGE', $response['error']);
        return $response;
    } catch (Exception $e) {
        $msg = 'Cannot read image: ' . $e->getMessage();
        api_abort('INTERNAL_ERROR', $msg);
    }
}

function gate_match_vector($input_vector, $match_vector)
{
    global $url_face_match;

    $url = "$url_face_match/match";

    $input_vector[15] = 0;

    $request = array('input_vector' => $input_vector, 'match_vector' => $match_vector);
    try {
        $response = http_post_json($url, $request);

        $distance = $response['distance'];
        return (float)$distance;
    } catch (Exception $e) {
        $msg = 'Cannot match vector: ' . $e->getMessage();
        api_abort('INTERNAL_ERROR', $msg);
    }
}

function gate_find_user($con, $user_id, $include_inactive = false)
{
    $sql = 'select id, doc_id, sec_id, username, first_name, last_name, email, role, active, nationality from user where id = ?';
    $params = array($user_id);
    if (!$include_inactive) {
        $sql .= ' and active = ?';
        $params[] = 'Y';
    }
    return $con->get_row($sql, $params);
}

function gate_find_user_by_doc_id($con, $doc_id, $existing_id)
{
    $sql = 'select id from user where doc_id = ?';  // TODO normalize doc id?
    $params = array(gate_normalize_doc_id($doc_id));
    if (!empty($existing_id)) {
        $sql .= ' and id != ?';
        $params[] = $existing_id;
    }

    $id = $con->get_one($sql, $params);
    if (empty($id)) return null;
    return gate_find_user($con, $id, true);
}

function gate_find_device($con, $device_id)
{
    $sql = 'select id, name, placeId from device where id = ?';
    return $con->get_row($sql, $device_id);
}

function gate_find_place($con, $place_id)
{
    $sql = 'select id, name, description from place where id = ?';
    return $con->get_row($sql, $place_id);
}


function gate_match_face($con, $face_image, $tolerance, $pin, $user_doc_id = '')
{
    $input_vector = gate_get_face_signature_from_image($face_image);

    if (empty($user_doc_id)) {
        $params = array();
        $sql = 'select id, vector from user';

        if (!empty($pin)) {
            $sql .= ' where pin = ?';
            $params[] = $pin;
        }

        $users = $con->get_array($sql, $params);

        $closest_user_id = null;
        $closest_distance = 1.0;
        foreach ($users as $user) {
            $user_vector = $user['vector'];
            if (empty($user_vector)) continue;

            $match_vector = json_decode($user_vector);

            $distance = gate_match_vector($input_vector, $match_vector);
            if ($distance < $closest_distance && $distance <= $tolerance) {
                $closest_distance = $distance;
                $closest_user_id = $user['id'];
            }
        }
        return $closest_user_id;
    } else {
        $sql = 'select id, vector from user where doc_id = ?';
        $user = $con->get_row($sql, strtolower($user_doc_id));

        $user_vector = $user['vector'];
        if (empty($user_vector)) return null;

        $match_vector = json_decode($user_vector);

        $distance = gate_match_vector($input_vector, $match_vector);
        return $distance <= $tolerance ? $user['id'] : null;
    }
}

function gate_save_event($con, $userId, $deviceId, $entry, $lat = 0, $lng = 0, $plate = '',$isCarpooling=false, $isDriver=false)
{
    gate_validate_areas($con, $userId, $lat, $lng);
    $carpoolingId = null;
    $isCarpooling= ($isCarpooling==1)?1:0;
    $isDriver = ($isDriver==1)?1:0;
    if ($deviceId !=null){
        gate_validate_device_location($con, $deviceId, $lat, $lng);
        //Validate if the user_type is in the device.
        if (gate_validate_user_type($con, $userId, $deviceId) == false){
            //validate if user has access to the device
            if (gate_validate_user_device($con, $userId, $deviceId) == false){
                api_abort('INVALID_DEVICE', 'User does not have access to the device');
            }
        }

        if ($isCarpooling == 1 ){
            if ($plate == ''){
                api_abort('INVALID_PLATE', 'Plate is required for carpooling');
            }
            if ($isDriver == 0){
                $sql = 'select id from event where 
                                 entry = ? 
                             and deviceId = ? 
                            and plate=?
                       and is_carpool = true
                       and carpool_id is null
                       and created > UNIX_TIMESTAMP(now()) - 3600 order by created desc limit 1';
                $params = array($entry, $deviceId, $plate);
                $carpoolingId = $con->get_one($sql, $params);
                if ($carpoolingId == null){
                    api_abort('INVALID_PLATE', 'Plate is not valid for carpooling');
                }
            }
        }
    }

    gate_validate_dependency($con, $userId, $deviceId);
    if (isset($plate) || $plate == '') {
        $warning = '';
    } else {
        $warning = gate_validate_plate($con, $userId, $plate);
    }

    $time = time();
    $text_to_hash = "$userId$entry$location$time";
    $hash = hash('sha256', $text_to_hash);
    //alter table event add is_carpool TINYINT(1) default 0;
    //alter table event add carpool_id int;
    $sql = 'insert into event (userId, entry, deviceId, lat, lng, plate, warning, hash, created,is_carpool,carpool_id) values (?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)';
    $con->execute($sql, array($userId, $entry, $deviceId, $lat, $lng, $plate, $warning, $hash, $time,$isCarpooling,$carpoolingId));

    if ( $deviceId!=null && strtolower($entry)!="none" && ($isCarpooling==false||$isDriver) ){
        $sql = 'update device set last_access = now() where id = ?';
        $con->execute($sql, array($deviceId));
    }

    $event = array(
        'id' => $con->get_last_id(),
        'timestamp' => $time
    );
    if (!empty($warning)) $event['warning'] = $warning;
    $sql = 'select doc_id from user where id = ?';
    $doc_id = $con->get_one($sql, array($userId));
    cas_save_event($doc_id, $entry, $time);
    xps_save_event($con, $event, $userId, $deviceId);
    return $event;
}

function gate_clean_match_history($con) {
    global $dir_face_history;
    global $match_history_size;

    $sql = 'select distinct device_id id from match_history order by id';
    $devices = $con->get_array($sql);
    foreach($devices as $device) {
        $device_id = $device['id'];

        $sql = 'select id, shot_filename from match_history where deleted = 0 and device_id = ? order by created desc';
        $shots = $con->get_array($sql, $device_id);
        if (empty($shots)) continue;

        for($i = $match_history_size; $i<count($shots); $i++) {
            $shot = $shots[$i];
            $shot_id = $shot['id'];
            $shot_filename = $shot['shot_filename'];

            $filename = "$dir_face_history/$shot_filename";
            unlink($filename);
            echo "from device $device_id delete $filename\n";

            $sql = 'update match_history set deleted = 1 where id = ?';
            $con->execute($sql, $shot_id);
        }
    }
}

function gate_save_match_history($con, $deviceId, $userId, $face_image) {
    global $dir_face_history;
    global $match_history_enabled;

    if (!$match_history_enabled) return;

    if (!is_dir($dir_face_history)) mkdir($dir_face_history, 0755, true);

    $uuid = guidv4();
    $filename = "$uuid.jpg";
    $filepath = "$dir_face_history/$filename";
    file_put_contents($filepath, $face_image);

    $sql = 'insert into match_history (device_id, user_id, shot_filename) values (?, ?, ?)';
    $con->execute($sql, array($deviceId, $userId, $filename));
}

function gate_validate_user_device($con, $userId, $deviceId)
{
    $sql = 'select * from user_device where device_id = ? and user_id = ?';
    $device_user = $con->get_row($sql, array($deviceId, $userId));
    if (empty($device_user)){
        return false;
    }else{
        return true;
    }
}

function gate_validate_user_type($con, $userId, $deviceId)
{
    $sql = 'select user_type from user where id = ?';
    $user_user_type = $con->get_one($sql, array($userId));
    $sql = "select * from device_user_types where device_id = ? and user_type = ?";
    $device_types = $con->get_array($sql, array($deviceId, $user_user_type));
    if (empty($device_types)){
        return false;
    }else{
        return true;
    }
}

function gate_hash_password($password)
{
    global $gate_password_salt;
    $text_to_hash = "$gate_password_salt.$password";
    return hash('sha256', $text_to_hash);
}

function gate_save_audit_log($con, $user_id, $type, $message)
{
    $ip = get_ip();
    $ip_public = get_ip_public();

    $params = array($user_id, $type, $ip, $ip_public, $message);
    $sql = 'insert into audit_log (userId, type, ip, ip_public, message) values (?, ?, ?, ?, ?)';
    $con->execute($sql, $params);
}

function gate_save_face($face_type, $userId, $face_image)
{
    error_log("saving face image for user id $userId");
    $file_name = gate_get_face_path($face_type, $userId);

    error_log("saving face image for user id $userId at $file_name");

    $dir_name = dirname($file_name);
    error_log("making sure $dir_name exists");
    @mkdir($dir_name, 0755, true);
    if (!file_exists($dir_name)) {
        error_log("$dir_name couldn't be created");
    }

    try {
        file_put_contents($file_name, $face_image);
        error_log("saved face image for user id $userId at $file_name");
    } catch (Exception $e) {
        error_log("error saving image for user id $userId at $file_name: " . ($e->getMessage()));
    }
}

function gate_get_face_path($face_type, $id)
{
    global $dir_face_save;
    global $dir_face_save_visitor;

    $dir = $face_type == FACE_TYPE_USER ? $dir_face_save : $dir_face_save_visitor;
    $sub_dir = (int)($id % 100);
    return "$dir/$sub_dir/$id.jpg";
}

function gate_save_signature($userId, $signature_image)
{
    error_log("saving signature image for user id $userId");
    $file_name = gate_get_signature_path($userId);

    error_log("saving signature image for user id $userId at $file_name");

    $dir_name = dirname($file_name);
    error_log("making sure $dir_name exists");
    @mkdir($dir_name, 0755, true);
    if (!file_exists($dir_name)) {
        error_log("$dir_name couldn't be created");
    }

    try {
        file_put_contents($file_name, $signature_image);
        error_log("saved signature image for user id $userId at $file_name");
    } catch (Exception $e) {
        error_log("error saving signature for user id $userId at $file_name: " . ($e->getMessage()));
    }
}

function gate_get_signature_path($userId)
{
    global $dir_face_save;
    
    $sub_dir = (int)($userId % 100);
    return "$dir_face_save/$sub_dir/signature_$userId.jpg";
}

function gate_get_encoded_picture($user_id)
{
    $image_file = gate_get_face_path(FACE_TYPE_USER, $user_id);
    if (!file_exists($image_file)) return null;

    $image = file_get_contents($image_file);
    return base64_encode($image);
}

function gate_send_email($recipient, $doc_id, $name, $epoch, $type)
{
    global $url_face_match;
    global $email_login;
    global $email_password;
    global $email_doc_id_name;
    global $email_event_subject;
    global $email_event_content;

    $date_format = 'Y-m-d H:i:s';
    $timestamp = date("Y-m-d H:i:s", $epoch);

    $type_text = $type == 'enter' ? 'Entrada' : 'Salida';

    $content = str_replace('{name}', $name, $email_event_content);
    $content = str_replace('{doc_id_name}', $email_doc_id_name, $content);
    $content = str_replace('{doc_id}', $doc_id, $content);
    $content = str_replace('{timestamp}', $timestamp, $content);
    $content = str_replace('{type}', $type_text, $content);

    $url = "$url_face_match/mail";
    $request = array(
        'login' => $email_login,
        'password' => $email_password,
        'recipient' => $recipient,
        'subject' => $email_event_subject,
        'content' => $content
    );
    try {
        $response = http_post_json($url, $request);
    } catch (Exception $e) {
        $msg = 'Cannot send email: ' . $e->getMessage();
        api_abort('INTERNAL_ERROR', $msg);
    }
}


function gate_email_qr_raw($email, $subject,$title, $body, $footer,$attachment) {
    global $url_face_match;
    global $email_login;
    global $email_password;

    $url = "$url_face_match/QRMail";
    $request = array(
        'login' => $email_login,
        'password' => $email_password,
        'recipient' => $email,
        'subject' => $subject,
        'title' => $title,
        'body' => $body,
        'footer' => $footer,
        'attachment' => $attachment
    );
    try {
        $response = http_post_json($url, $request);
    } catch (Exception $e) {
        $msg = 'Cannot send email: '.$e->getMessage();
        error_log($msg);
        api_abort('INTERNAL_ERROR', $msg);
    }
}

function gate_build_name($first_name, $last_name)
{
    return trim("$first_name $last_name");
}

function gate_validate_areas($con, $userId, $lat, $lng)
{
    global $gate_has_areas;
    if (!$gate_has_areas) return;

    $areaIds = array();

    // find restricted area for one user
    $sql = 'select areaId from area_user where userId = ?';
    $areaId = $con->get_one($sql, $userId);
    if (!empty($areaId)) $areaIds[] = $areaId;

    // find restricted areas for user in group
    $sql = 'select ag.areaId from area_group ag, user_group_user ugu ' .
        'where ugu.userId = ? and ag.userGroupId = ugu.userGroupId';
    $list = $con->get_array($sql, $userId);
    if (!empty($list)) {
        foreach ($list as $item) $areaIds[] = $item['areaId'];
    }

    error_log("Areas found for user $userId: " . json_encode($areaIds));

    // no restricted areas found
    if (empty($areaIds)) return;

    // validate restricted areas
    foreach ($areaIds as $areaId) {
        $sql = 'select lat, lng, radio from area where id = ?';
        $area = $con->get_row($sql, $areaId);
        if (empty($area)) continue;

        if (gate_validate_area($area, $lat, $lng)) return;
    }

    api_abort('NO_MATCHING_AREAS', array('lat' => $lat, 'lng' => $lng));
}
function gate_validate_device_location($con, $device_id, $lat, $lng)
{
    $sql = 'select lat, lng, radio from device where id = ? and lat is not null and lng is not null and radio is not null';
    $device = $con->get_row($sql, $device_id);
    if (empty($device)) return;

    if (gate_validate_area($device, $lat, $lng)) return;
    api_abort('NO_MATCHING_AREAS', array('lat' => $lat, 'lng' => $lng));
}
function gate_validate_dependency($con, $user_id, $device_id)
{
    global $gate_has_dependencies;
    if (!$gate_has_dependencies||$device_id==null) return;

    $sql = 'select dependencyId, maxMinutes from device where id = ?';
    $dependency_info = $con->get_row($sql, $device_id);
    if (empty($dependency_info)) return;  // should never happen, just in case

    $dependency_id = (int)$dependency_info['dependencyId'];
    $max_minutes = (int)$dependency_info['maxMinutes'];

    if ($dependency_id == 0 || $max_minutes == 0) return;

    $sql = "select 1 from event
        where userId = ? and deviceId = ?
        and created >= UNIX_TIMESTAMP(date_add(now(), interval -$max_minutes minute))";
    if ($con->exists($sql, array($user_id, $dependency_id))) return;

    $sql = 'select name from device where id = ?';
    $device_name = $con->get_one($sql, $dependency_id);
    if (empty($device_name)) $device_name = 'desconocida';
    api_abort('DEPENDENCY_FAILED', array('device_name' => $device_name, 'max_minutes' => $max_minutes));
}

function gate_validate_plate($con, $userId, $plate)
{
    global $gate_validate_plates;
    global $gate_validate_plates_abort_on_fail;

    $no_warning = '';

    if (!$gate_validate_plates) return $no_warning;

    $sql = 'select isDenied from vehicle where plate = ?';
    $isDenied = (int)$con->get_one($sql, $plate) != 0;
    if ($isDenied) {
        $reason = 'VEHICLE_DENIED';
        if ($gate_validate_plates_abort_on_fail) api_abort($reason, $plate);
        else return $reason;
    }

    // validate plate for driver
    $sql = 'select 1 from driver where userId = ? and plate = ?';
    if ($con->exists($sql, array($userId, $plate))) return $no_warning;

    // validate plate for company
    $sql = 'select 1 from worker w, vehicle_in_company vc '
        . 'where w.userId = ? and w.companyId = vc.companyId and vc.plate = ?';
    if ($con->exists($sql, array($userId, $plate))) return $no_warning;

    $reason = 'INVALID_VEHICLE';
    if ($gate_validate_plates_abort_on_fail) api_abort($reason, $plate);
    return $reason;
}

function gate_validate_area($area, $lat, $lng)
{
    $lat_from = (float)$area['lat'];
    $lng_from = (float)$area['lng'];
    $radio = (int)$area['radio'];
    $meters = gate_circle_distance_meters($lat_from, $lng_from, $lat, $lng);
    error_log("distance in meters: $meters radio:$radio");
    return $meters <= $radio;
}

// from: https://stackoverflow.com/questions/10053358/measuring-the-distance-between-two-coordinates-in-php
// source: https://en.wikipedia.org/wiki/Haversine_formula
function gate_circle_distance_meters($latitudeFrom, $longitudeFrom, $latitudeTo, $longitudeTo)
{
    $earthRadius = 6371000; // distance in meters

    // convert from degrees to radians
    $latFrom = deg2rad($latitudeFrom);
    $lonFrom = deg2rad($longitudeFrom);
    $latTo = deg2rad($latitudeTo);
    $lonTo = deg2rad($longitudeTo);

    $latDelta = $latTo - $latFrom;
    $lonDelta = $lonTo - $lonFrom;

    $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
            cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
    return $angle * $earthRadius;
}

function gate_create_user_id_dv($n)
{
    $i = 2;
    $sum = 0;
    foreach (array_reverse(str_split($n)) as $v) {
        if ($i == 8) $i = 2;
        $sum += $v * $i++;
    }
    $dv = 11 - ($sum % 11);
    if ($dv == 11) return 0;
    if ($dv == 10) return 'k';
    return $dv;
}

function gate_create_user_id($seq)
{
    global $user_id_base_seq;
    global $user_id_base_offset;

    $n = $seq + $user_id_base_seq;
    $n += $user_id_base_offset;
    $dv = gate_create_user_id_dv($n);
    return "$n$dv";
}

function gate_validate_user_id($id)
{
    $parts = gate_get_doc_id_parts($id);
    $n = $parts[0];
    $dv = $parts[1];
    return $dv == gate_create_user_id_dv($n);
}

function gate_get_doc_id_parts($id)
{
    $id = str_replace('.', '', $id);
    $id = str_replace('-', '', $id);
    $dv = substr($id, -1);
    $n = (int)substr($id, 0, strlen($id) - 1);
    return [$n, $dv];
}

function gate_normalize_doc_id($docId)
{
    $parts = gate_get_doc_id_parts($docId);
    $n = $parts[0];
    $dv = $parts[1];

    return "$n-$dv";
}

function gate_register_visitor($con, $doc_id, $first_name, $last_name, $picture)
{
    global $auth_user_id;

    $doc_id = gate_normalize_doc_id($doc_id);

    $sql = 'select id from visitor where doc_id = ?';
    $visitorId = $con->get_one($sql, $doc_id);
    if (empty($visitorId)) { // try to create visitor from user info if found
        if (empty($first_name) && empty($last_name)) { // empty data, try to get it from the users table
            $sql = 'select first_name, last_name from user where doc_id = ?';
            $userInfo = $con->get_row($sql, $doc_id);
            if (!empty($userInfo)) {
                $first_name = $userInfo['first_name'];
                $last_name = $userInfo['last_name'];
            }
        }

        // avoid null values
        if (empty($first_name)) $first_name = '';
        if (empty($last_name)) $last_name = '';

        $sql = 'insert into visitor (first_name, last_name, doc_id, enter_type, created_by) values (?, ?, ?, ?, ?)';
        $params = array($first_name, $last_name, $doc_id, 'AUTO', $auth_user_id);
        $con->execute($sql, $params);
        $visitorId = $con->get_last_id();

        $params[] = $visitorId;
        $audit_type = AUDIT_VISITOR_CREATE;
        gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));
    } else {
        // visitor is found, update it with the current info if exists
        if (!empty($first_name) && !empty($last_name)) {
            $sql = 'update visitor set first_name = ?, last_name = ? where id = ?';
            $params = array($first_name, $last_name, $visitorId);
            $con->execute($sql, $params);
            $audit_type = AUDIT_VISITOR_MODIFY;
            gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));
        }
    }

    if (!empty($picture)) {
        gate_save_face(FACE_TYPE_VISITOR, $visitorId);
    }

    return $visitorId;
}

function gate_save_on_logbook($con, $visitorId, $gate_id)
{
    global $auth_user_id;

    $sql = 'insert into logbook (visitorId, gateId, status) values (?, ?, ?)';
    $params = array($visitorId, $gate_id, 'READ');
    $con->execute($sql, $params);
    $logId = $con->get_last_id();

    $params[] = $logId;
    $audit_type = AUDIT_LOGBOOK_CREATE;
    gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));

    return $logId;
}

function gate_allow($con, $doc_id, $first_name, $last_name, $plate, $company, $access_day, $profile, $groupId=null,$userInGroup=null)
{
    global $auth_user_id;
    $doc_id = gate_normalize_doc_id($doc_id);
    if (empty($first_name)) $first_name = '';
    if (empty($last_name)) $last_name = '';
    $sql = 'select id from user where doc_id = ?';
    $userId = $con->get_one($sql, $doc_id);

    if (empty($userId)) { // create user
        $uuid = guidv4();
        $role = PROFILE_USER;
        $created_by = $auth_user_id;
        $sql = 'insert into user (doc_id, first_name, last_name, role, active, pub_id, created_by, updated) ' .
            'values (?, ?, ?, ?, ?, ?, ?, now())';
        $params = array($doc_id, $first_name, $last_name, $role, 'Y', $uuid, $created_by);
        $con->execute($sql, $params);
        $userId = $con->get_last_id();
        $params[] = $userId;
        $params[] = 'gate_allow';
        $audit_type = AUDIT_USER_CREATE;
        gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));
    }
    $sql = 'select id from allow_list where user_id = ? and plate = ? and access_day = ?';
    $allowId = $con->get_one($sql, array($userId, $plate, $access_day));
    if (empty($allowId)) {
        $sql = 'insert into allow_list (user_id, plate, profile, company,group_id,user_in_group ,access_day) values (?, ?, ?,?,?,?, ?)';
        $params = array($userId, $plate, $profile, $company, $groupId,$userInGroup,$access_day);
        $con->execute($sql, $params);
        $allowId = $con->get_last_id();
        $params[] = $allowId;
        $audit_type = AUDIT_ALLOW_CREATE;
        gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));
    }
    return array('userId' => $userId, 'allowId' => $allowId);
}

function gate_allow_update($con, $allowId, $doc_id, $first_name, $last_name, $plate, $company, $access_day, $profile)
{
    global $auth_user_id;
    $doc_id = gate_normalize_doc_id($doc_id);
    if (empty($first_name)) $first_name = '';
    if (empty($last_name)) $last_name = '';

    $sql = 'select id from allow_list where id = ?';
    $allowId = $con->get_one($sql, array($allowId));
    if (empty($allowId)) {
        return false;
    }

    $sql = 'select id from user where doc_id = ?';
    $userId = $con->get_one($sql, $doc_id);
    if (empty($userId)) { // create user
        $uuid = guidv4();
        $role = PROFILE_USER;
        $created_by = $auth_user_id;
        $sql = 'insert into user (doc_id, first_name, last_name, role, active, pub_id, created_by, updated) ' .
            'values (?, ?, ?, ?, ?, ?, ?, now())';
        $params = array($doc_id, $first_name, $last_name, $role, 'Y', $uuid, $created_by);
        $con->execute($sql, $params);
        $userId = $con->get_last_id();
        $params[] = $userId;
        $params[] = 'gate_allow';
        $audit_type = AUDIT_USER_CREATE;
        gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));
    }
    $sql = 'update allow_list set user_id = ?, plate = ?, profile = ?, company = ?, access_day = ?, updated=now() where id = ?';
    $params = array($userId, $plate, $profile, $company, $access_day, $allowId);
    $con->execute($sql, $params);
    $allowId = $con->get_last_id();
    $params[] = $allowId;
    $audit_type = AUDIT_ALLOW_UPDATE;
    gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));

    return array('userId' => $userId, 'allowId' => $allowId);
}


function gate_find_allow_list($con, $user_id)
{
    $sql = 'select a.id, u.doc_id, a.profile, u.first_name, u.last_name, a.plate, a.access_day, u.id user_id from allow_list a, user u where
                                        u.id = ? and a.user_id = u.id and DATE(a.access_day) = DATE(curdate())  order by a.created';
    $params = array($user_id);
    return $con->get_row($sql, $params);
}


function save_worker_invitation($con, $worker_id, $company, $description, $init, $end, $event_duration, $invited_users, $device_id) {
    global $auth_user_id;
    try {
        $con->begin();
// Al procesar los datos

        // Insertar la invitación
        $sql = "INSERT INTO worker_invitation (worker_id, company, description, init, end, event_duration,device_id,status) 
                VALUES (?, ?, ?, ?, ?, ?,?,'PENDING')";
        $params = array($worker_id, $company, $description, $init, $end, $event_duration,$device_id);
        $con->execute($sql, $params);
        $invitation_id = $con->get_last_id();
        if (!$invitation_id) {
            error_log("Error al crear la invitación 1");
            api_abort('INTERNAL_ERROR', 'Error al crear la invitación');
        }

        // Procesar los invitados
        if (is_array($invited_users) && !empty($invited_users)) {
            foreach ($invited_users as $invited) {
                //TODO: find user or create.
                $sql = 'select id from user where email = ?';
                $userId = $con->get_one($sql, $invited['email']);
                if (empty($userId)) {
                    $uuid = guidv4();
                    $role = PROFILE_USER;
                    $created_by = $auth_user_id;
                    $sql = 'insert into user (email, first_name, last_name, role, active, pub_id, user_type, created_by, updated) ' .
                        'values (?, ?, ?, ?, ?, ?, ?,?, now())';
                    $params = array($invited['email'], $invited['name'], '', $role, 'Y',$uuid,'visitante',$created_by);
                    $con->execute($sql, $params);

                    $userId = $con->get_last_id();
                    $params[] = $userId;
                    $params[] = 'PROFILE_USER';
                    $params[] = "CREATE FROM INVITATION";
                    $audit_type = AUDIT_USER_CREATE;
                    gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));
                }
                $user_id = $userId;
                $name = $invited['name'];
                $email = $invited['email'];

                $qr_code = base64_encode($invitation_id . '_' . $user_id . '_' . time());
                $sql = "INSERT INTO worker_invited (worker_invitation_id, user_id, name, email, qr_code, status) 
                        VALUES (?, ?, ?, ?, ?, 'PENDING')";
                $params = array($invitation_id, $user_id, $name, $email, $qr_code);
                $con->execute($sql, $params);
                 $worker_invitedId = $con->get_last_id();
                error_log("last_update $worker_invitedId");


                if (!$worker_invitedId)
                {
                    error_log("Error al crear la invitación 2");
                    api_abort('INTERNAL_ERROR', 'Error al crear la invitación');
                }
                $Fecha_ingreso = date('Y-m-d H:i:s', strtotime($init));
                sendEmailWithQRCode($email,$qr_code,$name,$Fecha_ingreso);
            }
        }

        $con->commit();
        $result= array(
            'success' => true,
            'invitation_id' => $invitation_id,
            'message' => 'Invitación creada exitosamente'
        );
        return json_encode($result);
    } catch (Exception $e) {
        $con->rollback();
        error_log("Error al crear la invitación 3");
        error_log($e->getMessage());
        api_abort('INTERNAL_ERROR', 'Error al crear la invitación');
    }
}


function edit_worker_invitation($con, $invitation_id, $company, $description, $init, $end, $event_duration, $invited_users,$device_id) {
    try {
        $con->begin();
        // Verificar que la invitación existe y obtener worker_id
        $check_sql = "SELECT worker_id FROM worker_invitation WHERE id = ?";
        $existing = $con->get_one($check_sql, array($invitation_id));

        if (!$existing) {
            throw new Exception("Invitación no encontrada");
        }

        // Actualizar la invitación principal
        $update_sql = "UPDATE worker_invitation 
                      SET company = ?,
                          description = ?,
                          init = ?,
                          end = ?,
                          event_duration = ?,
                          device_id = ?,
                          updated = CURRENT_TIMESTAMP
                      WHERE id = ?";

        $update_params = array(
            $company,
            $description,
            $init,
            $end,
            $event_duration,
            $device_id,
            $invitation_id
        );
        $con->execute($update_sql, $update_params);

        // Manejar los invitados
        if (is_array($invited_users)) {
            // Obtener los IDs actuales de invitados
            $current_invited_sql = "SELECT id, email, qr_code FROM worker_invited WHERE worker_invitation_id = ?";
            $current_invited = $con->get_array($current_invited_sql, array($invitation_id));
            $current_emails = array_column($current_invited, 'email');


            // Procesar nuevos invitados y actualizaciones
            foreach ($invited_users as $invited) {
                $email = $invited['email'];
                $name = $invited['name'];
                $user_id = isset($invited['user_id']) ? $invited['user_id'] : null;

                // Verificar si el invitado ya existe
                $existing_key = array_search($email, $current_emails);

                if ($existing_key === false) {
                    // 3.1 Buscar o crear usuario
                    $sql = 'SELECT id FROM user WHERE email = ?';
                    $userId = $con->get_one($sql, array($email));

                    if (empty($userId)) {
                        // Crear nuevo usuario
                        $uuid = guidv4();
                        $sql = 'INSERT INTO user (
                            email, 
                            first_name, 
                            last_name, 
                            role, 
                            active, 
                            pub_id, 
                            user_type, 
                            created_by, 
                            updated
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())';

                        $userParams = array(
                            $email,
                            $name,
                            '',
                            PROFILE_USER,
                            'Y',
                            $uuid,
                            'visitante',
                            $auth_user_id
                        );

                        $con->execute($sql, $userParams);
                        $userId = $con->get_last_id();

                        // Registrar auditoría
                        $auditParams = array_merge($userParams, array(
                            $userId,
                            'PROFILE_USER',
                            'CREATE FROM INVITATION EDIT'
                        ));
                        gate_save_audit_log($con, $auth_user_id, AUDIT_USER_CREATE, json_encode($auditParams));

                    }

                    // 3.2 Crear nuevo registro en worker_invited
                    $qr_code = base64_encode($invitation_id . '_' . $userId . '_' . time());
                    $insert_sql = "INSERT INTO worker_invited (
                        worker_invitation_id, 
                        user_id, 
                        name, 
                        email, 
                        qr_code, 
                        status
                    ) VALUES (?, ?, ?, ?, ?, 'PENDING')";

                    $invitedParams = array(
                        $invitation_id,
                        $userId,
                        $name,
                        $email,
                        $qr_code
                    );

                    $con->execute($insert_sql, $invitedParams);
                    if (!$con->get_last_id()) {
                        throw new Exception("Error al agregar nuevo invitado: " . $name);
                    }
                    //Send Email
                    $Fecha_ingreso = date('Y-m-d H:i:s', strtotime($init));
                    sendEmailWithQRCode($email,$qr_code,$name,$Fecha_ingreso);

                } else {

                    //GET CODE_QR:
                    $qr_code = $current_invited[$existing_key]['qr_code'];

                    // Actualizar invitado existente
                    $update_invited_sql = "UPDATE worker_invited 
                                         SET name = ?,
                                             user_id = ?,
                                             updated = CURRENT_TIMESTAMP
                                         WHERE worker_invitation_id = ? AND email = ?";
                    !$con->execute($update_invited_sql, array(
                        $name,
                        $user_id,
                        $invitation_id,
                        $email
                    ));
                    //Send Email
                    $Fecha_ingreso = date('Y-m-d H:i:s', strtotime($init));
                    updateAccessAndNotify($invitation_id,$email,$name,$Fecha_ingreso,$qr_code);
                }
            }

            // Eliminar invitados que ya no están en la lista
            $new_emails = array_column($invited_users, 'email');
            $emails_to_delete = array_diff($current_emails, $new_emails);

            if (!empty($emails_to_delete)) {
                $delete_sql = "DELETE FROM worker_invited 
                              WHERE worker_invitation_id = ? AND email IN (" .
                    str_repeat('?,', count($emails_to_delete) - 1) . "?)";

                $delete_params = array_merge(array($invitation_id), $emails_to_delete);
                $con->execute($delete_sql, $delete_params);

            }
        }

        $con->commit();

        $result= array(
            'success' => true,
            'invitation_id' => $invitation_id,
            'message' => 'Invitación actualizada exitosamente'
        );
        return json_encode($result);

    } catch (Exception $e) {
        $con->rollback();
        $result= array(
            'success' => false,
            'message' => $e->getMessage()
        );
        return json_encode($result);

    }
}

function gate_send_temporary_password_email($recipient_email, $username, $temporary_password, $company_name) {
    global $smtp_host, $smtp_port, $smtp_username, $smtp_password, $smtp_from_email, $smtp_from_name;
    
    error_log("[EMAIL_DEBUG] Starting gate_send_temporary_password_email function with PHPMailer");
    error_log("[EMAIL_DEBUG] Recipient: $recipient_email");
    error_log("[EMAIL_DEBUG] Username: $username");
    error_log("[EMAIL_DEBUG] Company: $company_name");
    error_log("[EMAIL_DEBUG] SMTP Config - Host: $smtp_host, Port: $smtp_port, User: $smtp_username, From: $smtp_from_email");
    
    // Check email format
    if (!filter_var($recipient_email, FILTER_VALIDATE_EMAIL)) {
        error_log("[EMAIL_ERROR] Invalid email format: $recipient_email");
        return false;
    }
    
    // Check if PHPMailer is available
    if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        error_log("[EMAIL_ERROR] PHPMailer class not found. Please install PHPMailer via composer.");
        error_log("[EMAIL_ERROR] Run: cd /gate/common && composer install");
        return false;
    }
    
    $mail = new PHPMailer(true);
    
    try {
        // SMTP Configuration
        $mail->isSMTP();
        $mail->Host       = $smtp_host;
        $mail->SMTPAuth   = true;
        $mail->Username   = $smtp_username;
        $mail->Password   = $smtp_password;
        $mail->CharSet    = 'UTF-8';
        
        // Configure port and encryption based on port number
        if ($smtp_port == 465) {
            // SSL
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            $mail->Port = 465;
        } else if ($smtp_port == 587) {
            // STARTTLS
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = 587;
        } else {
            // Port 25 - try without encryption first
            $mail->SMTPSecure = false;
            $mail->Port = $smtp_port;
        }
        
        // Disable SSL certificate verification for troubleshooting
        $mail->SMTPOptions = array(
            'ssl' => array(
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            )
        );
        
        // Enable detailed debug output for troubleshooting
        $mail->SMTPDebug  = 2; // Temporarily enable detailed debug info
        $mail->Debugoutput = function($str, $level) {
            error_log("[PHPMAILER_DEBUG] $str");
        };
        
        error_log("[EMAIL_DEBUG] PHPMailer configured with SMTP settings");
        
        // Recipients
        $mail->setFrom($smtp_from_email, $smtp_from_name);
        $mail->addAddress($recipient_email);
        $mail->addReplyTo($smtp_from_email, $smtp_from_name);
        
        // Content
        $subject = "Credenciales de acceso temporal - Sistema Identifica";
        $message = "Estimado/a usuario/a,\n\n";
        $message .= "Se ha creado una cuenta para la empresa \"$company_name\" en el Sistema Identifica.\n\n";
        $message .= "Sus credenciales de acceso son:\n";
        $message .= "Usuario: $username\n";
        $message .= "Contraseña temporal: $temporary_password\n\n";
        $message .= "IMPORTANTE: Esta es una contraseña temporal que debe cambiar en su primer inicio de sesión.\n\n";
        $message .= "Para acceder al sistema, visite el portal de agendamiento.\n\n";
        $message .= "Saludos cordiales,\n";
        $message .= "El equipo de Identifica";
        
        $mail->isHTML(false);
        $mail->Subject = $subject;
        $mail->Body    = $message;
        
        error_log("[EMAIL_DEBUG] Subject: $subject");
        error_log("[EMAIL_DEBUG] Message length: " . strlen($message));
        error_log("[EMAIL_DEBUG] Attempting to send email via SMTP...");
        
        $mail->send();
        
        error_log("[EMAIL_SUCCESS] Temporary password email sent successfully to: $recipient_email via SMTP");
        return true;
        
    } catch (Exception $e) {
        error_log("[EMAIL_EXCEPTION] PHPMailer Exception: " . $e->getMessage());
        error_log("[EMAIL_DEBUG] Full PHPMailer error info:");
        error_log("[EMAIL_DEBUG] - SMTP Error: " . $mail->ErrorInfo);
        error_log("[EMAIL_DEBUG] - Exception Code: " . $e->getCode());
        error_log("[EMAIL_DEBUG] - Exception File: " . $e->getFile() . ":" . $e->getLine());
        
        // Log SMTP connection details for debugging
        error_log("[EMAIL_DEBUG] SMTP Connection Details:");
        error_log("[EMAIL_DEBUG] - Host: $smtp_host");
        error_log("[EMAIL_DEBUG] - Port: $smtp_port");
        error_log("[EMAIL_DEBUG] - Username: $smtp_username");
        error_log("[EMAIL_DEBUG] - From Email: $smtp_from_email");
        error_log("[EMAIL_DEBUG] - Security: STARTTLS");
        
        return false;
    } catch (Error $e) {
        error_log("[EMAIL_ERROR] PHP Error in PHPMailer: " . $e->getMessage());
        error_log("[EMAIL_ERROR] Stack trace: " . $e->getTraceAsString());
        return false;
    }
}

function generate_temporary_password($length = 12) {
    $characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    $password = '';
    $charactersLength = strlen($characters);
    
    for ($i = 0; $i < $length; $i++) {
        $password .= $characters[rand(0, $charactersLength - 1)];
    }
    
    return $password;
}


?>

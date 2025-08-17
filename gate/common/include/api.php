<?php 

$api_abort_hook = null;

function api_get($data, $field) {
	if (isset($data[$field])) return $data[$field];
	return null;
}

function api_get_number($data, $field, $path = null, $allow_zero = false, $allow_negative = false) {
	if ($path == null) $path = $field;
	
	$value = isset($data[$field]) ? $data[$field] : 0;

	if (!is_numeric($value)) {
	    api_abort('NOT_NUMERIC', $path);
	}

	$value = (float)$value;
	
	if (!$allow_zero && $value == 0) {
		api_abort('VALUE_NOT_ZERO', $path);
	} else if (!$allow_negative && $value < 0) {
		api_abort('VALUE_NOT_NEGATIVE', $path);
	}
	return $value;
}

function api_get_mandatory($data, $field, $path = null) {
	if ($path == null) $path = $field;

	if (empty($data[$field])) {
		api_abort('MANDATORY', $path);
	}
	return $data[$field];
}

function api_get_mandatory_number($data, $field, $path = null, $allow_zero = false, $allow_negative = false) {
	if ($path == null) $path = $field;

	if (!isset($data[$field])) {
		api_abort('MANDATORY', $path);
    }

	$value = $data[$field];

    if (!is_numeric($value)) {
        api_abort('NOT_NUMERIC', $path);
    }

    $value = (float)$value;

	if (!$allow_zero && $value == 0) {
		api_abort('MANDATORY_NOT_ZERO', $path);
	} else if (!$allow_negative && $value < 0) {
		api_abort('MANDATORY_NOT_NEGATIVE', $path);
	}
	return $value;
}

function api_get_boolean($data, $field) {
    if (!isset($data[$field])) return false;
    return $data[$field] == 'true';
}

function api_get_mandatory_array($data, $field, $path = null) {
	if ($path == null) $path = $field;
	
	if (!isset($data[$field])) {
		api_abort('MANDATORY', $path);
	} else if (!is_array($data[$field])) {
		api_abort('MANDATORY_ARRAY', $path);
	}
	return $data[$field];
}

function api_get_array($data, $field, $path = null) {
	if ($path == null) $path = $field;
	
	if (isset($data[$field])) {
		$value = $data[$field];
		if (!is_array($value)) {
			api_abort('VALUE_NOT_ARRAY', $path);
		}
		return $value;
	}
	return null;
}

function api_check_allowed($value, $values, $path) {
	if (!in_array($value, $values, true)) {
		api_abort('NOT_ALLOWED', array($path, $value, $values));
	}
}

function api_abort($code, $data = null) {
    global $api_abort_hook;
	if ($code == 'MANDATORY') {
		http_response_code(HTTP_BAD_REQUEST);
		$msg = "Field $data is mandatory";
	} else if ($code == 'NOT_NUMERIC') {
		http_response_code(HTTP_BAD_REQUEST);
		$msg = "Field $data must be a number";
	} else if ($code == 'MANDATORY_NOT_ZERO' || $code == 'VALUE_NOT_ZERO') {
		http_response_code(HTTP_BAD_REQUEST);
		$msg = "Field $data cannot be zero";
	} else if ($code == 'MANDATORY_NOT_NEGATIVE' || $code == 'VALUE_NOT_NEGATIVE') {
		http_response_code(HTTP_BAD_REQUEST);
		$msg = "Field $data cannot be negative";
	} else if ($code == 'MANDATORY_NOT_BOOL') {
		http_response_code(HTTP_BAD_REQUEST);
		$msg = "Field $data must be boolean (true|false)";
	} else if ($code == 'MANDATORY_ARRAY' || $code == 'VALUE_NOT_ARRAY') {
		http_response_code(HTTP_BAD_REQUEST);
		$msg = "Field $data must be an object";
	} else if ($code == 'UNKNOWN_USER') {
		http_response_code(HTTP_FORBIDDEN);
		$msg = 'Invalid user or password';
	} else if ($code == 'INVALID_REQUEST') {
		http_response_code(HTTP_BAD_REQUEST);
		$msg = 'Invalid request';
	} else if ($code == 'NOT_ALLOWED') {
		http_response_code(HTTP_BAD_REQUEST);
		$path = $data[0];
		$value = $data[1];
		$values = implode(', ', $data[2]);
		$msg = "The field '$path' with value '$value' is not in the allowed set ($values)";
	} else if ($code == 'INVALID_KEY') {
		http_response_code(HTTP_FORBIDDEN);
		$msg = 'Invalid API Key';
	} else if (!empty($api_abort_hook)) {
	    $msg = $api_abort_hook($code, $data);
	} else {
		$msg = $code;
	}
	
	abortWithCode($msg, $code);
}

function api_create_token($userId) {
	global $api_token_size;
	return genToken($api_token_size);
}

function api_create_log($con, $userId, $type, $msg) {
	$ip = get_ip();
	$ip_public = get_ip_public();
	
	$sql = 'insert into event_log (ip, ip_public, userId, type, message) values (?, ?, ?, ?, ?)';
	$con->execute($sql, array($ip, $ip_public, $userId, $type, $msg));
}

function api_code_create_seq($seq) {
	global $api_custom_salt;
	
	$code = '';
	$chars = strlen($api_custom_salt);
	$shift = 0;
	for($i=0; $i<4; $i++) {
		$pos = $seq % $chars;
		$pos += $shift;
		if ($pos>=$chars) $pos -= $chars;
		
		$code .= substr($api_custom_salt, $pos, 1);
		$shift += 3*$i;
		$seq = (int)($seq / $chars);
	}
	return $code;
}

/*
 code is generated based on unique s(id) of type
 XXYYXYYX
 where X and Y in {2-9,a-z}
 f(id) = YYYY
 X is random
 Y is sequential
*/

function api_code_create($id) {
	global $api_custom_salt;
	$chars = strlen($api_custom_salt);
	$couponSeq = api_code_create_seq($id);
	
	$rand = '';
	for($i=0; $i<4; $i++) {
		$pos = rand(0, $chars-1);
		$rand .= substr($api_custom_salt, $pos, 1);
	}
	
	$code =
	substr($rand, 0, 2).
	substr($couponSeq, 0, 2).
	substr($rand, 2, 1).
	substr($couponSeq, 2, 2).
	substr($rand, 3, 1);
	
	return $code;
}

function api_validate_access_internal($con) {
	return api_validate_access($con, 'internal');
}

function api_validate_access($con, $type = 'api') {
	$headers = getHeaders();
	$token = getHeader($headers, 'token');
	if (empty($token)) {
		http_response_code(HTTP_BAD_REQUEST);
		api_abort('INVALID_REQUEST');
	}
	
	$sql = 'select s.userId from session s, user u where s.userId = u.id and s.token = ? and u.type = ?';
	$userId = $con->get_one($sql, array($token, $type));
	if (empty($userId)) {
		http_response_code(HTTP_FORBIDDEN);
		api_abort('INVALID_SESSION');
	}
	
	$sql = 'select userId from session where token = ? and now() < expire';
	$userId = $con->get_one($sql, array($token));
	if (empty($userId)) {
		http_response_code(HTTP_FORBIDDEN);
		api_abort('EXPIRED_SESSION');
	}
	
	return $userId;
}

function api_password_hash($pass) {
	global $api_password_salt;
	$text = $pass.$api_password_salt;
	return sha1($text);
}

function api_login($con, $user, $pass, $type, $expire = true) {
	global $api_expire_minutes;
	
	$hash = api_password_hash($pass);
	
	$sql = 'select id from user where name = ? and password = ? and type = ?';
	$userId = $con->get_one($sql, array($user, $hash, $type));
	
	if ($userId == null) {
		api_abort('UNKNOWN_USER');
	}
	
	$token = api_create_token($userId);
	
	if ($expire) {
		$expire_expr = 'date_add(now(), interval ? minute)';
	} else {
		$expire_expr = 'date_add(now(), interval ? year)';
	}
	$sql = "update session set token = ?, expire = $expire_expr, updated = now() where userId = ?";
	$con->execute($sql, array($token, $api_expire_minutes, $userId));
	
	if ($con->get_matched_rows() == 0) {
		$sql = "insert into session (userId, token, expire) values (?, ?, $expire_expr)";
		$con->execute($sql, array($userId, $token, $api_expire_minutes));
	}
	
	$expire_time = time() + 60*($api_expire_minutes - 1);
	return array('token' => $token, 'expire' => $expire_time);
}

function api_json_header() {
	header('Content-Type: application/json');
}

function api_validate_shared_key() {
    global $api_shared_key;

    $key = getHeader('api-key');
    if ($key == $api_shared_key) return;

    api_abort('INVALID_KEY');
}

function api_get_bearer_token() {
    $auth_header = api_get_authorization_header();
    if (empty($auth_header)) return null;

    preg_match('/Bearer\s(\S+)/', $auth_header, $matches);
    return $matches[1];
}

// https://gist.github.com/wildiney/b0be69ff9960642b4f7d3ec2ff3ffb0b
function api_get_authorization_header(){
    $header = null;
    if (isset($_SERVER['Authorization'])) {
        $header = trim($_SERVER["Authorization"]);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) { //Nginx or fast CGI
        $header = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        // Server-side fix for bug in old Android versions (a nice side-effect of this fix means we don't care about capitalization for Authorization)
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $header = trim($requestHeaders['Authorization']);
        }
    }
    return $header;
}

?>
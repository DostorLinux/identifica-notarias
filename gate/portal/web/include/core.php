<?php

define('HTTP_BAD_REQUEST', 400);
define('HTTP_FORBIDDEN', 401);
define('HTTP_NOT_FOUND', 404);
define('HTTP_CONFLICT', 409);
define('HTTP_INTERNAL_ERROR', 500);

function getParameter($key) {
	global $_GET;
	$param = isset($_GET[$key]) ? $_GET[$key] : null;
	return htmlSanitize($param);
}

function getPostParameter($key) {
	global $_POST;
	$param = isset($_POST[$key]) ? $_POST[$key] : null;
	return htmlSanitize($param);
}

function getValue($array, $key) {
	$param = isset($array[$key]) ? $array[$key] : null;
	return $param;
}

function getAnyParameter($key) {
	$p = getParameter($key);
	if ($p != null) return $p;
	return getPostParameter($key);
}

function htmlSanitize($param) {
	if ($param == null) return null;
	return trim(str_replace("<", "&lt;", $param));
}

function sqlSanitize($param) {
	if ($param == null) return null;
	$param = str_replace(";", "", $param);
	$param = str_replace("\'", "", $param);
	return $param;
}

function sanitize($param) {
    return sqlSanitize(htmlSanitize($param));
}

function genCode() {
	$code = '';
	for($i=0; $i<8; $i++) {
		$n = rand(1000, 9999);
		$code = $code.$n;
	}
	return $code;
}

function isEmptyString($s) {
	return $s==null || strlen(trim($s))==0;
}


function http_get($url, $data = null, $headers = null) {
	$params = array('http' => array(
			'method' => 'GET',
			'content' => $data));

	if ($headers != null) $params['http']['header'] = $headers;
	if ($data != null) $params['http']['content'] = $data;

	$ctx = stream_context_create($params);
	$fp = @fopen($url, 'rb', false, $ctx);

	$code = '';
	if (!empty($http_response_header))	{
		sscanf($http_response_header[0], 'HTTP/%*d.%*d %d', $code);
	}

	if ($code == '404') throw new Exception('404');
	if (!$fp) throw new Exception('error');

	$response = @stream_get_contents($fp);
	if ($response === false) throw new Exception("Problema leyendo datos from $url, $php_errormsg");

	return $response;
}

define('SALT_LENGTH', 32);

function generateHash($plainText, $salt = PASSWORD_SALT) {
	if ($salt === null) $salt = substr(md5(uniqid(rand(), true)), 0, SALT_LENGTH);
	else $salt = substr($salt, 0, SALT_LENGTH);
	$text = $plainText.$salt;

	return sha1($text);
}

function getToken() {
	$token = getParameter('token');
	if ($token == null) $token = getPostParameter('token');
	if ($token == null) $token = isset($_COOKIE['sessionId'])?$_COOKIE['sessionId']:null;
	return extractToken($token);
}

function genToken($size = 0) {
	global $token_size;
	if ($size == 0) $size = $token_size;
	$token = "";
	for($i=0; $i<$size; $i++) {
		$type = rand(0,10);
		if ($type<2) {
			$rnd = rand(48, 48+9);
		} else if ($type<6) {
			$rnd = rand(97, 97+25);
		} else {
			$rnd = rand(65, 65+25);
		}
		$token = $token.chr($rnd);
	}
	return $token;
}

function hasTokenParameter() {
	return getParameter('token')!=null;
}

function return_ok() {
	$response = array("result" => "ok");
	echo json_encode($response);
}

function return_error($error) {
	$response = array("error" => $error);
	echo json_encode($response);
}

function get_file_content($filename) {
	$file = fopen($filename, 'r');
	$content = fread($file, (2* 1024 * 1024));
	fclose($file);
	return $content;
}

function getHeaders() {
	foreach ($_SERVER as $name => $value)
	{
		if (substr($name, 0, 5) == 'HTTP_')
		{
			$name = str_replace(' ', '-', strtolower(str_replace('_', ' ', substr($name, 5))));
			$headers[$name] = $value;
		} else if ($name == "CONTENT_TYPE") {
			$headers["Content-Type"] = $value;
		} else if ($name == "CONTENT_LENGTH") {
			$headers["Content-Length"] = $value;
		}
	}
	return $headers;
}

function getHeader($key) {
    $headers = getHeaders();

	if (!isset($headers[$key])) return null;
	return $headers[$key];
}

function abort($msg) {
	$response = array('error' => $msg);
	error_log("abort ".json_encode($response));
	die(json_encode($response));
}

function abortWithCode($msg, $code) {
	$response = array('error' => $msg, 'code' => $code);
	error_log("abort ".json_encode($response));
	die(json_encode($response));
}

function abortMessage($msg) {
	$response = array('errorMessage' => $msg);
	die(json_encode($response));
}

function abortSuccess() {
	$response = array('success' => 'true');
	die(json_encode($response));
}


function startsWith($haystack, $needle) {
	// search backwards starting from haystack length characters from the end
	if (strlen($needle) > strlen($haystack)) return false;
	return $needle === "" || strrpos($haystack, $needle, -strlen($haystack)) !== FALSE;
}
function endsWith($haystack, $needle) {
	// search forward starting from end minus needle length characters
	if (strlen($needle) > strlen($haystack)) return false;
	return $needle === "" || strpos($haystack, $needle, strlen($haystack) - strlen($needle)) !== FALSE;
}

function isValidEmail($email) {
	return !filter_var($email, FILTER_VALIDATE_EMAIL) === false;
}
function getStandardMailHeaders() {
	global $email_sender;
	return getMailHeaders($email_sender);
}

function getMailHeaders($reply_address) {
	return "From: $reply_address\r\n" .
	"Reply-To: $reply_address\r\n".
	"Content-Type: text/plain; charset=UTF-8\r\n".
	"X-Mailer: PHP/" . phpversion();
}

function redirect($url) {
	header("Location: $url");
	die();
}

function sendTraceMessage($userName, $trace) {
	global $email_sender, $msg_email_trace_subject, $msg_email_trace_body;

	$trace = str_replace("\r", "", $trace);
	$trace = str_replace("\n", "\r\n", $trace);

	$msg = str_replace('{userName}', $userName, $msg_email_trace_body);
	$msg = str_replace('{trace}', $trace, $msg);

	mail($email_sender, $msg_email_trace_subject, $msg, getStandardMailHeaders());
}

function json_success() {
	$result = array('success' => true);
	return json_encode($result);
}

function json_failure() {
	$result = array('success' => false);
	return json_encode($result);
}

if(!function_exists('hash_equals')) {
	function hash_equals($str1, $str2) {
		if(strlen($str1) != strlen($str2)) {
			return false;
		} else {
			$res = $str1 ^ $str2;
			$ret = 0;
			for($i = strlen($res) - 1; $i >= 0; $i--) {
				$ret |= ord($res[$i]);
			}
			return !$ret;
		}
	}
}

function json_from_post_body() {
	$request = file_get_contents('php://input');
	return json_decode($request, true);
}

function get_ip_public() {
	return $_SERVER['REMOTE_ADDR'];
}

function get_ip() {
	if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
		$ip = $_SERVER['HTTP_CLIENT_IP'];
	} elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
		$ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
	} else {
		$ip = $_SERVER['REMOTE_ADDR'];
	}
	return $ip;
}


function guidv4($data = null)
{
	// Generate 16 bytes (128 bits) of random data or use the data passed into the function.
	$data = $data ?? random_bytes(16);
	assert(strlen($data) == 16);
	// Set version to 0100
	$data[6] = chr(ord($data[6]) & 0x0f | 0x40);
	// Set bits 6-7 to 10
	$data[8] = chr(ord($data[8]) & 0x3f | 0x80);
	// Output the 36 character UUID.
	return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}
?>

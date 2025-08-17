<?php 

function test_post($resource, $request, $headers = array()) {
	global $test_url, $api_post_mime_type;
	$json = json_encode($request);
	
	// echo "test_post $test_url/$resource with ".print_r($json, true)."\n";
	echo "test_post $test_url/$resource\n";

	$headers = array_merge(array('Content-Type: ' . $api_post_mime_type), test_build_headers($headers));
	print_r($headers);

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, "$test_url/$resource");
	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
	curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
	
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	
	$server_output = curl_exec($ch);
	
	$info = curl_getinfo($ch);
	$http_code= $info['http_code'];
	if ($http_code!= 200) {
		echo "Error $http_code\n";
	}
	
	curl_close ($ch);
	return "$server_output\n\n";
}

function test_get($resource, $request, $headers = array()) {
	global $test_url;
	
	$params = '';
	foreach ($request as $key => $value) {
		$encoded_value = urlencode($value);
		if (!empty($params)) $params .= '&';
		$params .= "$key=$encoded_value";
	}
	
	if (!empty($params)) {
		$resource .= "?$params";
	}
	
	echo "test_get $resource\n";
    $headers = test_build_headers($headers);

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, "$test_url/$resource");
	curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
	
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	
	$server_output = curl_exec($ch);
	
	$info = curl_getinfo($ch);
	$http_code= $info['http_code'];
	if ($http_code!= 200) {
		echo "Error $http_code\n";
	}
	
	curl_close ($ch);
	return "$server_output\n\n";
}

function test_build_headers($key_values) {
    $headers = array();
    foreach($key_values as $key=>$value) {
        $headers[] = "$key: $value";
    }
    return $headers;
}

function test_login_with_credentials($user, $pass) {
    $resource = 'login';

    $request = array();
    $headers = array('Authorization' => 'Basic '. base64_encode("$user:$pass"));

    $result = test_post($resource, $request, $headers);

    return json_decode($result, true);
}

function test_login_with_normal_credentials() {
    global $test_normal_user;
    global $test_normal_pass;
    $auth_info = test_login_with_credentials($test_normal_user, $test_normal_pass);
    return $auth_info['token'];
}

function test_login_with_admin_credentials() {
    global $test_admin_user;
    global $test_admin_pass;
    $auth_info = test_login_with_credentials($test_admin_user, $test_admin_pass);
    return $auth_info['token'];
}

function test_build_auth_headers($token) {
    return array('Authorization' => 'Bearer '. $token);
}

?>
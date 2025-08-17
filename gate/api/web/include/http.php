<?php

function http_post($url, $body, $mime_type, $headers = array()) {
	$headers = array_merge(array('Content-Type: ' . $mime_type), http_build_headers($headers));

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
	curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

	$server_output = curl_exec($ch);

	$info = curl_getinfo($ch);
	$http_code = $info['http_code'];
	curl_close ($ch);

	if ($http_code != 200) {
	    throw new Exception("Error $http_code when trying to post on $url");
	}

	return array('code' => $http_code, 'body' => $server_output);
}

function http_post_json($url, $data, $headers = array()) {
    $json = json_encode($data);
    $response = http_post($url, $json, 'application/json', $headers);
    return json_decode($response['body'], true);
}

function http_build_headers($key_values) {
    $headers = array();
    foreach($key_values as $key=>$value) {
        $headers[] = "$key: $value";
    }
    return $headers;
}

?>
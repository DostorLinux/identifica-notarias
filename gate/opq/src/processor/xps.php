<?php

include_once __DIR__.'/../../../common/include/http.php';

// define an URL endpoint for each port in "localconfig"
// this is only an example
$xps_endpoint['vap'] = 'http://localhost/xps/test.php';
$xps_user = '';
$xps_pass = '';

$extra_config_file ='/opt/localconfig/newstack/gate/xps.php';
if (file_exists($extra_config_file)) include_once($extra_config_file);

$xps_tokens = array();

function xps_get_token($port, $endpoint) {
    global $xps_tokens;
    global $xps_user;
    global $xps_pass;

    if (isset($xps_tokens[$port])) return $xps_tokens[$port];

    $request = array(
        'codigoLogin' => $xps_user,
        'password'    => $xps_pass
    );

    $endpoint = str_replace('registrarEvento', 'login', $endpoint);

    $response = http_post_json($endpoint, $request);
    $token = $response['token'];
    $xps_tokens[$port] = $token;
    return $token;
}

function opq_processor_run($con, $task) {
    global $xps_endpoint;

    $task_id = $task['id'];
    $data = $task['data'];

    echo "running XPS task $task_id with data: $data\n";

    $decoded = json_decode($data, true);
    $port = strtolower($decoded['locacion']);
    if (!isset($xps_endpoint[$port])) {
        throw new Exception("invalid locacion value: $port");
    }

    $endpoint = $xps_endpoint[$port];
    $token = xps_get_token($port, $endpoint);
    $headers = array(
        'Authorization' => "Bearer $token"
    );

    echo "post data on $endpoint\n";
    http_post_json($endpoint, $decoded, $headers);
}


?>

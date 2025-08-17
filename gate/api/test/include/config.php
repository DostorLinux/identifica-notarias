<?php

$api_post_mime_type = 'application/json';
$test_url = 'http://api.identifica.ai/api/v1';

$test_normal_user = 'fcatrin';
$test_normal_pass = 'papalapapiricopipi';
$test_normal_user_id = '22.222.222-2';

$test_admin_user = 'admin';
$test_admin_pass = 'gate.2020';
$test_admin_user_id = '11.111.111-1';

$extra_config_files = array(
    __DIR__.'/localconfig.php',
    '/opt/localconfig/newstack/gate/api_test.php',
    '/opt/privateconfig/newstack/gate/api_test.php');

foreach ($extra_config_files as $extra_config_file) {
	if (file_exists($extra_config_file)) include_once($extra_config_file);
}

?>

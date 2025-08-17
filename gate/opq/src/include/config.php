<?php

$opq_max_cycles = 100;

// optional. Default is 1
$opq_threads['echo'] = 5;

$extra_config_files = array(
    __DIR__.'/localconfig.php',
    '/opt/localconfig/newstack/gate/opq.php',
    '/opt/privateconfig/newstack/gate/opq.php');

foreach ($extra_config_files as $extra_config_file) {
	if (file_exists($extra_config_file)) include_once($extra_config_file);
}
?>
<?php

include_once __DIR__.'/include/config.php';
include_once __DIR__.'/include/test.php';
include_once __DIR__.'/../web/include/config.php';
include_once __DIR__.'/../web/include/api.php';
include_once __DIR__.'/../web/include/http.php';
include_once __DIR__.'/../web/include/reports.php';

$users = reports_list_users();
print_r($users);

?>
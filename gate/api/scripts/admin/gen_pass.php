<?php

include_once __DIR__.'/../../web/include/config.php';
include_once __DIR__.'/../../web/include/gate.php';

if (php_sapi_name() != "cli") {
    die('FORBIDDEN');
}

if ($argc < 2) {
    $this_script = $argv[0];
    die("usage $this_script password\n");
}

$password = $argv[1];
$hash = gate_hash_password($password);

echo "$password -> $hash\n";


?>

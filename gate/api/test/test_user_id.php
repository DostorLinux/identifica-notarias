<?php

include_once __DIR__.'/include/config.php';
include_once __DIR__.'/include/test.php';
include_once __DIR__.'/../web/include/config.php';
include_once __DIR__.'/../web/include/http.php';
include_once __DIR__.'/../web/include/api.php';
include_once __DIR__.'/../web/include/gate.php';

$n = 300;
$ids = array();
for($i=0; $i<20; $i++) {
    $ids[$n] = gate_create_user_id($n);
    $n++;
}

print_r($ids);

foreach($ids as $k => $v) {
    $is_valid = gate_validate_user_id($v);
    echo "$v => is_valid? ".($is_valid ? 'Y' : 'N')."\n";
}

$docId='84.875.323-1';

$parts = gate_get_doc_id_parts($docId);
echo "parts $docId -> ".json_encode($parts)."\n\n";

$normalized = gate_normalize_doc_id($docId);
echo "normalized $docId -> $normalized\n\n";

?>

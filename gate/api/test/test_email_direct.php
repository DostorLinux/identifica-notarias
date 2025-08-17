<?php

include_once __DIR__.'/include/config.php';
include_once __DIR__.'/include/test.php';
include_once __DIR__.'/../web/include/config.php';
include_once __DIR__.'/../web/include/http.php';
include_once __DIR__.'/../web/include/api.php';
include_once __DIR__.'/../web/include/gate.php';

$doc_id = '11.395.742-2';

gate_send_email('fcatrin@gmail.com', $doc_id, 'Franco Catrin', 1659529222, 'enter');
gate_send_email('fcatrin@gmail.com', $doc_id, 'Franco Catrin', 1659560482, 'exit');

?>

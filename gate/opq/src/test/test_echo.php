<?php

include_once __DIR__.'/../../../common/include/config.php';
include_once __DIR__.'/../../../common/include/core.php';
include_once __DIR__.'/../../../common/include/simpledb.php';
include_once __DIR__.'/../include/config.php';
include_once __DIR__.'/../include/opq.php';

$con = new SimpleDb();

$processor_id = 'echo';
$data = 'Echo Test';

opq_create_task($con, $processor_id, $data);

$data = 'fail';
opq_create_task($con, $processor_id, $data);

// process queue with php -f opq_consumer echo THREAD_N

?>
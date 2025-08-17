<?php

include_once __DIR__.'/../../common/include/config.php';
include_once __DIR__.'/../../common/include/simpledb.php';
include_once __DIR__.'/include/config.php';
include_once __DIR__.'/include/opq.php';

if (php_sapi_name() != "cli") {
    die('FORBIDDEN');
}

if ($argc < 3) {
    $this_script = $argv[0];
    die("usage $this_script processor_id thread_n\n");
}

$processor_id = $argv[1];
$thread_n = $argv[2];

// abort if there is no processor handler
$processor_handler_file = __DIR__."/processor/$processor_id.php";
if (!file_exists($processor_handler_file)) {
    die("processor code not found on $processor_handler_file\n");
}

$con = new SimpleDb();

// abort if there is another instance running
if (!opq_lock($con, $processor_id, $thread_n)) {
    die("processor $processor_id:$thread_n is running\n");
}

// now it's safe to process the task(s)
include_once $processor_handler_file;

// process all pending tasks until one of:
// * there are no more tasks
// * there is a failed task

$cycles = 0;
while ($cycles < $opq_max_cycles) {
    // get next task or abort
    $task = opq_get_task($con, $processor_id, $thread_n);
    if (empty($task)) break;

    try {
        opq_processor_run($con, $task);
        opq_end_task($con, $task);
    } catch (Exception $e) {
        opq_fail_task($con, $task, $e->getMessage());
    }

    $cycles++;
}

opq_unlock($con, $processor_id, $thread_n);

?>
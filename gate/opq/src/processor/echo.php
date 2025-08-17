<?php

function opq_processor_run($con, $task) {
    $task_id = $task['id'];
    $data = $task['data'];

    if ($data == 'fail') {
        echo "failing task $task_id\n";
        throw new Exception("echo test failed");
    }

    echo "running echo task $task_id with data:$data\n";
}

?>
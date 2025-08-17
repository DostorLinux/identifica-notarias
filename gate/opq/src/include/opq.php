<?php

define('STATUS_IDLE', 'IDLE');
define('STATUS_RUNNING', 'RUNNING');

define('STATUS_NEW', 'NEW');
define('STATUS_PROCESSING', 'PROCESSING');
define('STATUS_PROCESSED', 'PROCESSED');
define('STATUS_RETRY', 'RETRY');
define('STATUS_FAILED', 'FAILED');

function opq_lock($con, $processor_id, $thread_n) {
    $sql = 'select 1 from processor where id = ? and thread = ?';
    if (!$con->exists($sql, array($processor_id, $thread_n))) {
        $sql = 'insert into processor (id, thread, status) values (?, ?, ?)';
        $con->execute($sql, array($processor_id, $thread_n, STATUS_IDLE));
    }
    $sql = 'update processor set status = ?, updated = now() where id = ? and thread = ? and status = ?';
    $con->execute($sql, array(STATUS_RUNNING, $processor_id, $thread_n, STATUS_IDLE));
    return $con->get_affected_rows() > 0;
}

function opq_unlock($con, $processor_id, $thread_n) {
    $sql = 'update processor set status = ?, updated = now() where id = ? and thread = ?';
    $con->execute($sql, array(STATUS_IDLE, $processor_id, $thread_n));
}

function opq_set_task_status($con, $task_id, $status, $error = '') {
    $sql = 'update task set status = ?, error = ?, updated = now() where id = ?';
    $con->execute($sql, array($status, $error, $task_id));
}

function opq_get_task($con, $processor_id, $thread_n) {
    $sql = 'select min(id) from task where processorId = ? and thread = ? and (status = ? or status = ?)';
    $task_id = $con->get_one($sql, array($processor_id, $thread_n, STATUS_NEW, STATUS_RETRY));
    if (empty($task_id)) return null;

    $sql = 'select id, data from task where id = ?';
    $task = $con->get_row($sql, array($task_id));

    opq_set_task_status($con, $task_id, STATUS_PROCESSING);

    return $task;
}

function opq_end_task($con, $task) {
    $task_id = $task['id'];
    opq_set_task_status($con, $task_id, STATUS_PROCESSED);
}

function opq_fail_task($con, $task, $error) {
    $task_id = $task['id'];
    opq_set_task_status($con, $task_id, STATUS_FAILED, $error);
}

function opq_create_task($con, $processor_id, $data) {
    global $opq_threads;
    $threads_max = 1;
    if (isset($opq_threads[$processor_id])) {
        $threads_max = $opq_threads[$processor_id];
    }

    $thread_n = rand(0, $threads_max-1);

    $sql = 'insert into task (processorId, thread, data, error, status) values (?, ?, ?, ?, ?)';
    $con->execute($sql, array($processor_id, $thread_n, $data, '', STATUS_NEW));
}

?>
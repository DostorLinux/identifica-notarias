<?php

include_once __DIR__ . '/../include/config.php';
include_once __DIR__ . '/../include/core.php';
include_once __DIR__ . '/../include/simpledb.php';
include_once __DIR__ . '/../include/gate.php';
include_once __DIR__ . '/../include/portal.php';

$con = new SimpleDb();

$sql = "select id from user where pub_id is null";
$users = $con->get_array($sql);
$update = "update user set pub_id =? where id=?";

foreach($users as $user) {
    $uuid = guidv4();
    $con->execute($update, array($uuid,$user["id"]));
}
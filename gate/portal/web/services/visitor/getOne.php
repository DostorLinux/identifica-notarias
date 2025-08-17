<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

$con = new SimpleDb();

$id = getParameter('id');

$sql = 'select v.id, v.doc_id, v.first_name, v.last_name, v.enter_type,
    u.first_name creator_first_name, u.last_name creator_last_name 
    from visitor v
    left join user u on u.id = v.created_by 
    where v.id = ? ';
$visitor = $con->get_one($sql, array($id));

$result = array('visitor' => $visitor);

echo json_encode($result);

?>
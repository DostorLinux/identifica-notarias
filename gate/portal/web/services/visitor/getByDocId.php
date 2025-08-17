<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

$con = new SimpleDb();


$doc_id  = getParameter('doc_id');

$doc_id  = gate_normalize_doc_id($doc_id);

$con = new SimpleDb();

$sql = 'select v.id, v.doc_id, v.first_name, v.last_name, v.enter_type,
    u.first_name creator_first_name, u.last_name creator_last_name
    from visitor v 
    left join user u on u.id = v.created_by    
    where v.doc_id = ? 
      ';
try {
    $visitor = $con->get_row($sql, array($doc_id));
}catch (Exception $e) {

    echo json_encode(array('error' => $e->getMessage()));
}
$result = array('visitor' => $visitor);

echo json_encode($result);

?>
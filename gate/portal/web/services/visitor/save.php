<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$doc_id     = getPostParameter('doc_id');
$first_name = getPostParameter('first_name');
$last_name  = getPostParameter('last_name');

$doc_id = gate_normalize_doc_id($doc_id);

$con = new SimpleDb();
$sql = 'select id from visitor where doc_id = ?';
$visitorId = $con->get_one($sql, $doc_id);

if (!empty($visitorId)) {
    $sql = 'update visitor set first_name = ?, last_name = ? where id = ?';
    $params = array($first_name, $last_name, $visitorId);
    $con->execute($sql, $params);
    $audit_type = AUDIT_VISITOR_CREATE;
} else {
    $created_by = $auth_info['userId'];
    $sql = 'insert into visitor (doc_id, first_name, last_name, enter_type, created_by, updated) '.
        'values (?, ?, ?, ?, ?, now())';
    $params = array($doc_id, $first_name, $last_name, 'MANUAL', $auth_user_id);
    $con->execute($sql, $params);
    $visitorId = $con->get_last_id();
    $audit_type = AUDIT_VISITOR_MODIFY;
}

gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));

$response = array('id' => $visitorId);
echo json_encode($response);


?>
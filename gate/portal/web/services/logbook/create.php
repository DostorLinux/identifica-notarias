<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$idVisitor       = getPostParameter('idVisitor');
$first_name        = getPostParameter('VisitorFirstName');
$last_name        = getPostParameter('VisitorLastName');
$doc_id          = getPostParameter('VisitorDocId');
$gate_id          = getPostParameter('gateId');
$event_type  = getPostParameter('eventType');
$description = getPostParameter('description');
$invited_by  = getPostParameter('invited_by');
$notes       = getPostParameter('notes');
$status      = getPostParameter('status');

$con = new SimpleDb();

try {
//Validate if visitor id exists
    if (!isset($idVisitor) || empty($idVisitor)) {

        $sql = 'select id from visitor where doc_id = ?';
        $idVisitor = $con->get_one($sql, $doc_id);
        if (empty($idVisitor)) { // try to create visitor from user info if found
            $sql = 'insert into visitor (first_name, last_name, doc_id, enter_type, created_by) values (?, ?, ?, ?, ?)';
            $params = array($first_name, $last_name, $doc_id, 'Manual', $auth_user_id);
            $con->execute($sql, $params);
            $idVisitor = $con->get_last_id();

            $params[] = $idVisitor;
            $audit_type = AUDIT_VISITOR_CREATE;
            gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));
        }
    }


$sql = 'insert into logbook (visitorId, gateId, status,event_type,description,invited_by,notes) values (?, ?, ?, ?, ?, ?, ?)';
$params = array($idVisitor, $gate_id, $status, $event_type, $description, $invited_by, $notes);
$con->execute($sql, $params);
$logId = $con->get_last_id();

$params[] = $logId;
$audit_type = AUDIT_LOGBOOK_CREATE;
gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));

$response = array('visitor' => $idVisitor, 'log' => $logId);
echo json_encode($response);
} catch (Exception $e) {
    echo json_encode(array('error' => $e->getMessage()));
    exit;
}


?>
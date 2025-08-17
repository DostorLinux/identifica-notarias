<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();



$id = getPostParameter('id');
$visitorId       = getPostParameter('idVisitor');
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

//Validate if visitor id exists
    //Update visitor:

    if (!empty($visitorId)) {
        $sql = 'update visitor set first_name = ?, last_name = ? where id = ?';
        $params = array($first_name, $last_name, $visitorId);
        $con->execute($sql, $params);
        $audit_type = AUDIT_VISITOR_MODIFY;
        gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));
    }


    $sql = 'update logbook set event_type = ?, description = ?, invited_by = ?, notes = ?, status = ?, register_by = ? where id = ?';
    $params = array($event_type, $description, $invited_by, $notes, $status, $auth_user_id, $id);
    $con->execute($sql, $params);

    if ($con->get_matched_rows() > 0) {
        $audit_type = AUDIT_LOGBOOK_SAVE;
        gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));

        echo json_success();
    } else {
        echo json_failure();
    }











?>
<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

$con = new SimpleDb();

$gateId = getParameter('gateId');

$sql =
    'select v.id visitorId, v.first_name, v.last_name, v.doc_id,
     l.event_type, l.description, l.invited_by, l.notes, l.status
     from logbook l, visitor v where l.gateId = ? and l.visitorId = v.id order by created desc';
$log = $con->get_array($sql, array($gateId));

$result = array('log' => $log);

echo json_encode($result);

?>
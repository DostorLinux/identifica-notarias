<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

$con = new SimpleDb();

$id = getParameter('id');

$sql =
    'select l.id, v.first_name, v.last_name, v.doc_id, v.id visitorId,
        l.gateId, l.created,
     l.event_type, l.description, l.invited_by, l.notes, l.status
     from logbook l, visitor v where l.id = ? and l.visitorId = v.id';

    $log = $con->get_row($sql, array($id));

$result = array('log' => $log);

echo json_encode($result);

?>
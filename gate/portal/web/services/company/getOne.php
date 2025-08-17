<?php

include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$id = getParameter('id');
if (empty($id)) {
	portal_abort('MANDATORY', 'id');
}

$sql = 'select id,  rut, name, address, created ,isDenied, notes, deniedNote, active, updated from company where id = ?';
$company = $con->get_row($sql, $id);

if (empty($company)) {
	portal_abort('COMPANY_NOT_FOUND');
}

$result = array('company' => $company);

echo json_encode($result);

?>
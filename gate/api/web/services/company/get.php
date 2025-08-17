<?php

require __DIR__.'/../../vendor/autoload.php';

include_once __DIR__.'/../../include/config.php';
include_once __DIR__.'/../../include/simpledb.php';
include_once __DIR__.'/../../include/api.php';
include_once __DIR__.'/../../include/gate.php';

api_json_header();
$auth_info = gate_jwt_auth_admin();

$id = getParameter('id');
if (empty($id)) {
    api_abort('MANDATORY', 'id');
}

$con = new SimpleDb();

$sql = 'select id, name, rut, address, notes, isDenied, deniedNote, created, updated from company where id = ? and active = 1';
$company = $con->get_row($sql, array($id));

if (empty($company)) {
    api_abort('COMPANY_NOT_FOUND');
}

echo json_encode($company);

?>

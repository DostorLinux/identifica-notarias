<?php

require __DIR__.'/../../vendor/autoload.php';

include_once __DIR__.'/../../include/config.php';
include_once __DIR__.'/../../include/simpledb.php';
include_once __DIR__.'/../../include/http.php';
include_once __DIR__.'/../../include/api.php';
include_once __DIR__.'/../../include/gate.php';

api_json_header();
$auth_info = gate_jwt_auth_admin();

$request = json_from_post_body();

$id = api_get($request, 'id');
$name = api_get_mandatory($request, 'name');
$rut = api_get_mandatory($request, 'rut');
$address = api_get($request, 'address');
$notes = api_get($request, 'notes');

$con = new SimpleDb();

$params = array($name, $rut, $address, $notes);

if (empty($id)) {
    // Create new company
    $sql = 'insert into company (name, rut, address, notes, isDenied, created, updated) values (?, ?, ?, ?, 0, now(), now())';
    $con->execute($sql, $params);
    $id = $con->get_last_id();
    $result = 'created';
} else {
    // Update existing company
    $sql = 'update company set name = ?, rut = ?, address = ?, notes = ?, updated = now() where id = ?';
    $params[] = $id;
    $con->execute($sql, $params);
    $result = 'updated';
}

// Save audit log if available
if (function_exists('gate_save_audit_log')) {
    $audit_type = empty($id) ? 'COMPANY_CREATE' : 'COMPANY_MODIFY';
    gate_save_audit_log($con, $auth_info['user_id'], $audit_type, json_encode($params));
}

$response = array('id' => $id, 'result' => $result);
echo json_encode($response);

?>

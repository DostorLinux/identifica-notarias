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
$id = api_get_mandatory($request, 'id');

$con = new SimpleDb();

// Check if company exists
$sql = 'select id from company where id = ? and active = 1';
$company_id = $con->get_one($sql, $id);
if (empty($company_id)) {
    api_abort('COMPANY_NOT_FOUND');
}

// Soft delete the company
$sql = 'update company set active = 0, updated = now() where id = ?';
$con->execute($sql, array($id));

// Save audit log if available
if (function_exists('gate_save_audit_log')) {
    gate_save_audit_log($con, $auth_info['user_id'], 'COMPANY_DELETE', json_encode(array('id' => $id)));
}

echo json_success();

?>

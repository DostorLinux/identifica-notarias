<?php

require __DIR__.'/../vendor/autoload.php';

include_once __DIR__.'/../include/config.php';
include_once __DIR__.'/../include/simpledb.php';
include_once __DIR__.'/../include/api.php';
include_once __DIR__.'/../include/gate.php';

api_json_header();
api_validate_shared_key();

$user_doc_id = getParameter('doc_id');
if (empty($user_doc_id)) api_abort('MANDATORY', 'doc_id');

$con = new SimpleDb();
$user_info = gate_find_user_by_doc_id($con, $user_doc_id, null);
$found = !empty($user_info);

$response = array('found' => $found);
if ($found) {
    $response['doc_id'] = $user_info['doc_id'];
}

echo json_encode($response);

?>
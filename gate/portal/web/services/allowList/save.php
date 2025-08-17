<?php


include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$access_day = getPostParameter('day');
$doc_id = getPostParameter('doc_id');
$first_name = getPostParameter('first_name');
$last_name = getPostParameter('last_name');
$profile= getPostParameter('profile');
$plate = getPostParameter('plate');
$company = getPostParameter('company');
$plate = strtoupper($plate);

$allowId = getPostParameter('allow_id');

$dateObject = DateTime::createFromFormat('d/m/Y', $access_day);
// Format the DateTime object to the desired output format
$access_day_fixed = $dateObject->format('Y-m-d');
if(empty($allowId)){
$allow_info = gate_allow($con, $doc_id, $first_name, $last_name, $plate, $company,$access_day_fixed,$profile);
}else{
    $allow_info = gate_allow_update($con, $allowId, $doc_id, $first_name, $last_name, $plate, $company,$access_day_fixed,$profile);
}
echo json_encode($allow_info);


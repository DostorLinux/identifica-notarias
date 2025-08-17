<?php


include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();


$data = getPostParameter("records");

$lines = explode(",", $data);
$unwanted_chars = ["\xe2\x80\x82", "\xe2\x80\x83"]; // Add more unwanted chars as needed
foreach ($lines as $index=>$line) {
    if (empty($line)) {
        continue;
    }
    $line = explode(";", $line);
    $access_day_fixed = $line[0];
    $doc_id = $line[1];
    $first_name = $line[2];
    $last_name = $line[3];
    $company = $line[4];
    $profile = $line[5];
    //trim

    $plate = str_replace($unwanted_chars, "", trim($line[6]));
    // Format the DateTime object to the desired output format
    error_log("Campo".$index);
    try {
        gate_allow($con, $doc_id, $first_name, $last_name, $plate, $company,$access_day_fixed, $profile);
    } catch (Exception $e) {
        $allow_info = array("error" => $e->getMessage());
    }
}


echo json_encode($allow_info);

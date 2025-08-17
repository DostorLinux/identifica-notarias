<?php


include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$init    = getPostParameter('init');
$end = getPostParameter('end');
$allow_group_id = getPostParameter('allow_group_id');



$dateObject = DateTime::createFromFormat('d/m/Y', $init);
// Format the DateTime object to the desired output format
$formatInit = $dateObject->format('Y-m-d');

$dateObjectEnd = DateTime::createFromFormat('d/m/Y', $end);
// Format the DateTime object to the desired output format
$formatEnd = $dateObjectEnd->format('Y-m-d');



$sql = "select ag.id as user_in_group, ag.allow_group_id, ag.first_name, ag.last_name, ag.doc_id, ag.plate, ag.profile, ag.created, ag.updated, a.company

            from allow_group_user ag, allow_group a where ag.allow_group_id = a.id and a.id = ? ";

$params = array($allow_group_id);
$result = $con->get_array($sql, $params);

//Every day between init and end
$begin = new DateTime($formatInit);
$end = new DateTime($formatEnd);
$quantity = 0;
error_log("Begin: " . $begin->format("Y-m-d"));
error_log("End: " . $end->format("Y-m-d"));

for ($i = $begin; ($i <= $end)&&($quantity<=90) ; $i->modify('+1 day')) {
    $day = $i->format("Y-m-d");
    $quantity++;
    error_log("Day: " . $day);
    foreach ($result as $row) {

        $doc_id = $row['doc_id'];
        $first_name = $row['first_name'];
        $last_name = $row['last_name'];
        $plate = $row['plate'];
        $profile = $row['profile'];
        $company = $row['company'];
        $userInGroup = $row['user_in_group'];
        $allow_info = gate_allow($con, $doc_id, $first_name, $last_name, $plate, $company,$day,$profile,$allow_group_id,$userInGroup);
    }
}

$result = array('days' => $quantity);
echo json_encode($result);

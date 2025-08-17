<?php

require __DIR__.'/../vendor/autoload.php';

include_once __DIR__.'/../include/config.php';
include_once __DIR__.'/../include/simpledb.php';
include_once __DIR__.'/../include/api.php';
include_once __DIR__.'/../include/gate.php';

api_json_header();

$auth_info = gate_jwt_auth();


$con = new SimpleDb();

$sql="SELECT  
       u.doc_id, a.profile,
       u.first_name, u.last_name,
       a.plate, a.access_day,
       u.id AS user_id,
       a.company,
       pr.id AS parking_id,
       pr.has_notification,
       pr.status,
       TIMESTAMPDIFF(MINUTE, pr.notification_date, NOW()) AS minutes_from_notification,
       TIMESTAMPDIFF(MINUTE, pr.enter_date, NOW()) AS minutes_in_parking,
       pr.enter_date as parking_date

FROM allow_list a
JOIN user u ON a.user_id = u.id
JOIN parking_register pr ON a.id = pr.allow_list_id
WHERE pr.status IN ('IN_PARKING') and pr.has_notification = 1
ORDER BY minutes_from_notification DESC";

$vehicles = $con->get_array($sql, []);
$response = array('vehicles' => $vehicles);
echo json_encode($response);
?>
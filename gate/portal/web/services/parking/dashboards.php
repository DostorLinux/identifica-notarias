<?php


include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/api.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';


portal_auth_admin();

$type = sanitize(getParameter('type'));


$con = new SimpleDb();


/*
 * $doc_id = getPostParameter('doc_id');
$first_name = getPostParameter('first_name');
$last_name = getPostParameter('last_name');
$profile= getPostParameter('profile');
$plate = getPostParameter('plate');
$company = getPostParameter('company');
$plate = strtoupper($plate);
 * */

    $sql = "
    SELECT a.id, u.doc_id, a.profile,
       u.first_name, u.last_name,
       a.plate, a.access_day,
       u.id AS user_id, a.created,
       a.updated, a.company,
        pr.has_notification,
           pr.id AS parking_id,
       pr.status, TIMESTAMPDIFF(MINUTE, pr.enter_date, NOW()) AS minutes_in_parking,
           pr.enter_date as parking_date
           
FROM allow_list a
JOIN user u ON a.user_id = u.id
JOIN parking_register pr ON a.id = pr.allow_list_id
WHERE pr.status IN ('IN_PARKING', 'IN_TRANSIT')
UNION
SELECT * FROM (
    SELECT pr.id, u.doc_id, a.profile,
           u.first_name, u.last_name,
           a.plate, a.access_day,
           u.id AS user_id, a.created,
           a.updated, a.company,
           pr.has_notification,
           pr.id AS parking_id,
           pr.status, TIMESTAMPDIFF(MINUTE, pr.in_port_date, NOW()) AS minutes_in_parking,
            pr.enter_date as parking_date

           
    FROM allow_list a
    JOIN user u ON a.user_id = u.id
    JOIN parking_register pr ON a.id = pr.allow_list_id
    WHERE pr.status = 'IN_PORT'
    ORDER BY pr.updated DESC
    LIMIT 10
) AS subquery
ORDER BY updated DESC;
     
     ";

$events = $con->get_array($sql);
$result = array();

//g.name, g.hasDependecy, g.dependencyId, g.maxMinutes, g.created ,g.updated

foreach($events as $event) {
    $row = array();
    $row[] = $event['parking_id'];
    $row[] = $event['doc_id'];
    $row[] = $event['first_name'];
    $row[] = $event['last_name'];
    $row[] = $event['plate'];
    $row[] = $event['profile'];
    $row[] = $event['company'];
    $row[] = $event['status'];
    $row[] = $event['minutes_in_parking'];
    $row[] = $event['parking_date'];
    $row[] = ($event['status']=="IN_PARKING")?$event['has_notification']:0;
    $result[] = $row;
}


$response = array('data' => $result, 'total' => count($result));
echo json_encode($response);



?>
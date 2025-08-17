<?php


include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$id    = getPostParameter('id');
$doc_id = getPostParameter('doc_id');
$first_name = getPostParameter('first_name');
$last_name = getPostParameter('last_name');
$profile= getPostParameter('profile');
$plate = getPostParameter('plate');
$company = getPostParameter('company');
$plate = strtoupper($plate);

$allow_group_id = getPostParameter('allow_group_id');
/*

create table allow_group_user(
    id int auto_increment primary key,
    allow_group_id int,
    first_name varchar(100),
    last_name varchar(100),
    doc_id varchar(15),
    plate varchar(10),
    profile    varchar(20),
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


*/


if (empty($id)) {
    $audit_type = AUDIT_ALLOWGROUPUSR_ADD;
      $sql = 'insert into allow_group_user (allow_group_id, first_name, last_name, doc_id, plate, profile, created, updated) 
values (?, ?, ?, ?, ?, ?, now(), now())';
    $params = array($allow_group_id, $first_name, $last_name, $doc_id, $plate, $profile);
    $con->execute($sql, $params);
    $id = $con->get_last_id();

    $groupsday  = "select distinct(access_day) as day_allow from allow_list where group_id = ? and access_day >=  CURDATE()";
    $params = array($allow_group_id);
    $days = $con->get_array($groupsday, $params);

    $company = '';
    if(count($days)){
        $sql = 'select id, name, description, company, created, updated from allow_group where id =? ';
        $entity = $con->get_row($sql, $allow_group_id);
        $company = $entity['company'];
    }

    foreach ($days as $day) {
        error_log("day: " . $day['day_allow'] . "\n");
        $allow_info = gate_allow($con, $doc_id, $first_name, $last_name, $plate, $company,$day['day_allow'],$profile,$allow_group_id,$id);
    }
} else {
    $audit_type = AUDIT_ALLOWGROUPUSR_MODIFY;
    $sql = 'update allow_group_user set  first_name = ?, last_name = ?, doc_id = ?, plate = ?, profile = ?, updated = now() where id = ?';
    $params = array( $first_name, $last_name, $doc_id, $plate, $profile);
    $params[] = $id;
    $con->execute($sql, $params);
}




gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));
$result = array('id' => $id);
echo json_encode($result);

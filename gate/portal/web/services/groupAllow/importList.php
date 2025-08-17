<?php


include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$con = new SimpleDb();

$allow_group_id = getPostParameter('allow_group_id');
$data = getPostParameter("records");

$lines = explode(",", $data);
$unwanted_chars = ["\xe2\x80\x82", "\xe2\x80\x83"]; // Add more unwanted chars as needed
foreach ($lines as $index=>$line) {
    if (empty($line)) {
        continue;
    }
    $line = str_replace($unwanted_chars, "", $line); // Remove new line characters (if any

    $line = explode(";", $line);
    $doc_id = $line[0];
    $first_name = $line[1];
    $last_name = $line[2];
    $plate = $line[3];
    $profile = $line[4];
    //trim
    $plate = str_replace($unwanted_chars, "", trim($line[3]));
    // Format the DateTime object to the desired output format
    error_log("Campo".$index);
    try {
        //find by doc_id
        $id =null;
        if (!empty($doc_id)) {
                $sql = 'select id from allow_group_user where doc_id = ? and plate=? and allow_group_id = ?';
                $params = array($doc_id, $plate, $allow_group_id);
                $id = $con->get_one($sql, $params);
        }

        if (empty($id)) {
            $audit_type = AUDIT_ALLOWGROUPUSR_ADD;
            $sql = 'insert into allow_group_user (allow_group_id, first_name, last_name, doc_id, plate, profile, 
                              created, updated) values (?, ?, ?, ?, ?, ?, now(), now())';
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

    } catch (Exception $e) {
        $allow_info = array("error" => $e->getMessage());
    }
}


echo json_encode($allow_info);

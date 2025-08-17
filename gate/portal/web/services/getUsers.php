<?php
include_once __DIR__ . '/../include/config.php';
include_once __DIR__ . '/../include/core.php';
include_once __DIR__ . '/../include/simpledb.php';
include_once __DIR__ . '/../include/gate.php';
include_once __DIR__ . '/../include/portal.php';

portal_auth();

$con = new SimpleDb();
$type = getParameter("type");

$sql = "select id, doc_id, sec_id, username, first_name, last_name, email, role, active, pub_id, isDenied, deniedNote, user_type from user";
$params = array();

if ($auth_user_role != PROFILE_ADMIN && $auth_user_role != PROFILE_SUPER_ADMIN){
    $sql .= ' where id = ?';
    $params[] = $auth_user_id;
    if ($type == 'denied') {
        $sql .= ' and isDenied=1';
    }

}else{
    if ($type == 'denied') {
        $sql .= ' where isDenied=1';
    }
}


$users = $con->get_array($sql, $params);
$result = array();
foreach($users as $user) {
	$row = array();
    $row[] = $user['pub_id'];
    $row[] = $user['doc_id'];
	$row[] = $user['sec_id'];
	$row[] = $user['username'];
	$row[] = $user['first_name'];
	$row[] = $user['last_name'];
	$row[] = $user['email'];
	$row[] = $user['role'];
	$row[] = $user['active'];
	$row[] = $user['id'];
    $row[] = $user['isDenied'];
    $row[] = $user['deniedNote'];
    $row[] = $user['user_type'];
	$result[] = $row;
}

$response = array('data' => $result);

echo json_encode($response);

?>
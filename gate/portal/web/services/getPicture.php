<?php

include_once __DIR__ . '/../include/config.php';
include_once __DIR__ . '/../include/core.php';
include_once __DIR__ . '/../include/simpledb.php';
include_once __DIR__ . '/../include/gate.php';
include_once __DIR__ . '/../include/portal.php';

$con = new SimpleDb();
$id = getParameter('id');
$pub_id = getParameter('pub_id');
if (empty($pub_id)) {
	portal_abort('MANDATORY', 'pub_id');
}

$sql = 'select id from user where pub_id=? and id=?';
$user_id = $con->get_one($sql, array($pub_id,$id));
//$valid_user = $auth_user_role == PROFILE_ADMIN || $user_id == $auth_user_id;
if($user_id==null){
    exit();
}
$image_file = gate_get_face_path(FACE_TYPE_USER, $user_id);
if (!file_exists($image_file) ) {
	//$image_file = __DIR__.'/../images/unknown_person.jpg';
    exit();
}

header("Content-Type: image/jpg");
header("Content-Length: " . filesize($image_file));

$fp = fopen($image_file, 'rb');
fpassthru($fp);
exit;

?>
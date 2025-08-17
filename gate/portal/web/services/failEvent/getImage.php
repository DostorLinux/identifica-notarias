<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/api.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth();

$con = new SimpleDb();
$id = getParameter('id');

if (empty($id)) {
    portal_abort('MANDATORY', 'id');
}

// Get the match history record and verify permissions
$sql = 'SELECT mh.shot_filename, mh.user_id, mh.device_id 
        FROM match_history mh 
        WHERE mh.id = ? AND mh.deleted = 0';
$params = array($id);

$match = $con->get_row($sql, $params);

if ($match === null) {
    exit();
}


$image_file = $dir_face_history . '/' . $match['shot_filename'];

if (!file_exists($image_file)) {
    exit();
}

// Output the image
header("Content-Type: image/jpeg");
header("Content-Length: " . filesize($image_file));
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

$fp = fopen($image_file, 'rb');
fpassthru($fp);
fclose($fp);
exit;

?>

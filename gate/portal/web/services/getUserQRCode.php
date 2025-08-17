<?php

include_once __DIR__ . '/../include/config.php';
include_once __DIR__ . '/../include/core.php';
include_once __DIR__ . '/../include/simpledb.php';
include_once __DIR__ . '/../include/gate.php';
include_once __DIR__ . '/../include/portal.php';
include_once __DIR__ . '/../include/qrcode/qrcode.php';


$id = getParameter('id');
if (empty($id)) {
	portal_abort('MANDATORY', 'id');
}

$con = new SimpleDb();
$sql = 'select doc_id from user where id = ?';
$docId = $con->get_one($sql, $id);

if (empty($docId)) {
	portal_abort('USER_NOT_FOUND');
}

$docId = gate_normalize_doc_id($docId);
$data = "identifica.RUN=$docId";

$image = portal_create_qr_code_image($data);

header('Content-Type: image/png');
imagepng($image);
imagedestroy($image);

?>
<?php

include_once __DIR__ . '/../include/config.php';
include_once __DIR__ . '/../include/core.php';
include_once __DIR__ . '/../include/simpledb.php';
include_once __DIR__ . '/../include/gate.php';
include_once __DIR__ . '/../include/portal.php';
include_once __DIR__ . '/../include/qrcode/qrcode.php';


$qr = getParameter('qr');
if (empty($qr)) {
    portal_abort('MANDATORY', 'qr');
}



$data = "identifica-access;$qr";

$image = portal_create_qr_code_image($data);
header('Content-Type: image/png');
imagepng($image);
imagedestroy($image);
?>
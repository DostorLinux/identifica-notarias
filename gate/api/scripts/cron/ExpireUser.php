<?php


include_once __DIR__.'/../../../portal/web/include/config.php';
include_once __DIR__.'/../../../portal/web/include/core.php';
include_once __DIR__.'/../../../portal/web/include/simpledb.php';
include_once __DIR__.'/../../../portal/web/include/gate.php';
include_once __DIR__.'/../../../portal/web/include/portal.php';

$con = new SimpleDb();

$update = "update user set active='N'  where has_expiration = 1 and active='Y' and expiration_date<now()";
$con->execute($update, array());

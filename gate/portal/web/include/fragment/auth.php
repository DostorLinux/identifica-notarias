<?php 

include_once 'include/core.php';

session_start();

if (empty($_SESSION['token'])) {
	redirect('login.php');
}

include_once 'include/gate.php';
include_once 'include/portal.php';
portal_auth();

?>
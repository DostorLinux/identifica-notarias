<?php

include_once 'include/config.php';

$has_config = $gate_has_areas && $auth_user_role == PROFILE_ADMIN;

?>
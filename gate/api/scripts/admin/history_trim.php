<?php

$include_dir = __DIR__.'/../../web/include/';

include_once "$include_dir/config.php";
include_once "$include_dir/simpledb.php";
include_once "$include_dir/gate.php";

$con = new SimpleDb();
gate_clean_match_history($con);

?>
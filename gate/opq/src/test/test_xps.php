<?php

include_once __DIR__.'/../../../common/include/config.php';
include_once __DIR__.'/../../../common/include/core.php';
include_once __DIR__.'/../../../common/include/simpledb.php';
include_once __DIR__.'/../include/config.php';
include_once __DIR__.'/../include/opq.php';

$con = new SimpleDb();
$con->trace_on();

$processor_id = 'xps';
$data = '{
            "idEvento": "6",
            "fecha": "2024-07-01T01:40:00Z",
            "rut": "25353373-0",
            "nacionalidad": "Chilena",
            "nombres": "JOHN",
            "apellidos": "CACERES",
            "dispositivo": "TORNQUETE-1",
            "locacion": "VAP"
         }
';

opq_create_task($con, $processor_id, $data);

$data = '{
            "idEvento": "6",
            "fecha": "2024-07-01T01:40:00Z",
            "rut": "25353373-0",
            "nacionalidad": "Chilena",
            "nombres": "JOHN",
            "apellidos": "CACERES",
            "dispositivo": "TORNQUETE-1",
            "locacion": "xxx"
         }
';

opq_create_task($con, $processor_id, $data);

echo "process queue with php -f ../opq_consumer.php xps 0\n";

?>
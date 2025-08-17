<?php

include_once __DIR__ . '/../include/config.php';
include_once __DIR__ . '/../include/core.php';
include_once __DIR__ . '/../include/simpledb.php';
include_once __DIR__ . '/../include/api.php';
include_once __DIR__ . '/../include/gate.php';
include_once __DIR__ . '/../include/portal.php';

portal_auth();

function docIdTransform($docId){
    str_replace("-","",$docId);
    str_replace(".","",$docId);
    str_replace("K","k",$docId);
    str_replace(" ","",$docId);
    while (strlen($docId)<9){
        $docId.="0";
    }
    return $docId;
}


$request = json_from_post_body();

$column    = sanitize(api_get($request, 'column'));
$direction = sanitize(api_get($request, 'direction'));
$init      = (int)api_get_number($request, 'init');
$end      = (int)api_get_number($request, 'end');

$fields = 'e.id, u.doc_id,  e.entry, e.created ';
$tables = 'user u, event e ';
$where  = 'e.userId = u.id ';
$params = array();

// restrict data access
if ($auth_user_role != PROFILE_ADMIN && $auth_user_role != PROFILE_SUPER_ADMIN) {
    $where .= ' and u.id = ?';
    $params[] = $auth_user_id;
}

// create order expression
$order  = 'order by created desc';


// create filter expression
$where .= ' and e.created>=? and e.created<=?';
$params = array_merge($params, array($init,$end));



$con = new SimpleDb();
$sql = "select $fields from $tables where $where $order ";
$events = $con->get_array($sql, $params);
$result = array();
foreach($events as $event) {
    $date= gmdate("dmYH:i", $event['created']);
    $line = docIdTransform($event['doc_id']).$date.($event['entry']=='EXIT'?'SAL':'ENT');
    $result[] = $line;
}

// count all matching rows
$response = array('data' => $result);
echo json_encode($response);


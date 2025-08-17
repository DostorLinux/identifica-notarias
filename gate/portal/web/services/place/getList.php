<?php

    include_once __DIR__ . '/../../include/config.php';
    include_once __DIR__ . '/../../include/core.php';
    include_once __DIR__ . '/../../include/simpledb.php';
    include_once __DIR__ . '/../../include/api.php';
    include_once __DIR__ . '/../../include/gate.php';
    include_once __DIR__ . '/../../include/portal.php';

    portal_auth_admin();
    $type = getParameter("type");

    $request = json_from_post_body();
    $column = sanitize(api_get($request, 'column'));
    $direction = sanitize(api_get($request, 'direction'));
    $page = (int)api_get_number($request, 'page') - 1;
    $size = (int)api_get_number($request, 'size');

    $fields = ' p.id, p.name, p.description ';
    $tables = ' place p ';
    $where = ' ';
    $params = array();


    // create order expression
    $order = 'order by id asc';
    if (!empty($order) && !empty($direction)) {
        $direction = $direction == 'asc' ? $direction : 'desc';
        $order = "order by $column $direction";
    }

    // row start for limit expression
    $offset = $page * $size;

    $con = new SimpleDb();
    if(isEmptyString($where)){
        $where = 'true';
    }
    $sql = "select $fields from $tables where $where $order limit $offset, $size";
    $events = $con->get_array($sql, $params);

    $result = array();
    foreach ($events as $event) {
        $row = array();
        $row[] = $event['id'];
        $row[] = $event['name'];
        $row[] = $event['description'];
        $result[] = $row;
    }

    // count all matching rows
    $sql = "select count(1) from $tables where $where";
    $total = (int)$con->get_one($sql, $params);
    $response = array('data' => $result, 'total' => $total);
    echo json_encode($response);

?>
<?php

require __DIR__.'/../../vendor/autoload.php';

include_once __DIR__.'/../../include/config.php';
include_once __DIR__.'/../../include/simpledb.php';
include_once __DIR__.'/../../include/api.php';
include_once __DIR__.'/../../include/gate.php';

api_json_header();
$auth_info = gate_jwt_auth_admin();

$type = getParameter("type");
$column = getParameter('column');
$direction = getParameter('direction');
$page = (int)getParameter('page', 1) - 1;
$size = (int)getParameter('size', 25);
$filter = getParameter('filter');

// Sanitize inputs
if (!empty($column)) $column = preg_replace('/[^a-zA-Z0-9_]/', '', $column);
if (!empty($direction)) $direction = $direction === 'asc' ? 'asc' : 'desc';
if (!empty($filter)) $filter = trim($filter);

$fields = 'c.id, c.name, c.rut, c.isDenied, c.deniedNote, c.address, c.created';
$tables = 'company c';
$where = 'c.active = ?';
$params = array(1);

if (!empty($type) && $type == "denied") {
    $where .= ' and c.isDenied = ?';
    $params[] = 1;
}

// Create order expression
$order = 'order by c.created desc';
if (!empty($column) && !empty($direction)) {
    $allowed_columns = ['id', 'name', 'rut', 'address', 'created', 'isDenied'];
    if (in_array($column, $allowed_columns)) {
        $order = "order by c.$column $direction";
    }
}

// Create filter expression
if (!empty($filter)) {
    $where .= ' and (c.rut like ? or c.name like ? or c.address like ?)';
    $filter_expr = "%$filter%";
    $params = array_merge($params, array($filter_expr, $filter_expr, $filter_expr));
}

// Row start for limit expression
$offset = $page * $size;

$con = new SimpleDb();
$sql = "select $fields from $tables where $where $order limit $offset, $size";
$companies = $con->get_array($sql, $params);

$result = array();
foreach($companies as $company) {
    $row = array();
    $row[] = $company['id'];
    $row[] = $company['rut'];
    $row[] = $company['name'];
    $row[] = $company['address'];
    $row[] = date('Y-m-d H:i:s', strtotime($company['created']));
    $row[] = $company['isDenied'];
    $row[] = $company['deniedNote'];
    $result[] = $row;
}

// Count all matching rows
$sql = "select count(1) from $tables where $where";
$total = (int)$con->get_one($sql, $params);

$response = array('data' => $result, 'total' => $total);
echo json_encode($response);

?>

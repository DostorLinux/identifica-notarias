
<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/api.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';

portal_auth_admin();

$request = json_from_post_body();
$column    = sanitize(api_get($request, 'column'));
$direction = sanitize(api_get($request, 'direction'));
$page      = (int)api_get_number($request, 'page')-1;
$size      = (int)api_get_number($request, 'size');
$filter    = sanitize(api_get($request, 'filter'));
$scope     = sanitize(api_get($request, 'scope'));

$fields = 'wi.id, wi.worker_id, wi.company, wi.description, wi.init, wi.end, 
          wi.event_duration, wi.created, wi.updated';
$tables = 'worker_invitation wi';

$params = array();
$where = array();

// Handle scope filtering for ADMIN users
if (!is_admin()) {
        $where[] = 'wi.worker_id = ?';
        $params[] = get_auth_id(); // Assuming this function exists to get current user ID

}else{
    if ($scope === 'me') {
        $where[] = 'wi.worker_id = ?';
        $params[] = get_auth_id(); // Assuming this function exists to get current user ID
    }
}

// create order expression
$order = 'order by wi.created desc'; // default order
if (!empty($column) && !empty($direction)) {
    $direction = $direction == 'asc' ? 'asc' : 'desc';
    $order = "order by wi.$column $direction";
}

// create filter expression
if (!empty($filter)) {
    $filter_expr = "%$filter%";
    $where[] = "(wi.company LIKE ? OR wi.description LIKE ?)";
    $params = array_merge($params, array($filter_expr, $filter_expr));
}

// Combine where clauses
$where_clause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

// row start for limit expression
$offset = $page * $size;

$con = new SimpleDb();
$sql = "SELECT $fields FROM $tables $where_clause $order LIMIT $offset, $size";
$invitations = $con->get_array($sql, $params);
$result = array();

foreach($invitations as $invitation) {
    $result[] = array(
        'id' => $invitation['id'],
        'worker_id' => $invitation['worker_id'],
        'company' => $invitation['company'],
        'description' => $invitation['description'],
        'init' => $invitation['init'],
        'end' => $invitation['end'],
        'event_duration' => $invitation['event_duration'],
        'created' => $invitation['created'],
        'updated' => $invitation['updated']
    );
}

// count all matching rows
$sql = "SELECT COUNT(1) FROM $tables $where_clause";
$total = (int)$con->get_one($sql, $params);

$response = array('data' => $result, 'total' => $total);
echo json_encode($response);
?>
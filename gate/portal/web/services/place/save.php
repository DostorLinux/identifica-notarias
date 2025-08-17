<?php

    include_once __DIR__ . '/../../include/config.php';
    include_once __DIR__ . '/../../include/core.php';
    include_once __DIR__ . '/../../include/simpledb.php';
    include_once __DIR__ . '/../../include/gate.php';
    include_once __DIR__ . '/../../include/portal.php';

    portal_auth_admin();

    $con = new SimpleDb();

    $id    = getPostParameter('id');
    $name   = getPostParameter('name');
    $description   = getPostParameter('description');

    $params = array($name, $description);
    if (empty($id)) {
        $audit_type = AUDIT_PLACE_CREATE;
        $sql = 'insert into place (name,description) values (?,?)';
        $con->execute($sql, $params);
        $id = $con->get_last_id();
    } else {
        $audit_type = AUDIT_PLACE_MODIFY;
        $sql = 'update place set name = ?, description = ? where id = ?';
        $params[] = $id;
        $con->execute($sql, $params);
    }
    gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));
    $result = array('id' => $id);
    echo json_encode($result);

?>

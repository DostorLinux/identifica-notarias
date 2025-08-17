<?php

include_once __DIR__ . '/../include/config.php';
include_once __DIR__ . '/../include/core.php';
include_once __DIR__ . '/../include/simpledb.php';
include_once __DIR__ . '/../include/gate.php';
include_once __DIR__ . '/../include/portal.php';



portal_auth();

$id = getPostParameter('id');
if ($id != $auth_user_id) portal_check_admin();

$con = new SimpleDb();

$doc_id = getPostParameter('doc_id');
$sec_id = getPostParameter('sec_id');
$login = getPostParameter('login');
$first_name = getPostParameter('first_name');
$last_name = getPostParameter('last_name');
$email = getPostParameter('email');
$role = getPostParameter('role');
$user_type=getPostParameter('user_type');
if ($role=="super_admin"){
    $role="admin";
}
$active = getPostParameter('active');
$groups = getPostParameter('groups');
$password = getPostParameter('password');
$pin = getPostParameter('pin');
$nationality = getPostParameter("nationality");
$placeIds = getPostParameter('placeIds');

//hasExpiratio
//expirationDate
$expirationDate = getPostParameter('expirationDate');
$hasExpiration = getPostParameter('hasExpiration');
if($hasExpiration==null){
    $hasExpiration = 0;
    $expirationDate = null;
}else{
    if ($hasExpiration == 1) {
        $dateObject = DateTime::createFromFormat('d/m/Y', $expirationDate);
// Format the DateTime object to the desired output format
        $expirationDate = $dateObject->format('Y-m-d');
    }else{
        $expirationDate = null;
    }
}


//
if ($auth_user_role != PROFILE_ADMIN && $auth_user_role != PROFILE_SUPER_ADMIN){
    $role = $auth_user_role;
}


portal_check_mandatory($role, 'Rol');

//Se quita pues los conductores no tienen email.
//portal_check_email($email, 'Email');

// check for existing users with the same doc_id
if (!empty($doc_id)) {
    $user_info = gate_find_user_by_doc_id($con, $doc_id, $id);
    if (!empty($user_info)) {
        portal_abort_existing_doc_id($user_info);
    }
}

// role changes require that users enter their password
if (!empty($id)) {
    $sql = 'select role from user where id = ?';
    $old_role = $con->get_one($sql, $id);
    if ($old_role != $role) {
        if (!portal_validate_user_password($con, $auth_user_name, $password)) {
            abort('PASSWORD_REQUIRED');
        }
    }
}

portal_check_max_active_users($con, $active);

$con->begin();

$params = array($doc_id, $sec_id, $login, $first_name, $last_name, $email, $role, $active, $nationality);
if (empty($id)) {
    if (empty($password)) {
        $hash = null;
    } else {
        $hash = gate_hash_password($password);
    }
    $params[]=$pin;
    $params[] = $hash;
    $audit_type = AUDIT_USER_CREATE;
    $uuid = guidv4();
    $params[] = $uuid;
    $params[] = $hasExpiration;
    $params[] = $expirationDate;
    $params[] = $user_type;
    $sql = 'insert into user (doc_id, sec_id, username, first_name, last_name, email, role, active,nationality, pin, 
                  password, pub_id, has_expiration, expiration_date, user_type) ' .
        'values (?, ?, ?, ?, ?, ? ,?, ?, ?, ?, ?,?,?,?,?) ';
    $con->execute($sql, $params);
    $id = $con->get_last_id();
} else {
    $audit_type = AUDIT_USER_MODIFY;

    if (empty($pin)) {
        $sql = 'update user set doc_id = ?, sec_id = ?, username = ?, first_name = ?' .
            ', last_name = ?, email = ?, role = ?, active = ?, nationality=?,updated = now() , has_expiration = ?, expiration_date = ?, user_type = ? ';
    } else {
        $sql = 'update user set doc_id = ?, sec_id = ?, username = ?, first_name = ?' .
            ', last_name = ?, email = ?, role = ?, active = ?, nationality=?, pin=?, updated = now()  , has_expiration = ?, expiration_date = ? , user_type = ? ';
        $params[] = $pin;
    }
    $params[] = $hasExpiration;
    $params[] = $expirationDate;
    $params[] = $user_type;

    if (!empty($password)) {
        $sql = $sql.", password=?";
        $hash = gate_hash_password($password);
        $params[] = $hash;
    }

    $sql = $sql." where id = ?";
    $params[] = $id;

    $con->execute($sql, $params);
}

if (empty($doc_id)) {
    $doc_id = gate_create_user_id($id);
    $sql = 'update user set doc_id = ? where id = ?';
    $con->execute($sql, array($doc_id, $id));
}


if (!empty($groups)) {
    $sql = 'delete from user_group_user where userId = ?';
    $con->execute($sql, $id);

    $groupIds = explode(',', $groups);
    $sql = 'insert into user_group_user (userId, userGroupId) values (?, ?)';
    foreach ($groupIds as $groupId) {
        $con->execute($sql, array($id, trim($groupId)));
    }
}

if (!empty($placeIds)) {
    $sql = 'delete from place_user where userId = ?';
    $con->execute($sql, $id);
    $placeIds = explode(',', $placeIds);
    $sql = 'insert into place_user (userId, placeId) values (?, ?)';
    foreach ($placeIds as $placeId) {
        $con->execute($sql, array($id, trim($placeId)));
    }
}

//device
$devices = getPostParameter('devicesIds');
if (!empty($devices)) {
    $sql = 'delete from user_device where user_id = ?';
    $con->execute($sql, $id);
    $devices = explode(',', $devices);
    $sql = 'insert into user_device (user_id, device_id) values (?, ?)';
    foreach ($devices as $deviceId) {
        $con->execute($sql, array($id, trim($deviceId)));
    }
}

gate_save_audit_log($con, $auth_user_id, $audit_type, json_encode($params));
$con->commit();
$result = array('id' => $id);
echo json_encode($result);

?>
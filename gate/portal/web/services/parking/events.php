<?php
include_once __DIR__ . '/../../include/config.php';
include_once __DIR__ . '/../../include/core.php';
include_once __DIR__ . '/../../include/simpledb.php';
include_once __DIR__ . '/../../include/gate.php';
include_once __DIR__ . '/../../include/portal.php';


//recibe patente, rut, event.
$plate    = getPostParameter('plate');
$rut      = getPostParameter('rut');
$event     = getPostParameter('event');
$hash    = getPostParameter('hash');

$con = new SimpleDb();

if (!isset($rut)){
    $rut='';
}
////Log Section:
///
error_log("\n=====================" );
error_log('event: ' . $event);
error_log('plate: ' . $plate);
error_log('rut: ' . $rut);
error_log('hash: ' . $hash);
error_log("=====================\n" );

///End Log Section

if ($event == 'INGRESO') {
    $sql = 'select a.id, a.company, 
               u.first_name, u.last_name, 
                a.plate,
                u.doc_id from allow_list a, user u where 
                                         plate = ? and 
                                         (a.access_day = CURDATE() OR a.access_day = CURDATE() - INTERVAL 1 DAY) and 
                                         a.user_id = u.id  order by a.access_day desc 
                                        ';
    //read datos from allow_list
    $allow_register = $con->get_row($sql, array($plate));
    $exists = !empty($allow_register);
    if ($exists) {
        $sql = "select 1 from parking_register where plate = ? and status not in ('EXIT', 'EXIT_PORT') ";
        $exists = $con->exists($sql, array($plate));
        if ($exists) {
            abort('La patente cuenta con un flujo abierto');
            return;
        }
        $sql = 'insert into parking_register (allow_list_id, status, doc_id, plate, company, enter_date) values (?, ?, ?,?,?, NOW())';
        $params = array($allow_register['id'], 'IN_PARKING', $rut, $plate, $allow_register['company']);
        $con->execute($sql, $params);

        error_log("DEBUG: Ingreso de patente $plate, rut $rut, evento $event");
        $result = array('success' => true, 'data'=> array("first_name" => $allow_register['first_name'],
            "last_name" => $allow_register['last_name'],
            "company" => $allow_register['company'],
            "plate" => $allow_register['plate'],
            "doc_id" => $allow_register['doc_id']));
        echo json_encode($result);
        return;


    }
    else{
        abort('No se encuentra en la lista de acceso');
        return;
    }
} else if ($event == 'TRANSITO_PUERTO') {
    $sql = 'select 1 from parking_register where plate = ?  and status = ? ';
    $exists = $con->exists($sql, array($plate, 'IN_PARKING'));
    if ($exists) {
        $sql = 'select hash from parking_register where plate = ?  and status = ? order by enter_date desc limit 1';
        $hash = $con->get_one($sql, array($plate,'IN_PARKING'));
        if (empty($hash)) {
            $hash = guidv4();
        }

        $sql = 'update parking_register set status = ?,hash=?, in_transit_date = now(), has_notification=0 where plate = ? and status = ? ';
        $params = array('IN_TRANSIT', $hash,$plate, 'IN_PARKING');
        $con->execute($sql, $params);
        $result = array('hash' => $hash);
        echo json_encode($result);
        return;
    }else{
        abort('No se encuentra en la lista de acceso');
        return ;
    }
}else if( $event == 'RECOVER_HASH_PLATE'){
    //recover hash
    $sql = 'select hash from parking_register where plate = ? order by enter_date desc limit 1';
    $hash = $con->get_one($sql, array($plate));
    if (!empty($hash)) {
        $result = array('hash' => $hash);
        echo json_encode($result);
        return;
    }else{
        abort('No se encuentra en la lista de acceso');
        return ;
    }
}
else if( $event == 'RECOVER_HASH_DOCID'){
  //recover hash
    $sql = 'select hash from parking_register where doc_id = ? order by enter_date desc limit 1 ';
    $hash = $con->get_one($sql, array($rut));
    if (!empty($hash)) {
        $result = array('hash' => $hash);
        echo json_encode($result);
        return;
    }else{
        abort('No se encuentra en la lista de acceso');
        return ;
    }
}else if ($event == 'PORT') {
    $sql = 'select 1 from parking_register where hash = ? and status = ?';
    $exists = $con->exists($sql, array($hash, 'IN_TRANSIT'));
    if ($exists) {
        $sql = 'update parking_register set status = ?, in_port_date=now() where hash = ?';
        $params = array('IN_PORT', $hash);
        $con->execute($sql, $params);

        $sql = 'select a.id, a.company, 
               u.first_name, u.last_name, 
                p.plate as plate,
                u.doc_id from allow_list a, user u, 
                              parking_register p
                              where 
                                         p.allow_list_id = a.id and
                                         a.user_id = u.id and 
                                         p.hash = ? ';

        //read datos from allow_list
        $allow_register = $con->get_row($sql, array($hash));

        $result = array('success' => true, 'data'=> array("first_name" => $allow_register['first_name'],
            "last_name" => $allow_register['last_name'],
            "company" => $allow_register['company'],
            "plate" => $allow_register['plate'],
            "doc_id" => $allow_register['doc_id']));
        echo json_encode($result);
        return;
    }else{
        abort('No se encuentra en la lista de acceso');
    }
} else if($event == 'EXIT_PORT_HASH'){

    $sql = 'select 1 from parking_register where hash = ? and status = ?';
    $exists = $con->exists($sql, array($hash, 'IN_PORT'));
    if ($exists) {
        $sql = 'update parking_register set status = ?, out_port_date=now() where hash = ?';
        $params = array('EXIT_PORT', $hash);
        $con->execute($sql, $params);
        echo json_success();
        return;
    }else{
        abort('No se encuentra en la lista de acceso');
        return ;
    }

}else if( $event =='EXIT_PORT_PLATE'){
    $sql = 'select 1 from parking_register where plate = ? and status = ? ';
    $exists = $con->exists($sql, array($plate, 'IN_PORT'));
    if ($exists) {
        $sql = 'update parking_register set status = ?, out_port_date=now() where plate = ? and status = ?';
        $params = array('EXIT_PORT', $plate, 'IN_PORT');
        $con->execute($sql, $params);
        echo json_success();
        return;
    }else{
        abort('No se encuentra en la lista de acceso');
        return ;
    }
}

else if($event == 'EXIT'){
    $sql = 'select 1 from parking_register where plate = ? and status = ? ';
    $exists = $con->exists($sql, array($plate, 'IN_PARKING'));
    if ($exists) {
        $sql = 'update parking_register set status = ?, in_transit_date = now() where plate = ? and status = ?';
        $params = array('EXIT', $plate,  'IN_PARKING');
        $con->execute($sql, $params);
        echo json_success();
        return;
    }else{
        abort('No se encuentra en la lista de acceso');
        return ;
    }
}

//si el evento es ingreso:
    //Comprueba si existe en allow_list.
    //Si existe, se guarda en parking_register (estado IN_PARKING).
//Si el evento es salida:
    //Comprueba si existe en parking_register, con el mismo rut y patente y estado IN_PARKING.
    //Si existe, se actualiza el estado a IN_TRANSIT.
    //Genero un UUID en el hash y lo retorno.
//registro IN_PORT:
    //Comprueba si existe en parking_register, con HASH IN_TRANSIT.
    //Si existe, se actualiza el estado a IN_PORT.
    //Se guarda el hash en el campo hash.



?>
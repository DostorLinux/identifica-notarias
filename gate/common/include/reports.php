<?php

function reports_call($service, $request = array()) {
    global $reports_url;
    global $reports_user;
    global $reports_pass;

    $headers = array('Authorization' => 'Basic '. base64_encode("$reports_user:$reports_pass"));
    $url = "$reports_url/$service";

    return http_post_json($url, $request, $headers);
}

function reports_list_users() {
    return reports_call('clockin-users');
}

function reports_list_types() {
    return reports_call('clockin-type');
}

function reports_event_save($doc_id, $type, $lat, $lng) {
    global $reports_event_type_enter;
    global $reports_event_type_exit;

    $event_type = $type == 'enter' ? $reports_event_type_enter : $reports_event_type_exit;
    $request = array(
        'user_id' => $doc_id,
        'clockintype' => $event_type,
        'lat' => $lat,
        'lon' => $lng,
        'comentario' => ''
    );
    reports_call('clockin-data', $request);
}

?>
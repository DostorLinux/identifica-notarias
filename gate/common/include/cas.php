<?php

function cas_fix_rut($rut) {
    $rut = "0000".strtoupper($rut);
    return substr($rut, -10);
}

function cas_save_event($rut, $entry, $timestamp) {
    global $cas_enabled;
    global $cas_wsdl_url;
    global $cas_user;
    global $cas_password;
    global $url_face_match;

    if (!$cas_enabled) return;

    $url = "$url_face_match/cas_post";

    $entry_int = $entry == 'enter' ? 1 : 0;
    $fixed_rut = cas_fix_rut($rut);

    $request = array(
        'wsdl_url' => $cas_wsdl_url,
        'user'     => $cas_user,
        'password' => $cas_password,
        'rut'   => $fixed_rut,
        'entry' => $entry_int,
        'ts'    => $timestamp
    );

    try {
        http_post_json($url, $request);
    } catch (Exception $e) {
        $msg = 'Error on cas_save_event: '.$e->getMessage();
        api_abort('INTERNAL_ERROR', $msg);
    }
}

?>
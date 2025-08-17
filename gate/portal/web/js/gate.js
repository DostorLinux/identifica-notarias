var translation_roles = [
    'admin', 'Administrador',
    'user', 'Usuario'
];

var translation_entries = [
    'none', '',
    'enter', 'Entrada',
    'exit',  'Salida',
    'enter_break', 'Ingreso descanso',
    'exit_break', 'Salida descanso'
];


function translate_role(role) {
    return translate(translation_roles, role);
}

function translate_entry(entry) {
    return translate(translation_entries, entry);
}

function build_options_role(select) {
    build_options(translation_roles, select);
}

function format_date(timestamp) {
    var d = new Date(timestamp * 1000);
    return d.toLocaleString('es-CL', { hour12:false });
}

function onInit() {
	$('#txtUsername').focus();
	$('#btnLogin').click(onLogin);
}

function onLogin() {
	var user = $('#txtUsername').val();
	var pass = $('#txtPassword').val();
	
	$('#error').text('');
	$('#error').hide();
	ajaxPost('services/login.php', {user: user, pass: pass}, onLoginSuccess, onLoginError);
}

function onLoginSuccess() {
	redirect('index.php');
}

function onLoginError(msg) {
	if (msg == 'UNKNOWN_USER') msg = 'Usuario o contraseña inválida';
	$('#error').text(msg);
	$('#error').fadeIn();
}

$(document).ready(onInit);
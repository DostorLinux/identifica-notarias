var userModal;
var usersTable;
var areasTable;
var userErrorPanel;
var areaErrorPanel;
var user;
var area;

var user_editor_ids = ['doc_id', 'sec_id', 'login', 'first_name', 'last_name', 'email']
var user_editor_values;

var area_editor_ids = ['lat', 'lng', 'radio']
var area_editor_values;

function onInit() {
	usersTable = $('#users').DataTable({
		"ajax": 'services/getUsers.php',
		"language": {"url": "//cdn.datatables.net/plug-ins/1.11.4/i18n/es-cl.json"}, 
		"columnDefs": [
	          {
	            "targets": 6,
	            "render": function(data, type, row, meta){
	            	return translate_role(data);
	            }
	          },
	          {
	            "targets": -1,
	            "orderable": false,
	            "render": function(data, type, row, meta){
	            	var rowId = row[0];
	                return '<button type="button" class="btn btn-primary btn-sm" onClick="openUser(\'' + rowId + '\')">Ver detalle</button>';
	            }
	          }]
	});

	eventsTable = $('#events').DataTable({
		"ajax": 'services/getEvents.php',
		"language": {"url": "//cdn.datatables.net/plug-ins/1.11.4/i18n/es-cl.json"},
		"columnDefs": [
	          {
	            "targets": 3,
	            "render": function(data, type, row, meta){
	            	return translate_entry(data);
	            }
	          },
	          {
	            "targets": 4,
	            "render": function(data, type, row, meta){
	            	return format_date(data);
	            }
	          },
	          {
	            "targets": 5,
	            "className": "dt-body-right"
	          },
	          {
	            "targets": -1,
	            "orderable": false,
	            "render": function(data, type, row, meta){
	            	var lat = row[6];
	            	var lng = row[7];
	            	var link = 'https://maps.google.com/?q=' + lat + ',' + lng;
	                return '<a href="' + link + '" target="_new" class="btn btn-primary btn-sm" role="button">Ver mapa</a>';
	            }
	          }]
	});

	areasTable = $('#areas').DataTable({
		"ajax": 'services/getAreas.php',
		"language": {"url": "//cdn.datatables.net/plug-ins/1.11.4/i18n/es-cl.json"},
		"columnDefs": [
	          {
	            "targets": [1, 2, 3],
	            "className": "dt-body-right"
	          },
	          {
	            "targets": -2,
	            "orderable": false,
	            "render": function(data, type, row, meta){
	            	var lat = row[1];
	            	var lng = row[2];
	            	var link = 'https://maps.google.com/?q=' + lat + ',' + lng;
	                return '<a href="' + link + '" target="_new" class="btn btn-primary btn-sm" role="button">Ver mapa</a>';
	            }
	          },
	          {
	            "targets": -1,
	            "orderable": false,
	            "render": function(data, type, row, meta){
	            	var rowId = row[0];
	                return '<button type="button" class="btn btn-primary btn-sm" onClick="openArea(\'' + rowId + '\')">Ver detalle</button>';
	            }
	          }],
        "dom" : "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
                "<'row'<'col-sm-12'tr>>" +
                "<'row'<'col-sm-5'i><'col-sm-2'B><'col-sm-5'p>>",
        "buttons": [
                    {
                        text: 'Agregar área...',
                        action: onCreateArea,
                        className: "btn btn-primary btn-sm"
                    }
                ],
        "initComplete" : function() {
            $('#areas_wrapper button.dt-button').removeClass('dt-button');
        }
	});

	build_options_role('#user_role_editor');
	
	userModal = $('#user-panel');
	areaModal = $('#area-panel');
	userErrorPanel = $('#user_editor_error');
	areaErrorPanel = $('#area_editor_error');

	$('#btnUserEdit').click(onUserEdit);
	$('#btnUserEditCancel').click(onUserEditCancel);
	$('#btnUserEditSave').click(onUserEditSave);

	$('#btnAreaEdit').click(onAreaEdit);
	$('#btnAreaEditCancel').click(onAreaEditCancel);
	$('#btnAreaEditSave').click(onAreaEditSave);
	$('#lnkAreaDelete').click(onAreaDelete);

    $('.nav-tabs button').on('shown.bs.tab', function(event){
        var active = event.target.id;
        var activateCamera = active == 'detect-tab';
        if (activateCamera) {
            startCamera();
        } else {
            stopCamera();
        }
    });

	onDetectInit();
}

function openUser(id) {
	ajaxGet('services/getUser.php', {id: id}, onGetUserCallback);
}

function openArea(id) {
	ajaxGet('services/getArea.php', {id: id}, onGetAreaCallback);
}

function onGetUserCallback(response) {
	user = response.user;
	user_editor_values = [user.doc_id, user.sec_id, user.username, user.first_name, user.last_name, user.email];
	for(var i=0; i<user_editor_ids.length; i++) {
	    $('#user_' + user_editor_ids[i]).text(user_editor_values[i]);
	}

    var user_name = '';
    if (user.first_name != null) user_name = user.first_name;
    if (user.last_name != null) user_name += ' ' + user.last_name;

	$('#user_panel_title').text('Usuario ' + user_name.trim());
	$('#user_role').text(translate_role(user.role));

	var user_image_url = 'services/getPicture.php?id=' + user.doc_id;
	$('#user_face').attr('src', user_image_url);

    showUserPanelView();
	userModal.modal('show');
}

function onGetAreaCallback(response) {
	area = response.area;
	area_editor_values = [area.lat, area.lng, area.radio];
	for(var i=0; i<area_editor_ids.length; i++) {
	    $('#area_' + area_editor_ids[i]).text(area_editor_values[i]);
	}

	$('#area_panel_title').text('Area #' + area.id);

    showAreaPanelView();
	areaModal.modal('show');
}

function onCreateArea() {
    area = {id: 0};
    area_editor_values = ['', '', ''];

    showAreaPanelView();
	areaModal.modal('show');

    onAreaEdit();
}


function onUserEdit() {
    updateUserEditorError('');

	for(var i=0; i<user_editor_ids.length; i++) {
	    $('#user_' + user_editor_ids[i] + '_editor').val(user_editor_values[i]);
	}

    $('#user_role_editor').val(user.role);

    userErrorPanel.hide();
    $('#user_panel_footer_view').hide();
    $('#user_panel_footer_edit').show();
    $('#user-panel-content .editor_view').hide();
    $('#user-panel-content .editor').show();
    $('#user_face_upload_panel').show();
}

function onAreaEdit() {
    updateAreaEditorError('');

	for(var i=0; i<area_editor_ids.length; i++) {
	    $('#area_' + area_editor_ids[i] + '_editor').val(area_editor_values[i]);
	}

    areaErrorPanel.hide();
    $('#area_panel_footer_view').hide();
    $('#area_panel_footer_edit').show();
    $('#area-panel-content .editor_view').hide();
    $('#area-panel-content .editor').show();
}

function onAreaEditCancel() {
    if (area.id == 0) {
        areaModal.modal('hide');
    } else {
        showAreaPanelView();
    }
}

function onUserEditCancel() {
    showUserPanelView();
}

function showUserPanelView() {
    updateUserEditorError('');
    $('#user_panel_footer_view').show();
    $('#user_panel_footer_edit').hide();
    $('#user-panel-content .editor_view').show();
    $('#user-panel-content .editor').hide();
    $('#user_face_upload_panel').hide();
}

function showAreaPanelView() {
    updateAreaEditorError('');
    $('#area_panel_footer_view').show();
    $('#area_panel_footer_edit').hide();
    $('#area-panel-content .editor_view').show();
    $('#area-panel-content .editor').hide();
}

function onUserEditSave() {
    updateUserEditorError('');

    var h = {};

    for(var i=0; i<user_editor_ids.length; i++) {
        var id = user_editor_ids[i];
        h[id] = $('#user_' + user_editor_ids[i] + '_editor').val();
    }

    h['id']   = user.id;
    h['role'] = $('#user_role_editor option:selected').val();

    ajaxPost('services/saveUser.php', h, onUserSavedCallback, onUserSaveError);
}

function onUserSaveError(error) {
    updateUserEditorError(error);
}

function onAreaEditSave() {
    updateAreaEditorError('');

    var h = {};

    for(var i=0; i<area_editor_ids.length; i++) {
        var id = area_editor_ids[i];
        h[id] = $('#area_' + id + '_editor').val();
    }

    h['id']   = area.id;

    ajaxPost('services/saveArea.php', h, onAreaSavedCallback, onAreaSaveError);
}

function onAreaSaveError(error) {
    updateAreaEditorError(error);
}

function updateUserEditorError(error) {
    updateEditorError(userErrorPanel, error);
}

function updateAreaEditorError(error) {
    updateEditorError(areaErrorPanel, error);
}

function updateEditorError(errorPanel, error) {
    if (error.length != 0) {
        errorPanel.html(error);
        errorPanel.show();
    } else {
        errorPanel.html('');
        errorPanel.hide();
    }
}

function onUserSavedCallback(result) {
    usersTable.ajax.reload();
    userModal.modal('hide');
}

function onAreaSavedCallback(result) {
    areasTable.ajax.reload();
    areaModal.modal('hide');
}

function onAreaDelete() {
    areaModal.modal('hide');
    var details =
        'Área #' + area.id +
        ' de latitud:' + area.lat +
        ', longitud:' +  area.lng +
        ', radio:' + area.radio;

    bootbox.confirm('Confirma eliminar ' + details + '?', function(confirmed) {
        if (confirmed) doAreaDelete(area.id);
        else areaModal.modal('show');
    });
}

function doAreaDelete() {
    var h = {id: area.id};
    ajaxPost('services/delArea.php', h, function(){
        areasTable.ajax.reload();
    });
}

function onUpdateImage(event) {
    var reader = new FileReader();
    reader.onload = function(){
      var output = document.getElementById('user_face');
      output.src = reader.result;
    };
    reader.readAsDataURL(event.target.files[0]);
  };

$(document).ready(onInit);
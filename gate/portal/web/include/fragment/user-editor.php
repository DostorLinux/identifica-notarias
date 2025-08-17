<div class="modal" tabindex="-1" id="user-panel">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="user_panel_title"></h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="user-panel-content">
                <div id="user-picture">
                    <img id="user_face" />
                    <div id="user_face_upload_panel">
                        <label class="form-label" for="customFile"></label>
                        <input type="file" accept="image/jpeg" class="form-control" id="customFile" onchange="onUpdateImage(event)"/>
                    </div>
                </div>
                <div id="user-data">
                    <div class="user_section">
                        <span class="label">Id documento:</span>
                        <span  id="user_doc_id" class="editor_view"></span>
                        <input id="user_doc_id_editor" type="text" class="editor"></span>
                    </div>
                    <div class="user_section">
                        <span class="label">Id secundario:</span>
                        <span  id="user_sec_id" class="editor_view"></span>
                        <input id="user_sec_id_editor" type="text" class="editor"></span>
                    </div>
                    <div class="user_section">
                        <span class="label">Login:</span>
                        <span  id="user_login" class="editor_view"></span>
                        <input id="user_login_editor" type="text" class="editor"></span>
                    </div>
                    <div class="user_section">
                        <span class="label">Nombres:</span>
                        <span  id="user_first_name" class="editor_view"></span>
                        <input id="user_first_name_editor" type="text" class="editor"></span>
                    </div>
                    <div class="user_section">
                        <span class="label">Apellidos: </span>
                        <span  id="user_last_name" class="editor_view"></span>
                        <input id="user_last_name_editor" type="text" class="editor"></span>
                    </div>
                    <div class="user_section">
                        <span class="label">Email:</span>
                        <span  id="user_email" class="editor_view"></span>
                        <input id="user_email_editor" type="text" class="editor"></span>
                    </div>
                    <div class="user_section">
                        <span class="label">Rol:</span>
                        <span id="user_role" class="editor_view"></span>
                        <select id="user_role_editor" class="editor"></select>
                    </div>
                </div>
                <br clear="all" />
            </div>
            <div class="error" id="user_editor_error"></div>
            <div class="modal-footer" id="user_panel_footer_view">
                <button type="button" class="btn btn-secondary" id="btnUserEdit">Editar</button>
                <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Cerrar</button>
            </div>
            <div class="modal-footer" id="user_panel_footer_edit">
                <button type="button" class="btn btn-secondary" id="btnUserEditCancel">Cancelar</button>
                <button type="button" class="btn btn-primary" id="btnUserEditSave">Guardar</button>
            </div>
        </div>
    </div>
</div>
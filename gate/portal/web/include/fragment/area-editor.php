<div class="modal" tabindex="-1" id="area-panel">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="area_panel_title"></h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="area-panel-content">
                <div id="area-data">
                    <div class="area_section">
                        <span class="label">Latitud:</span>
                        <span  id="area_lat" class="editor_view"></span>
                        <input id="area_lat_editor" type="text" class="editor"></span>
                    </div>
                    <div class="area_section">
                        <span class="label">Longitud:</span>
                        <span  id="area_lng" class="editor_view"></span>
                        <input id="area_lng_editor" type="text" class="editor"></span>
                    </div>
                    <div class="area_section">
                        <span class="label">Radio:</span>
                        <span  id="area_radio" class="editor_view"></span>
                        <input id="area_radio_editor" type="text" class="editor"></span>
                    </div>
                </div>
                <br clear="all" />
            </div>
            <div class="error" id="area_editor_error"></div>
            <div class="modal-footer" id="area_panel_footer_view">
                <a id="lnkAreaDelete" href="#" class="link-danger">Eliminar</a>
                <button type="button" class="btn btn-secondary" id="btnAreaEdit">Editar</button>
                <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Cerrar</button>
            </div>
            <div class="modal-footer" id="area_panel_footer_edit">
                <button type="button" class="btn btn-secondary" id="btnAreaEditCancel">Cancelar</button>
                <button type="button" class="btn btn-primary" id="btnAreaEditSave">Guardar</button>
            </div>
        </div>
    </div>
</div>
    <div class="center-content page-container">
        <div style="position: relative" class="margin">
            <video onloadedmetadata="onPlay(this)" id="inputVideo" autoplay muted playsinline></video>
            <canvas id="overlay"></canvas>
            <canvas id="shot"></canvas>
        </div>
        <div class="container actions" id="action_buttons">
            <button id="btnEnter" class="btn btn-success btn-sm">Registrar Entrada</button>
            <button id="btnExit" class="btn btn-danger btn-sm">Registrar Salida</button>
        </div>
        <div class="message" id="message"></div>
        <div class="error_message" id="error_message"></div>
        <div class="toast_message" id="toast_message"></div>
    </div>

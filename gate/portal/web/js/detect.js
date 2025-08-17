var coords;

function onDetectInit() {
    $('#btnEnter').click(onEnterPressed);
    $('#btnExit').click(onExitPressed);
    navigator.geolocation.getCurrentPosition(function(position){
        coords = position.coords;
    });

    initFaceDetectionControls()
    // run()
}

function onEnterPressed() {
    sendEvent('enter');
}

function onExitPressed() {
    sendEvent('exit');
}

function sendEvent(type) {
    $('#action_buttons').hide();

    var msg = 'Registrando evento de ';
    msg += type == 'enter' ? 'Ingreso' : 'Salida';
    showMessage(msg);

    var image = captureShot();
    var h = {
        image: image,
        lat: coords.latitude,
        lng: coords.longitude,
        type: type,
    };

    // just give some time to display the message
    setTimeout(function() {
        ajaxPost('services/postEvent.php', h, onPostEventCallback, onPostEventErrorCallback);
    }, 2000);
}

function onPostEventCallback(result) {
    hideMessage();

    var msg = 'Su ingreso ha sido registrado';
    if (result.type != 'enter') {
        msg = 'Su salida ha sido registrada';
    }

    var d = new Date(result.time * 1000);
    msg = msg + ' a las ' + d.toLocaleTimeString();

    toastMessage(msg, onPostComplete);
}

function onPostEventErrorCallback(error) {
    hideMessage();
    var msg = error;
    if (error == 'CANNOT_IDENTIFY') {
        msg = '<b>No se pudo reconocer su rostro<br />Intente nuevamente por favor</b>';
    } else if (error == 'EMPTY_IMAGE') {
        msg = '<b>La imagen no pudo ser enviada<br />Intente nuevamente por favor</b>';
    } else if (error == 'INVALID_BASE64_IMAGE') {
        msg = '<b>La imagen no pudo ser codificada en su navegador<br />Intente nuevamente por favor</b>';
    } else if (error == 'TOO_MANY_FACES') {
        msg = '<b>Se ha detectado más de un rostro en la cámara<br />Intente nuevamente por favor</b>';
    } else if (error == 'NO_FACE_DETECTED') {
        msg = '<b>No se ha detectado un rostro en la cámara<br />Intente nuevamente por favor</b>';
    }
    showError(msg, onPostComplete);
}

function onPostComplete() {
    $('#action_buttons').show();
}

function captureShot() {
    var canvas = document.querySelector('#shot');
    var video  = document.querySelector('#inputVideo');
    var width = video.videoWidth;
    var height = video.videoHeight;

    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);

    canvas.getContext('2d').drawImage(video, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg');
}

function showMessage(message) {
    var panel = $('#message');
    panel.html(message);
    panel.show();
}

function hideMessage() {
    var panel = $('#message');
    panel.hide();
}

function toastMessage(message, onCompleteCallback) {
    var panel = $('#toast_message');
    toast(panel, message, onCompleteCallback);
}

function showError(message, onCompleteCallback) {
    var panel = $('#error_message');
    toast(panel, message, onCompleteCallback);
}

function toast(panel, message, onCompleteCallback) {
    panel.html(message);
    panel.fadeIn(800);
    setTimeout(function(){
        panel.fadeOut(1000, onCompleteCallback);
    }, 5000);
}

async function onPlay() {
    const videoEl = $('#inputVideo').get(0)

    if(videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded())
    return setTimeout(() => onPlay())

    const options = getFaceDetectorOptions()
    const result = await faceapi.detectSingleFace(videoEl, options)

    if (result) {
        const canvas = $('#overlay').get(0)
        const dims = faceapi.matchDimensions(canvas, videoEl, true)
        faceapi.draw.drawDetections(canvas, faceapi.resizeResults(result, dims))
    }

    setTimeout(() => onPlay())
}

async function startCamera() {
    // load face detection model
    await changeFaceDetector(TINY_FACE_DETECTOR)
    changeInputSize(128)

    // try to access users webcam and stream the images
    // to the video element
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} })
    const videoEl = $('#inputVideo').get(0)
    videoEl.srcObject = stream
}

async function stopCamera() {
    const videoEl = $('#inputVideo').get(0)
    videoEl.srcObject = null;
}
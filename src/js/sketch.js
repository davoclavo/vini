var canvas, video;
var canvasRecorder;
var audioRecorder;
var audioLoop;

var recordAudioButton, uploadButton, downloadButton;
var titleInput;

var kick, drum;
var duration;

var loop_starting_time;


function preload() {
  drum = loadSound('../_files/drum.mp3');
}

function setup() {
    canvas = createCanvas(480, 480);
    video = createCapture();
    // frameRate(29.77);
    video.size(640, 480);
    video.elt.controls = true
    video.hide()

    fill(0,255,0);
    noStroke();
    imageMode(CENTER)

    recordAudioButton = createButton('Add Audio Loop');
    recordCanvasButton = createButton('Record video');
    uploadButton = createButton('Vine it using our account');

    var randomThing = Date.now();
    titleInput = createInput('TITLE [' + randomThing +'] #hswine');

    recordAudioButton.mousePressed(recordAudio);
    recordCanvasButton.mousePressed(recordCanvas);
    uploadButton.mousePressed(upload)


    recordCanvasButton.hide();
    uploadButton.hide();
    titleInput.hide();

    recordAudioButton.position(508, 15);
    recordCanvasButton.position(508, 40);
    titleInput.position(508, 75);
    uploadButton.position(508, 100);

    duration = (drum.duration() * 4)
    durationmillis = duration*1000;
    drum.loop();
}

function draw() {
    background(255);
    image(video, width/2, height/2);
    // console.log(frameRate())
    // filter('invert')
    filter('threshold', 0.29);

    if(loop_starting_time){
        progresswidth = map((millis()-loop_starting_time), 0, durationmillis, 0, width)
        rect(0,0, progresswidth, 6);
    }
}

function recordAudio(){
    // kick.loop();


    recordAudioButton.hide();

    audioRecorder = getMicrophoneRecorder(video.elt.stream)
    // this sound file will be used to
    // playback & save the recording
    audioLoop = new p5.SoundFile();
    loop_starting_time = millis();
    audioRecorder.record(audioLoop, duration, function(){
        drum.stop();
        audioLoop.loop();
        recordAudioButton.show();
        recordCanvasButton.show();
    });
}

function recordCanvas(){
    // Modify p5.dom.js to add stream object to video.elt

    canvasRecorder = RecordRTC(canvas.elt, {
        type: 'canvas'
    });
    canvasRecorder.startRecording();

    fill(255,0,0);
    loop_starting_time = millis();

    setTimeout(function() {
        canvasRecorder.stopRecording(function(url) {
            console.log(url);
        });
        uploadReady();
    }, durationmillis)
}

function uploadReady(){
    uploadButton.show();
    titleInput.show();
}

function upload(){
    uploadButton.elt.innerText = 'Uploading. Please wait...'
    dataView = audioLoop.toDataView();

    var blob = new Blob(dataView, { 'type': 'application/octet-stream' });

    var reader = new window.FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = function() {
        base64wav = reader.result;
        canvasRecorder.getDataURL(function(base64webm){
            var fd = {};
            fd['base64webm'] = base64webm;
            fd['base64wav'] = base64wav;
            fd['title'] = titleInput.value();
            $.ajax({
              type: 'POST',
              url: '/upload',
              data: fd,
              dataType: 'text'
            }).done(function(data) {
                p = prompt('Vine URL - If you click OK will take you there', data);
                if(p){
                    window.location = data;
                }
                uploadButton.elt.innerText = 'Vine it';
            });
        });
    }

}

function getMicrophoneRecorder(stream) {
    mic = new p5.AudioIn();
    mic.stream = stream;
    mic.enabled = true;

    // Wrap a MediaStreamSourceNode around the live input
    mic.mediaStream = p5.soundOut.audiocontext.createMediaStreamSource(stream);
    mic.mediaStream.connect(mic.output);

    // only send to the Amplitude reader, so we can see it but not hear it.
    mic.amplitude.setInput(mic.output);

    // create a sound recorder
    var recorder = new p5.SoundRecorder();

    // connect the mic to the recorder
    recorder.setInput(mic);

    return recorder
}



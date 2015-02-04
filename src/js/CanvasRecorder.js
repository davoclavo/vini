var CanvasRecorder = (function(){

    window.URL =    window.URL ||
                    window.webkitURL;

    var canvas;

    var UploadingURL = '';

    var videoAudioSync = null;
    var recordinterval = null;

    var quality = 1;
    var framerate = 15;
    var frames = [];
    var webp_quality = 0.8;

    window.videoBlobData = '';

    //----- blob upload parameters --------------------

    var BlobSlizeArray = [];
    var CurrentBlobUpload = 0;
    var chunksize = 1048576;
    var functononupload  = null;
    var parametername = '';
    var UploadingURL = ''

    var startTime = null;

    function init(options){
        if(options.webpquality != undefined)  {   webp_quality = options.webpquality         }
        if(options.framerate != undefined)    {   framerate = options.framerate              }
        if(options.canvas != undefined)       {   canvas = options.canvas                    }
    };

   init.prototype.startCapture = function(){
        lg('Recording video...');
        startTime = new Date().getTime();

        // ------- Video Recording started ---------------------------------
        var newWidth = canvas.width
        var newHeight = canvas.height
        var timer  = parseInt(1000 /framerate);

        recordinterval = setInterval(function(){
            frames.push(canvas.toDataURL('image/webp', webp_quality));
            window.framess = frames;
        }, timer);

    }

   init.prototype.stopCapture =  function (oncapturefinish){
        lg('Finish video recording...');
        endCaptureInit();
        var audioBlob = null;
        var videoBlob = null;
        var spentTime = (new Date().getTime() - startTime)/1000;
        var localframerate = parseInt(frames.length) /spentTime;
        lg(localframerate+' Time : '+spentTime+' Frames : '+frames.length);

        videoBlob = new Whammy.fromImageArray(frames, localframerate);
        if((videoBlob != null)){
            videoBlobURL = window.URL.createObjectURL(videoBlob);
            lg(videoBlobURL);
            reinit();
            videoBlobData = videoBlob;
            oncapturefinish(videoBlob);
        }

    }


    init.prototype.uploadData = function(options, onupload){
        CurrentBlobUpload  = 0;
        BlobSlizeArray = [];
        functononupload = onupload;
        chunksize = options.blobchunksize;
        UploadingURL = options.requestUrl;
        parametername = options.requestParametername;
        var allblobs = [];
        var allnames = [];

        allblobs[allblobs.length] = videoBlobData
        // allblobs[allblobs.length] = audioBlobData
        allnames[allnames.length] = options.videoname
        // allnames[allnames.length] = options.audioname

        sendRequest(allblobs, allnames);
    }

    //-------------------------------------------------------------------------------------------

    function lg(data){
        console.log(data);
    }

    function reinit(){
        endCaptureInit();
        frames = [];
    }

    function endCaptureInit(){
        if(recordinterval != null){
            clearInterval(recordinterval);
        }
        if(videoAudioSync != null){
            clearTimeout(videoAudioSync);
        }
    }

    function sendRequest(blobar, namear ){
        for(var y =0; y < blobar.length; ++y){
            var blob = blobar[y];
            var blobnamear = namear[y];

            var BYTES_PER_CHUNK = chunksize; //1048576; // 1MB chunk sizes.
            var SIZE = blob.size;
            var start = 0;
            var end = BYTES_PER_CHUNK;

            while( start < SIZE ){
                var chunk = blob.slice(start, end);
                var chunkdata = { blobchunk : chunk, upname : blobnamear};
                BlobSlizeArray[BlobSlizeArray.length] = chunkdata;
                start = end;
                end = start + BYTES_PER_CHUNK;
            }
        }
        var blobdata = BlobSlizeArray[CurrentBlobUpload];
        uploadBlobs(blobdata.blobchunk, blobdata.upname);
    }

    function uploadBlobs(blobchunk, namesend){
        var fd = new FormData();
        fd.append('fileToUpload', blobchunk);
        var xhr = new XMLHttpRequest();

        xhr.addEventListener('load', uploadComplete, false);
        xhr.addEventListener('error', uploadFailed, false);
        xhr.addEventListener('abort', uploadCanceled, false);

        xhr.open('POST', UploadingURL+'?'+parametername+'='+namesend);

        xhr.onload = function(e){
            if (BlobSlizeArray.length > (CurrentBlobUpload+1)){
                functononupload(BlobSlizeArray.length, (CurrentBlobUpload+1));
                ++CurrentBlobUpload;
                var blobdata = BlobSlizeArray[CurrentBlobUpload];
                uploadBlobs(blobdata.blobchunk, blobdata.upname);

            }else{
                functononupload(BlobSlizeArray.length, BlobSlizeArray.length);
            }
        };
        xhr.send(fd);
    }

    function uploadComplete(evt){
        lg('Upload Success');
        if (evt.target.responseText != ''){
            alert(evt.target.responseText);
        }
    }

    function uploadFailed(evt){
        alert('There was an error attempting to upload the file.');
    }

    function uploadCanceled(evt){
        xhr.abort();
        xhr = null;
    }

     return { initCanvasRecorder : init};
})()

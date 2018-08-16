function UploadFile(){
    var bytesPerPiece = 5 * 1024 * 1024; // 每个文件切片大小定为5MB .
    var totalPieces;
    var LOG = false;
    //初始化进度信息
    var progressInfo = {
            speed : 0,
            totalSize : 0,
            uploadSize : 0,
            usedTime : 0,
            leftTime : 0,
            percent : 0
    };

    var prepareUrl;
    var uploadUrl;
    var pauseUrl;
    var file;
    var beforePrepare;
    var afterPrepare;
    var beforeUpload;
    var afterUpload;
    var failcallback;
    var totalPieces;
    var uploadFile = {
        name:"",
        size:0,
        uploadId:""
    }
    var progressListener;
    var timerId;
    var stopUpload = false;
    var self = this;
    var leftParts;
    //上传定时任务id
    var uploadTaskId;
    var accessKey;
    /**
     * 初始化文件上传对象
     * @param {uploadUrl,file,beforePrepare,afterPrepare,beforeUpload,afterUpload,progressListener,failback,log} params 
     */
    this.initUpload = function(params){
        uploadUrl = params.uploadUrl;
        prepareUrl = params.uploadUrl+"/prepare";
        pauseUrl = params.uploadUrl+"/pause"
        file = params.file;
        beforePrepare = params.beforePrepare;
        afterPrepare = params.afterPrepare;
        beforeUpload = params.beforeUpload;
        afterUpload = params.afterUpload;
        progressListener = params.progressListener;
        failcallback = params.failcallback;
        accessKey = params.accessKey;
        LOG = params.log;
        return self;
    }
    
    /**
     * 开始上传
     */
    this.upload = function(){
        stopUpload = false;
        if(!file){
            failcallback("请选择文件！");
            return;
        }
        uploadFile.name = file.name;
        uploadFile.size = file.size;
        if(beforePrepare){
            beforePrepare(uploadFile,progressInfo);
        }
        //第一步：计算文件MD5
        writeLog("文件文件"+uploadFile.name+"的md5...");
        calculate(file, function(md5) {
            //第二步：请求准备上传接口
			var filesize = file.size;
            var filename = file.name;
            writeLog(uploadFile.name+" md5=>"+md5);
            progressInfo.totalSize = filesize;
            writeLog("创建progressListener...");
            //创建一个定时任务
            timerId =  setInterval(sheduleTask,50);
            //准备上传接口data
            writeLog("准备上传文件=>"+uploadFile.name);
            totalPieces = Math.ceil(filesize / bytesPerPiece);
            var prepareData = {
                originalFileName:filename,
                size:filesize,
                md5:md5,
                totalPart:totalPieces,
                partSize:bytesPerPiece
            }
            //发送ajax请求
            $.ajax({
                url:prepareUrl,
                data:JSON.stringify(prepareData),
                type:"POST",
                cache : false,
//                crossDomain: true,
                beforeSend: function(request) {
                    request.setRequestHeader("access_key", accessKey);
                },
                contentType:"application/json",
                dataType: 'json',
//                xhrFields: {
//                    withCredentials: true
//                 },
                success:function(data){
                	uploadFile.uploadId = data.uploadId;
                    writeLog("文件"+uploadFile.name+"已经准备好上传，上传id为:"+data.uploadId);
                    if(data.bingo){
                        progressInfo.percent = 1;
                        writeLog("文件："+uploadFile.name+"秒传成功！");
                    }
                    if(afterPrepare){
                        afterPrepare(data,progressInfo)
                    }
                    if(data.bingo){
                        if(afterPrepare){
                            afterUpload(file,progressInfo);
                        }
                        return;
                    }else{
                        if(beforeUpload){
                        	beforeUpload(data);
                        }
                        createUploadTask(data.interval);
                    }
                },
                error:function(res){
                    if(failcallback){
                        failcallback(res)
                    }
                }
            })
        });

    }
    /**
     * 创建上传定时任务
     */
    function createUploadTask(time){
        var start = 0;
        var end;
        var index = 0;
        uploadTaskId = setInterval(function(){
            if (start < uploadFile.size) {
                if(!stopUpload){//停止上传
                    end = start + bytesPerPiece;
                    if (end > uploadFile.size) {
                        end = uploadFile.size;
                    }
                    //上传第{index}断的文件内容
                    uploadPart(start,end,index);
                    start = end;
                    index ++;
                }
            }
        },time||200);
    }

    function createContinueUploadTask(time){
        var start = 0;
        var end;
        var index = 0;
        var len = leftParts.length;
        uploadTaskId = setInterval(function(){
            if (index < len) {
                if(!stopUpload){//停止上传
                    //上传第{index}断的文件内容
                    uploadPart(leftParts[index].start,leftParts[index].end + 1,leftParts[index].partIndex);
                    index ++;
                }
            }
        },time||200);
    }

    function sheduleTask(){
        if(progressListener){
            progressListener(progressInfo);
        }
    }
    /**
     * 
     * @param {*} start 
     * @param {*} end 
     * @param {*} index 
     */
    function uploadPart(start,end,index){
        var chunk = file.slice(start, end);//切割文件
        var formData = new FormData();
        formData.append("file", chunk, file.name);
        formData.append("index", index);
        formData.append("uploadId",  uploadFile.uploadId);
        formData.append("totalParts", totalPieces);
        $.ajax({
            url : uploadUrl,
            type : 'POST',
            cache : false,
            data : formData,
//             beforeSend: function(request) {
//            xhrFields: {
//                withCredentials: true
//             },
            beforeSend: function(request) {
                request.setRequestHeader("access_key", accessKey);
            },
           processData : false,
           contentType : false,
        }).done(function(res) {
            writeLog(res);
            progressInfo.speed = res.speed;
            progressInfo.usedTime = res.usedTime;
            progressInfo.uploadSize = res.uploadSize;
            progressInfo.leftTime = res.leftTime;
            progressInfo.percent = res.percent;
            if(progressInfo.percent == 1){
                if(afterUpload){
                    afterUpload(uploadFile,progressInfo)
                }
                //保证更新最新progress信息
                sheduleTask();
                //清除定时任务
                clearInterval(timerId);
                writeLog("清理定时任务：progressListener=>"+timerId);
                clearInterval(uploadTaskId);
                writeLog("清理定时上传任务：uploadTask=>"+uploadTaskId);
                writeLog("文件："+uploadFile.name+"上传成功!");
            }
        }).fail(function(res) {
            console.error("文件上传过程出现错误！");
            if(LOG){
                console.error(res);
            }
            failcallback(res);
        });
    }

    /**
     * 暂停上传
     */
    this.pause = function(){
        stopUpload = true;
        if(!uploadTaskId){
            failcallback("文件没有在上传过程中！");
            return;
        }
        $.ajax({
            url:pauseUrl+'?uploadId='+uploadFile.uploadId,
            // data:JSON.stringify(data),
            type:"POST",
            beforeSend: function(request) {
                request.setRequestHeader("access_key", accessKey);
            },
//            xhrFields: {
//                withCredentials: true
//             },
            contentType:"application/json",
            success:function(res){
                clearInterval(uploadTaskId);
                progressInfo.speed = res.speed;
                progressInfo.usedTime = res.usedTime;
                progressInfo.uploadSize = res.uploadSize;
                progressInfo.leftTime = res.leftTime;
                progressInfo.percent = res.percent;
                sheduleTask();
                clearInterval(timerId);
                writeLog("文件："+uploadFile.name+"已经停止上传！");
            },
            error:function(res){
                writeLog(res);
            }
        });
    }

    /**
     * 恢复上传
     */
    this.continueUpload = function(){
        if(!stopUpload){
            failcallback("文件上传过程没有暂停！")
            return;
        }
        stopUpload = false;
        writeLog("正在恢复文件=>"+uploadFile.name+"的上传...");
        var prepareData = {
            uploadId:uploadFile.uploadId
        };
          //发送ajax请求
          $.ajax({
            url:prepareUrl,
            data:JSON.stringify(prepareData),
            type:"POST",
            beforeSend: function(request) {
                request.setRequestHeader("access_key", accessKey);
            },
//            xhrFields: {
//                withCredentials: true
//             },
            contentType:"application/json",
            success:function(data){
                 //创建一个定时任务
                timerId =  setInterval(sheduleTask,50);
                writeLog("文件"+uploadFile.name+"已经准备好继续上传，上传id为:"+data.uploadId);
                if(data.bingo){
                    progressInfo.percent = 1;
                    writeLog("文件："+uploadFile.name+"秒传成功！");
                }
                if(afterPrepare){
                    afterPrepare(data,progressInfo)
                }
                if(data.bingo){
                    if(afterPrepare){
                        afterUpload(file,progressInfo);
                    }
                    return;
                }else{
                    // uploadFile.uploadId = data.uploadId;
                    leftParts = data.needUploadParts;
                    writeLog(leftParts);
                    if(beforeUpload){
                    	beforeUpload(data);
                    }
                    createContinueUploadTask(data.interval);
                }
            }
        })
    }
    function writeLog(info){
        if(LOG){
            console.log(info);
        }
    }
    /**
     * 计算文件MD5值
     * @param {} file 
     * @param {*} callBack 
     */
    function calculate(file,callBack){  
        var fileReader = new FileReader(),  
            blobSlice = File.prototype.mozSlice || File.prototype.webkitSlice || File.prototype.slice,  
            chunkSize = 5242880,  
            // read in chunks of 5MB  
            chunks = Math.ceil(file.size / chunkSize),  
            currentChunk = 0,  
            spark = new SparkMD5();  
      
        fileReader.onload = function(e) {  
            spark.appendBinary(e.target.result); // append binary string  
            currentChunk++;  
      
            if (currentChunk < chunks) {  
                loadNext();  
            }  
            else {  
                callBack(spark.end());
            }  
        };  
      
        function loadNext() {  
            var start = currentChunk * chunkSize,  
                end = start + chunkSize >= file.size ? file.size : start + chunkSize;  
      
            fileReader.readAsBinaryString(blobSlice.call(file, start, end));  
        };  
      
        loadNext();  
    }
}
function FileUploader() {
	this.uploader=null;;// webuploader对象
	var accessKey;// 上传文件需要登录，必须在header中添加access_key字段
	var fileServerUrl;
	// 注册监视事件
	this.__initEvent = function(){
		var __this = this;
		// 添加hook，监视动作
		WebUploader.Uploader.register(
				{
					"before-send-file":"beforeSendFile",
					"before-send":"beforeSend"
				},
				{
					beforeSendFile:function(file){
						var deferred = WebUploader.Base.Deferred();
						__this.md5File(file).then(val=>{
							file.md5 = val;
							return __this.__prepareUpload(file);
							},function(){
								__event.emit("fc_fileUploadError",file);
							}).then(res=>{
								if(res.bingo){// 秒传
									__this.bingoFile(file);
//									__event.emit("fc_bingoFile",file);
								}
								__event.emit("fc_waitUpload",file);
								file.uploadId = res.uploadId;
								deferred.resolve(file)
							});
						return deferred.promise();
					},
					beforeSend:function(block){
						var deferred = WebUploader.Base.Deferred();
						if(block.file.isBingo){
							__this.skipFile(block.file);
							__event.emit("fc_bingoFile",block.file);
							deferred.reject();
						}else{
							deferred.resolve();
						}
						return deferred.promise()
					}
				}
				);
	}
	
	this.init = function(opts) {
		if(opts.server){			
			fileServerUrl = opts.server;
		}else{
			fileServerUrl = "http://127.0.0.1:1111/v1/fileservice/";
		}
		accessKey = opts.accessKey;
		var __this = this;
		__this.__initEvent();
		uploader = WebUploader.create({

			// swf文件路径
			swf : '/js/uploader/Uploader.swf',

			// 文件接收服务端。
			server : fileServerUrl+"file",

			// 选择文件的按钮。可选。
			// 内部根据当前运行是创建，可能是input元素，也可能是flash.
			pick : opts.picker || '#picker',
			dnd:opts.dnd,// 是否启用拖拽文件功能
			// 不压缩image, 默认如果是jpeg，文件上传前会压缩一把再上传！
			resize : false,
			prepareNextFile:true,
			// 开起分片上传。
		    chunked: opts.chunked || true,
		    chunkSize:opts.chunkSize || 5242880,
		    chunkRetry:opts.chunkRetry || 2,
		    threads:opts.threads || 1,
		    fileSingleSizeLimit:opts.fileSingleSizeLimit || 3221225472 // 单个文件大小
		});
		uploader.on('uploadBeforeSend', function(object,data,headers) {
			// 添加开始上传事件
			if(!(object.file.uploadStep=="uploading")){
				object.file.uploadStep = "uploading"
				__event.emit("fc_fileUploadStart",object.file);
			}
			// 添加header信息
			headers.access_key = accessKey;
			data.uploadId = object.file.uploadId;
			data.index = object.chunk;
		});
		uploader.on('fileQueued', function(file) {
			// 监控添加文件事件
			__event.emit("fc_fileQueued",file);
		});
		uploader.on('uploadProgress', function(file, percentage) {
			// 监控上传进度
			__event.emit("fc_localUploadProgress",file,percentage);
		});
		
		uploader.on('uploadStart', function(file) {
			
		});
		uploader.on('uploadAccept', function(object , ret) {
			// 监控上传进度(服务器返回)
			__event.emit("fc_fileProgress",object.file,ret);
		});
		
		uploader.on('uploadSuccess', function(file) {
			// 上传成功
			__event.emit("fc_fileUploadSuccess",file);
			
		});

		uploader.on('uploadError', function(file) {
			// 上传失败
			__event.emit("fc_fileUploadError",file);
		});

		uploader.on('uploadComplete', function(file) {
			// 不管成功或者失败，上传完成都会执行
			file.uploadStep = "complete" 
			__event.emit("fc_fileUploadComplete",file);
		});
	};
	
	// 开始上传
	this.upload = function(){
		uploader.upload();
	};
	// 暂停上传
	this.stop = function(file){
		if(file==true){
			uploader.stop(true);
			return;
		}
		if(file){
			uploader.stop(file);
			return;
		}
		uploader.stop();
	}
	// 取消该文件的上传
	this.cancel = function(file){
		uploader.cancelFile(file);
	}
	this.bingoFile = function(file){
		console.log(file.name+"秒传！")
		file.isBingo = true;
//		uploader.skipFile(file);
// nextFile.setStatus("progress");
	}
	this.skipFile=function(file){
		uploader.skipFile(file);
	}
	
	this.md5File = function(file){
		var deferred = WebUploader.Base.Deferred();
		__event.emit("fc_md5Start",file);
		uploader.md5File(file)
			.progress(function(percentage){
				__event.emit("fc_md5Progress",file,percentage);
			}).then(function(val){
				deferred.resolve(val)
				__event.emit("fc_md5Complete",file,val);
			});
		return deferred.promise();
	}
	this.extFileInfo = function(id,data){
		var file = uploader.getFile(id);
		file.extInfo = data;
	}
	// 上传prepare方法
	this.__prepareUpload = function(file){
		var deferred = WebUploader.Base.Deferred();
		var bytesPerPiece = uploader.options.chunkSize
		var totalPieces = Math.ceil(file.size / bytesPerPiece);
		
		var prepareData = {
                originalFileName:file.name,
                size:file.size,
                md5:file.md5,
// folderId:file.folderId,
                totalPart:totalPieces,
                partSize:bytesPerPiece
            }
		// 添加额外的参数
		$.extend(prepareData,file.extInfo)
		var prepare = ()=>{
			ajaxSender(
					{
						url:fileServerUrl+"file/prepare",
						type:"POST",
						accessKey:accessKey,
						data:JSON.stringify(prepareData)
					}).then(res=>{
				console.log(res);
				deferred.resolve(res);
			}).catch(error=>{
				__event.emit("fc_fileUploadError",file);
			});
		}
		prepare();
		return deferred.promise();
	}
	this.updateAccessKey = function(newData){
		accessKey = newData;
	}
	// 封装ajax
	var ajaxSender = param =>{
		return new Promise((resovle, reject)=>{
			$.ajax({
				url:param.url,
				type:param.type || "GET",
				contentType:param.contentType || "application/json",
				data:param.data || "",
				beforeSend: function(request) {
					if(param.accessKey){						
						request.setRequestHeader("access_key", param.accessKey);
					}
	            },
	            success:function(res){
	            	resovle(res);
	            },
	            error:function(res){
	            	reject(res);
	            }
			})
		})
	}
	// 事件管理器
	var __event = {
			on:function(eventName,callback){
				if(!this.handles){
					 Object.defineProperty(this, "handles", {
			                value: {},
			                enumerable: false,
			                configurable: true,
			                writable: true
			            });
				}
				if(!this.handles[eventName]){
					this.handles[eventName] = [];
				}
				this.handles[eventName].push(callback);
			},
			emit:function(){
				if(this.handles[arguments[0]]){
					for(var i=0;i<this.handles[arguments[0]].length;i++){
						this.handles[arguments[0]][i].apply(this,[].slice.call(arguments, 1))
					}
				}
			}
	}
	
	/*
	 * 注册事件 事件类型说明： 1 fc_fileProgress 文件上传进度 2 fc_addFile 添加文件 3
	 * fc_fileUploadSuccess 文件上传成功 4 fc_md5Start 计算文件md5进度 5 fc_md5Progress
	 * 计算文件md5进度 6 fc_md5Complete 文件计算md5计算完成 7 fc_fileUploadSuccess 文件上传成功事件 8
	 * fc_fileUploadError 文件上传失败事件 9 fc_fileUploadComplete
	 * 文件上传完成时间，无论成功失败都会触发该事件 10 fc_fileQueued 当有文件加入队列中是会触发该事件 11
	 * fc_fileUploadStart 文件开始上传的时候出发 12 fc_localUploadProgress 本地进度 13
	 * fc_waitUpload 等待上传 14 fc_bingoFile 秒传
	 */
	this.registerEvent = function(eventName,callback){
		__event.on(eventName,callback);
	}
	// 触发事件
	this.fireEvent = function(eventName,arguments){
		__event.emit(eventName,arguments);
	}
	
	this.getNextFile = function(fileId){
		var files = uploader.getFiles();
		for(var i=0;i<files.length;i++){
			if(files[i].id == fileId){
				if(i < files.length - 1){					
					return files[i+1];
				}
			}
		}
	}
}
function UploadManager(){
	this.vue = null;
	this.uploaderPicker = null;
	this.init = function(selector,uploaderPicker,fileServer){
		this.uploaderPicker = uploaderPicker;
		var __this = this;
		if(this.vue == null){
			this.vue = new Vue({
				el:selector,
				data:{
					uploader:null,
					accessKey:"",
					input:"",
					username:"hao5@hao.troila.com",
					password:"123456",
					fileServerUrl:fileServer,
					files:[]
				},
				methods:{
					initWebUploader(){
						var __this = this;
						this.uploader = new FileUploader();
						this.uploader.init({
							server :  __this.fileServerUrl,
							accessKey : "47a05cee3f68e9a7296f3c4e93c13009"
						});
						//监听文件上传进度
						this.uploader.registerEvent("fc_fileProgress", function(file,result) {
							console.log(result);
							file.speed = result.speed;
						})
						
						this.uploader.registerEvent("fc_waitUpload", function(file) {
							file.step = "等待上传"
						})
						this.uploader.registerEvent("fc_bingoFile", function(file) {
							file.speed = -1;//秒传
							file.stepPercent =1;
						})
						this.uploader.registerEvent("fc_localUploadProgress", function(file,percent) {
							if(!file.isBingo){								
								file.stepPercent=percent;
							}
						})
						this.uploader.registerEvent("fc_md5Start", function(file) {
							file.step = "正在计算md5"
							console.log(file.name + "开始计算md5");
						})
						
						this.uploader.registerEvent("fc_fileUploadStart", function(file) {
							file.step = "上传中"
							console.log(file.name+"开始上传！");
						})
						//监听文件md5计算进度
						this.uploader.registerEvent("fc_md5Progress", function(file, percent) {
							console.log(file.name + "md5进度" + percent);
							file.stepPercent=percent;
						})
						//监听文件md5
						this.uploader.registerEvent("fc_md5Complete", function(file, val) {
							console.log(file.name + "md5计算结束，值为:"+val);
						})
						//监听文件上传成功
						this.uploader.registerEvent("fc_fileUploadSuccess", function(file) {
							file.step = "上传完成"
							console.log(file.name + "上传成功");
						})
						//监听文件
						this.uploader.registerEvent("fc_fileUploadError", function(file) {
							file.step = "上传失败"
						})
						//监听文件添加到队列
						this.uploader.registerEvent("fc_fileQueued", function(file) {
							file.step="排队中";
							file.stepPercent=0;
							console.log(file.name);
							file.on("statuschange",function(status){
								console.log(file.name+"文件状态"+status)
								if(file.isBingo){
									file.step="上传成功";
								}
							})
							__this.extInfo(file);
							__this.files.push(file);
						})
						
					},
					login(){
						var __this = this;
						console.log("用户登录:"+this.username);
						var formData = {
							username:this.username,
							password:this.password
						};
						  $.ajax({
					            url : __this.fileServerUrl+"login",
					            type : 'POST',
					            cache : false,
					            data : formData,
					           	success:function(res){
					           		console.log(res);
					           		__this.accessKey = res;
					           		__this.updateAccessKey();
					           	}
					        })  
					},
					upload(){
						this.uploader.upload();
					},
					extInfo(file){
						this.uploader.extFileInfo(file.id, {//添加额外文件信息。比如folderId
							folderId : 0
						});
					},
					selectFile(fileId){
						for(var i=0;i<this.files.length;i++){
							if(this.files[i].id == fileId){
								return this.files[i];
							}
						}
					},
					updateAccessKey:function(){
						this.uploader.updateAccessKey(this.accessKey);
					}
				},
				created:function(){
					
				},
				filters:{
					parseToPercent:function(percent){
						var p = percent * 100;
						 p = p.toFixed(1);
						 return Number(p);
					},
					sizeShowBeautiful:function(size){
						if(!size){
							return '-';
						}
						if(size==-1){
							return "秒传";
						}
						var kb = 1024;
						var mb = 1024*kb;
						var gb = 1024*mb;
						if(size>=gb){
							return (size/gb).toFixed(2)+"G/S";
						}
						if(size>=mb){
							return (size/mb).toFixed(2)+"M/S";
						}
						if(size>=kb){
							return (size/kb).toFixed(2) +"K/S";
						}
						return size+"B/S";
					}
				},
				computed:{
					
				},
				mounted:function(){
					//引用其他的组件需要在monted事件中初始化
					this.initWebUploader();
					this.login();
				}
			});
		}
	}
}
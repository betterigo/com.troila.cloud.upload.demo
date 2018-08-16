<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>upload</title>
<script type="text/javascript" src="/js/jquery-1.11.3.min.js"></script>
<script type="text/javascript" src="/js/spark-md5.min.js"></script>
<script type="text/javascript" src="/js/fileupload.js"></script>
</head>
<body>
	<p>
		<a>token</a><input type="text" id="token">
		<button id="login" onClick="loginByToken()">登录</button>
	</p>
	<br />
	<div>
		<p><a>用户名：</a><input id="username" type="text" placeholder="用户名"/></p>
		<p><a>密&nbsp&nbsp&nbsp码：</a><input id="password" type="password" placeholder="密码"/></p>
		<button type="button" id="loginsubmit" value="登陆" onClick="login()">登陆</button>
		<div id="login_status" style="display:inline"><a style="color: #ff9900">用户未登录</a></div>
	</div>
	<hr>
	<input type="file" name="file" id="file">
	<button id="upload" onClick="upload()">上传</button>
	<button id="pause" onClick="pause()">暂停</button>
	<button id="continueUpload" onClick="continueUpload()">继续</button>
	<div id=bar1 style="display:">
		<table border="0" width="100%">
			<tr>
				<td><b>传送:</b></td>
			</tr>
			<tr bgcolor="#999999">
				<td>
					<table border="0" width="0%" cellspacing="1" bgcolor="#0033FF"
						id="PercentDone">
						<tr>
							<td>&nbsp;</td>
						</tr>
					</table>
				</td>
			</tr>
			<tr>
				<td>
					<table border="0" cellpadding="0" cellspacing="0">
						<tr>
							<td>上传状态:&nbsp</td>
							<td id="ProState" />
						</tr>
						<tr>
							<td>总 大 小:&nbsp</td>
							<td id="TotalSize" />
							<td>(字节)</td>
						</tr>
						<tr>
							<td>已经上传:&nbsp</td>
							<td id="SizeCompleted" />
							<td>(字节)</td>
						</tr>
						<tr>
							<td>平均速率:</td>
							<td id="TransferRate" />
							<td>(KB/秒)</td>
						</tr>
						<tr>
							<td>使用时间:</td>
							<td id="ElapsedTime" />
							<td>(毫秒)</td>
						</tr>
						<tr>
							<td>剩余时间:</td>
							<td id="TimeLeft" />
							<td>(毫秒)</td>
						</tr>
						<!-- <tr><td>错误信息:</td><td id="ErrMsg"></td></tr> -->
					</table>
				</td>
			</tr>
		</table>
		<hr>
		<p>
			<a>文件操作</a>
			
		</p>
	</div>
	<script type="text/javascript">
		var uploadObj = new UploadFile();
		var accessKey="";
		function upload(){			
			var blob = document.getElementById("file").files[0];
			uploadObj.initUpload({
				accessKey:accessKey,
				uploadUrl:'http://localhost:8089/file',
				file:blob,
				beforePrepare:function(file){
					$("#TotalSize").text(file.size);
					$("#ProState").html('<a style="color: #ff9900">准备上传</a>');
					console.log("准备上传之前")
					
				},
				afterPrepare:function(data){
					if(data.bingo){
						alert("秒传");
					}
				},
				beforeUpload:function(){
					$("#ProState").html('<a style="color: #3333cc">上传中</a>');
				},
				afterUpload:function(){
					$("#ProState").html('<a style="color: #336600">上传完成</a>')
				},
				progressListener:function(progress){//文件上传进度
					setProgressInfo(progress);
				},
				failcallback:function(res){
					console.error(res);
				},
				log:true
			}).upload();
			function setProgressInfo(progressInfo){
				$("#SizeCompleted").text(progressInfo.uploadSize)
				$("#TransferRate").text(progressInfo.speed)
				$("#ElapsedTime").text(progressInfo.usedTime)
				$("#PercentDone").attr("width",progressInfo.percent*100+"%")
				$("#TimeLeft").text(progressInfo.leftTime)
			}
		}
		function pause(){
			uploadObj.pause();
			//alert(123)
		}
		function continueUpload(){
			uploadObj.continueUpload();
		}
		function loginByToken(){
			var formData = {
					token:$("#token").val()
			}
 		  $.ajax({
		            url : "http://localhost:8089/login",
		            type : 'POST',
		            cache : false,
		            data : formData,
		           /*  crossDomain: true,
		            xhrFields: {
		                withCredentials: true
		             }, */
		           	success:function(res){
		           		console.log(res);
		           	}
		        })  
		}
		
		function login(){
			var username = $("#username").val();
			var password = $("#password").val();
			var data = {
					username:username,
					password:password
			}
			$.ajax({
				url : "http://localhost:8089/login",
				data : data,
				type : 'POST',
				cache : false,
				/* crossDomain : true,
				xhrFields:{
					withCredentials:true
				}, */
				success:function(data){
					$("#login_status").html('<a style="color: #336600">用户已登录：'+data+'</a>');
					accessKey = data;
				},
				error:function(res){
					console.log(res)
					$("#login_status").html('<a style="color:#B22222">用户名或密码错误</a>');
				}
			});
		}
	</script>
</body>
</html>
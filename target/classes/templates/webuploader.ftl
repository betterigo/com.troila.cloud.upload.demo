<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>webupload</title>
<link rel="stylesheet" type="text/css" href="/css/style.css">
<script type="text/javascript" src="/js/jquery-1.11.3.min.js"></script>
<link rel="stylesheet" type="text/css"
	href="/js/uploader/webuploader.css">
<script type="text/javascript" src="/js/uploader/webuploader.js"></script>
<script type="text/javascript" src="/js/fileuploader.js"></script>
<!-- 引入vue.js -->
<script type="text/javascript" src="/js/vue.js"></script>
<!-- 添加elementUI -->
<link rel="stylesheet" type="text/css" href="/js/eui/index.css">
<script type="text/javascript" src="/js/eui/index.js"></script>
<!-- 页面js -->
<script type="text/javascript" src="/js/uploadmanager.js"></script>
</head>
<body>
	<div id="page">
		<el-row> <el-col :span="4">
		<div>
			<el-form label-width="80px"> <el-form-item label="用户名">
			<el-input v-model="username" placeholder="请输入用户名" size="small"></el-input>
			</el-form-item> <el-form-item label="密码"> <el-input
				v-model="password" placeholder="请输入密码" size="small" type="password"></el-input>
			</el-form-item> <el-form-item> <el-button type="primary"
				@click="login" size="small">登录</el-button> </el-form-item> </el-form>
		</div>
		</el-col> </el-row>
		<el-row> <el-col :span="4">
		<div>
			<!-- <input type="file" name="file" id="picker"> -->
			<div id="picker">选择文件</div>
			<el-button size="small" @click=upload>上传</el-button>
		</div>
		</el-col> </el-row>
		<el-row>
			<el-col :span="10">
				<div>
					<el-table :data="files">
						<el-table-column label="文件名称" prop="name">
						</el-table-column>
						<el-table-column label="状态" prop="step">
						</el-table-column>
						<el-table-column label="百分比">
							<template slot-scope="scope">
								<a>{{scope.row.stepPercent | parseToPercent}}%</a>
							</template>
						</el-table-column>
						<el-table-column label="速度">
							<template slot-scope="scope">
								<a>{{scope.row.speed | sizeShowBeautiful}}</a>
							 </template> 
						</el-table-column>
						<el-table-column label="进度">
							 <template slot-scope="scope">
							 	<el-progress :percentage="scope.row.stepPercent | parseToPercent" v-show="scope.row.uploadStep=='uploading'"></el-progress>
							 </template>
						</el-table-column>
					</el-table>
				</div>
			</el-col>
		</el-row>
	</div>
</body>
<script>
	$(function() {
		var uploadmanager = new UploadManager();
		uploadmanager.init("#page", "#picker" ,"http://172.26.106.65:1111/v1/fileservice/");//初始化vue对象

	})
</script>
</html>
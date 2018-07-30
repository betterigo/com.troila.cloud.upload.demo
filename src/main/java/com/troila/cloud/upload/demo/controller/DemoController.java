package com.troila.cloud.upload.demo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/upload")
public class DemoController {
	
	@GetMapping
	public String uploadPage() {
		return "upload";
	}
}

package com.cdac.gd;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableScheduling
public class GdPlatformApplication {

	public static void main(String[] args) {
		SpringApplication.run(GdPlatformApplication.class, args);
	}

}

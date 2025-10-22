package com.stacktrack;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.stacktrack") //
public class StackAndTrackApiApplication {
	public static void main(String[] args) {
		SpringApplication.run(StackAndTrackApiApplication.class, args);
	}
}

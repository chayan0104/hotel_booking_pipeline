package com.demo.controller;

import com.demo.model.ApiMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    @Value("${spring.application.name:demo-rest-api}")
    private String appName;

    @GetMapping("/health")
    public ApiMessage health() {
        return new ApiMessage("UP", "Service is running", Instant.now().toString());
    }

    @GetMapping("/info")
    public Map<String, Object> info() {
        Map<String, Object> payload = new HashMap<String, Object>();
        payload.put("application", appName);
        payload.put("service", "React + Spring Boot + Oracle Demo API");
        payload.put("timestamp", Instant.now().toString());
        payload.put("endpoints", new String[]{
                "/hello",
                "/api/system/health",
                "/api/system/info",
                "/api/tasks"
        });
        return payload;
    }
}

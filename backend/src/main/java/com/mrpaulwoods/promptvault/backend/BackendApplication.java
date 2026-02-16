package com.mrpaulwoods.promptvault.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jdbc.repository.config.EnableJdbcAuditing;

@SpringBootApplication
@EnableJdbcAuditing
public class BackendApplication {

    static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

}

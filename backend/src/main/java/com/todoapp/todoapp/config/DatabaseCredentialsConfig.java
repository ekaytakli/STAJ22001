package com.todoapp.todoapp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/** Eksik veritabanı parolasıyla uygulamanın başlamasını engeller. */
@Configuration
public class DatabaseCredentialsConfig {

    public DatabaseCredentialsConfig(@Value("${spring.datasource.password}") String password) {
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("DB_PASSWORD boş olamaz.");
        }
    }
}

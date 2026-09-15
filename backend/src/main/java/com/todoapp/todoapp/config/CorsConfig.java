package com.todoapp.todoapp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

// Tarayıcının farklı portlar arasındaki veri alışverişini engellememesi için CORS izinlerimi burada ayarlıyorum.
@Configuration
public class CorsConfig {

    // Spring Security'nin doğrudan kullanacağı CORS ayar kaynağını bir Bean olarak tanımlıyorum.
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Backend'e istek atmasına izin verdiğim React (Vite) adreslerini ve portlarını buraya yazıyorum.
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://127.0.0.1:5173"
        ));

        // Frontend'in backend üzerinde kullanabileceği HTTP işlem metotlarını belirliyorum.
        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "OPTIONS",
                "PATCH"
        ));

        // JWT ve JSON veri transferi için gereken istek başlıklarına (header) izin veriyorum.
        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "X-Requested-With",
                "Origin"
        ));

        // Kimlik bilgisi ve yetki verisi içeren cross-origin isteklere onay veriyorum.
        configuration.setAllowCredentials(true);

        // Bu kuralların projedeki bütün endpoint'lerde (/**) geçerli olmasını sağlayıp yapılandırmayı teslim ediyorum.
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
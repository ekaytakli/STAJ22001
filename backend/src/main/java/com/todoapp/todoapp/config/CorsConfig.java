package com.todoapp.todoapp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Uygulamanın Cross-Origin Resource Sharing (CORS) yapılandırmasını yöneten sınıftır.
 *
 * Modern web tarayıcıları, güvenlik gerekçesiyle farklı port veya domainler
 * arasındaki veri alışverişini varsayılan olarak kısıtlar (Same-Origin Policy).
 * Bu sınıf, frontend uygulamasının (React/Vite) backend API uç noktalarına
 * sorunsuz şekilde HTTP istekleri gönderebilmesi için gereken izinleri tanımlar.
 */
@Configuration
public class CorsConfig {

    /**
     * Spring Security mimarisi tarafından kullanılacak CORS kurallarını
     * bir Bean olarak uygulama bağlamına (ApplicationContext) kaydeder.
     *
     * Tanımlanan kurallar:
     * - İzin verilen kaynak adresleri (Origins)
     * - İzin verilen HTTP işlem metotları (Methods)
     * - İzin verilen istek başlıkları (Headers)
     * - Kimlik doğrulama verisi taşıma izni (Credentials)
     *
     * @return Yapılandırılmış ve tüm endpoint'ler için geçerli CORS kaynak nesnesi
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        /*
         * Backend API'sine erişim sağlamasına izin verilen frontend adresleri belirlenir.
         * Vite geliştirme sunucusunun varsayılan portları tanımlanmıştır.
         */
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://127.0.0.1:5173"
        ));

        /*
         * Frontend tarafından gönderilebilecek izinli HTTP işlem tipleri listelenir.
         * CRUD operasyonlarının (Create, Read, Update, Delete) yanı sıra
         * tarayıcının otomatik gönderdiği ön kontrol (OPTIONS) isteğine de izin verilir.
         */
        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "OPTIONS",
                "PATCH"
        ));

        /*
         * İstemcinin HTTP istek zarfında taşımasına izin verilen başlık bilgileri seçilir.
         * Özellikle JWT token taşıyan 'Authorization' ve veri formatını belirten
         * 'Content-Type' başlıkları kimlik denetimi ve JSON aktarımı için zorunludur.
         */
        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "X-Requested-With",
                "Origin"
        ));

        /*
         * Cookie, yetkilendirme başlığı (Authorization) veya TLS istemci sertifikası
         * gibi hassas kimlik doğrulama verilerinin cross-origin isteklerde
         * taşınmasına onay verilir.
         */
        configuration.setAllowCredentials(true);

        /*
         * Hazırlanan bu güvenlik kuralları uygulamadaki tüm URL yollarına (/**)
         * uygulanacak biçimde URL tabanlı yapılandırma kaynağına tescil edilir.
         */
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
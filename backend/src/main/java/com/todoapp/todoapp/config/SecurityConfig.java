package com.todoapp.todoapp.config;

import com.todoapp.todoapp.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

// Spring'e bu sınıfın projenin güvenlik ayarlarını tuttuğunu söylüyorum ve ihtiyaç duyduğum JWT filtresini sınıfa otomatik bağlıyorum.
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    // Gelen isteklerdeki token'ı kontrol edecek olan JWT filtremi buraya dahil ediyorum.
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    // Kullanıcı şifrelerini veritabanına açık halde yazmamak için BCrypt ile tek yönlü hash'leyen kodlayıcıyı tanımlıyorum.
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Gelen bütün isteklerin geçeceği güvenlik kurallarını burada yapılandırıyorum.
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Oturum için cookie yerine her istekte JWT taşıdığımızdan dolayı gereksiz CSRF korumasını kapatıyorum.
                .csrf(AbstractHttpConfigurer::disable)

                // React'in çalıştığı porttan gelen isteklere izin vermek için yazdığım CORS ayarlarını güvenlik zincirine dahil ediyorum.
                .cors(Customizer.withDefaults())

                // Sunucuda oturum hafızası tutmuyorum; uygulamanın her isteği bağımsız bir token ile karşılamasını sağlıyorum.
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // İstek bazlı yetkilendirme kurallarım
                .authorizeHttpRequests(auth -> auth
                        // Tarayıcının asıl istekten önce gönderdiği gizli ön kontrol (pre-flight) isteklerini engelsiz içeri alıyorum.
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Sunucuda bir hata çıktığında Spring'in bunu güvenlik filtresine takıp 403 arkasına gizlemesini önlüyorum.
                        .requestMatchers("/error").permitAll()

                        // Kullanıcı kayıt olurken veya giriş yaparken henüz elinde token olamayacağı için auth kapılarını herkese açıyorum.
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/auth/**").permitAll()

                        // Görev ekleme, silme ve listeleme işlemlerini yalnızca geçerli token'ı olan onaylı kullanıcılara açıyorum.
                        .requestMatchers("/api/todos/**").authenticated()

                        // Açıkça izin vermediğim diğer tüm olası yolları güvenlik açığı kalmasın diye kilitliyorum.
                        .anyRequest().authenticated()
                )

                // Yazdığım JWT filtresini kapının en önüne koyuyorum ki istek controller'a varmadan önce token kontrol edilip kullanıcı tanınsın.
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}
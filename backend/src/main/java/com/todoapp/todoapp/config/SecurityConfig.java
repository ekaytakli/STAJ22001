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

/**
 * Spring Security güvenlik filtre zincirini ve yetkilendirme kurallarını yapılandıran sınıftır.
 *
 * Bu sınıf:
 * - Şifrelerin güvenli biçimde hash'lenmesini sağlar.
 * - HTTP isteklerinin yetki kontrol kurallarını belirler.
 * - Uygulamayı durumsuz (Stateless) JWT mimarisine göre ayarlar.
 * - JWT doğrulama filtresini Spring'in standart güvenlik zincirine entegre eder.
 */
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    /**
     * Gelen HTTP isteklerindeki JWT token'ı ayrıştıran ve doğrulayan filtredir.
     *
     * final olarak tanımlandığı için Lombok'un @RequiredArgsConstructor anotasyonu
     * aracılığıyla constructor üzerinden enjekte (Dependency Injection) edilir.
     */
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    /**
     * Kullanıcı şifrelerinin veritabanına açık metin (plain text) olarak kaydedilmesini
     * önlemek amacıyla BCrypt algoritmasını kullanan şifreleyicidir.
     *
     * BCrypt tek yönlü ve tuzlama (salt) içeren bir özetleme algoritmasıdır;
     * hash'lenmiş veriden orijinal şifre geri elde edilemez.
     *
     * @return BCrypt tabanlı PasswordEncoder nesnesi
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Uygulamaya gelen tüm HTTP isteklerinin geçmek zorunda olduğu güvenlik
     * filtre zincirini (SecurityFilterChain) inşa eder.
     *
     * @param http Spring Security HTTP güvenlik yapılandırıcısı
     * @return Yapılandırılmış SecurityFilterChain nesnesi
     * @throws Exception Güvenlik zinciri oluşturulurken doğabilecek hatalar
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                /*
                 * CSRF (Cross-Site Request Forgery) koruması devre dışı bırakılır.
                 * Uygulama session-cookie ikilisi yerine her istekte bağımsız JWT token
                 * kullandığı için CSRF saldırılarına karşı doğal olarak korunaklıdır.
                 */
                .csrf(AbstractHttpConfigurer::disable)

                /*
                 * CorsConfig sınıfında tanımlanan CORS kurallarının
                 * güvenlik filtre zincirine doğrudan dahil edilmesini sağlar.
                 */
                .cors(Customizer.withDefaults())

                /*
                 * Sunucu tarafında HTTP Session (oturum hafızası) tutulması engellenir.
                 * Uygulama tamamen STATELESS (durumsuz) çalışır; her istek kendi token'ını taşır.
                 */
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                /*
                 * URL ve HTTP metodu bazlı erişim yetkilendirme kuralları tanımlanır.
                 */
                .authorizeHttpRequests(auth -> auth
                        /*
                         * Tarayıcıların asıl istekten önce gönderdiği ön uçuş (Pre-flight)
                         * OPTIONS isteklerine filtreye takılmadan geçiş izni verilir.
                         */
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        /*
                         * Sistemde bir hata fırlatıldığında Spring'in bunu güvenlik filtresine takıp
                         * 403 Forbidden arkasına gizlemesini önlemek için hata yolu herkese açılır.
                         */
                        .requestMatchers("/error").permitAll()

                        /*
                         * Kayıt ve giriş işlemlerinde kullanıcının henüz bir token'ı bulunmadığı için
                         * kimlik doğrulama uç noktaları herkese açık (permitAll) bırakılır.
                         */
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/auth/**").permitAll()

                        /*
                         * Görev (Todo) yönetimine dair tüm işlemler yalnızca geçerli bir JWT token'a
                         * sahip, doğrulanmış kullanıcılara açık tutulur.
                         */
                        .requestMatchers("/api/todos/**").authenticated()

                        /*
                         * Yukarıdaki kuralların dışında kalan tüm potansiyel yollar
                         * güvenlik açığı oluşmaması adına kilitlenir.
                         */
                        .anyRequest().authenticated()
                )

                /*
                 * Özel olarak yazdığımız JWT doğrulama filtresi, Spring Security'nin
                 * standart kullanıcı adı/şifre kontrol filtresinin hemen önüne yerleştirilir.
                 * Böylece istek controller'a varmadan önce token taranır ve kullanıcı sisteme tanıtılır.
                 */
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}
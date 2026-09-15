package com.todoapp.todoapp.controller;

import com.todoapp.todoapp.dto.LoginRequest;
import com.todoapp.todoapp.dto.LoginResponse;
import com.todoapp.todoapp.dto.RegisterRequest;
import com.todoapp.todoapp.entity.User;
import com.todoapp.todoapp.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * Kullanıcı kayıt ve giriş isteklerini karşılayan controller sınıfıdır.
 *
 * Bu sınıf yalnızca HTTP isteklerini alır ve işlemleri AuthService katmanına
 * yönlendirir. Şifre kontrolü, kullanıcı oluşturma ve JWT üretme gibi asıl
 * iş kuralları servis katmanında gerçekleştirilir.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    /**
     * Kullanıcı kayıt ve giriş işlemlerini gerçekleştiren servis katmanıdır.
     *
     * final olarak tanımlandığı için Lombok tarafından oluşturulan constructor
     * üzerinden dependency injection yapılır.
     */
    private final AuthService authService;

    /**
     * Kullanıcının sisteme giriş yapmasını sağlar.
     *
     * Frontend tarafından gönderilen kullanıcı adı ve şifre bilgileri
     * LoginRequest nesnesine dönüştürülür. Bu bilgiler AuthService'e iletilir.
     *
     * Giriş bilgileri doğruysa servis katmanı kullanıcıya ait JWT bilgisini
     * içeren LoginResponse nesnesini döndürür.
     *
     * Endpoint:
     * POST /api/auth/login
     *
     * @param loginRequest frontend tarafından gönderilen giriş bilgileri
     * @return başarılı giriş sonucunda JWT ve kullanıcı bilgilerini içeren cevap
     */
    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest loginRequest) {

        return authService.login(loginRequest);
    }

    /**
     * Yeni bir kullanıcı hesabı oluşturulmasını sağlar.
     *
     * Frontend tarafından gönderilen kullanıcı adı, e-posta ve şifre bilgileri
     * RegisterRequest nesnesine dönüştürülür ve AuthService katmanına aktarılır.
     *
     * Kullanıcı adı ve e-posta benzersizliği ile şifrenin hashlenmesi gibi
     * kontroller servis katmanında gerçekleştirilir.
     *
     * Endpoint:
     * POST /api/auth/register
     *
     * @param registerRequest yeni kullanıcıya ait kayıt bilgileri
     * @return veritabanına kaydedilen kullanıcı
     */
    @PostMapping("/register")
    public User register(@RequestBody RegisterRequest registerRequest) {

        return authService.register(registerRequest);
    }
}
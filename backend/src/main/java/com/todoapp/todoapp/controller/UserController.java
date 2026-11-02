package com.todoapp.todoapp.controller;

import com.todoapp.todoapp.entity.User;
import com.todoapp.todoapp.dto.UserProfileResponse;
import com.todoapp.todoapp.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.todoapp.todoapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;



/**
 * Kullanıcılarla ilgili HTTP isteklerini karşılayan controller sınıfıdır.
 *
 * Bu sınıf kullanıcı kaydı ve giriş yapan kullanıcının profilini
 * getirme işlemlerini UserService katmanına yönlendirir.
 *
 * Controller katmanı yalnızca isteği alır ve uygun HTTP cevabını döndürür.
 * Asıl iş kuralları servis katmanında uygulanır.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    /**
     * Kullanıcı işlemlerini gerçekleştiren servis katmanıdır.
     *
     * final olarak tanımlandığı için Lombok tarafından oluşturulan constructor
     * üzerinden dependency injection yapılır.
     */
    private final UserService userService;

    /**
     * Yeni bir kullanıcı hesabı oluşturur.
     *
     * Frontend tarafından JSON formatında gönderilen kullanıcı bilgileri
     * @RequestBody sayesinde User nesnesine dönüştürülür.
     *
     * Endpoint:
     * POST /api/users/register
     *
     * @param user frontend tarafından gönderilen kullanıcı bilgileri
     * @return kaydedilen kullanıcı ve 201 Created durum kodu
     */
    @PostMapping("/register")
    public ResponseEntity<User> registerUser(
            @RequestBody User user) {

        /*
         * Kullanıcı kaydetme işlemi servis katmanına aktarılır.
         * Kullanıcı adı, e-posta ve şifre ile ilgili kontrollerin
         * servis katmanında yapılması beklenir.
         */
        User savedUser = userService.registerUser(user);

        /*
         * Yeni bir kayıt oluşturulduğu için HTTP 201 Created
         * durum kodu döndürülür.
         */
        return new ResponseEntity<>(
                savedUser,
                HttpStatus.CREATED
        );
    }

    /** Giriş yapan kullanıcının profilini güvenlik bağlamındaki kimlikle getirir. */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.getUserProfile(principal.getId()));
    }
}
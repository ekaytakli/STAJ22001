package com.todoapp.todoapp.controller;

import com.todoapp.todoapp.dto.UserProfileResponse;
import com.todoapp.todoapp.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.todoapp.todoapp.service.UserService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Kullanıcılarla ilgili HTTP isteklerini karşılayan controller sınıfıdır.
 *
 * Bu sınıf giriş yapan kullanıcının profilini
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

    /** Giriş yapan kullanıcının profilini güvenlik bağlamındaki kimlikle getirir. */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.getUserProfile(principal.getId()));
    }
}
package com.todoapp.todoapp.controller;

import com.todoapp.todoapp.entity.User;
import com.todoapp.todoapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Kullanıcılarla ilgili HTTP isteklerini karşılayan controller sınıfıdır.
 *
 * Bu sınıf kullanıcı kaydı, kullanıcı bilgisi getirme ve kullanıcıları
 * listeleme işlemlerini UserService katmanına yönlendirir.
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

    /**
     * Verilen ID değerine sahip kullanıcıyı getirir.
     *
     * URL içerisindeki kullanıcı ID'si @PathVariable ile alınır.
     *
     * Endpoint:
     * GET /api/users/{id}
     *
     * @param id getirilecek kullanıcının ID değeri
     * @return bulunan kullanıcı ve 200 OK durum kodu
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(
            @PathVariable Long id) {

        User user = userService.getUserById(id);

        return ResponseEntity.ok(user);
    }

    /**
     * Sistemde bulunan tüm kullanıcıları listeler.
     *
     * Endpoint:
     * GET /api/users
     *
     * @return kullanıcı listesini ve 200 OK durum kodunu içeren cevap
     */
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {

        List<User> users = userService.getAllUsers();

        return ResponseEntity.ok(users);
    }
}
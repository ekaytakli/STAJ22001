package com.todoapp.todoapp.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

// Giriş işlemi başarıyla tamamlandığında React tarafına döneceğim veri paketini (DTO) burada tanımlıyorum.
// Setter kullanmıyorum; alanlar constructor üzerinden bir kere atanıp değişmeyecek şekilde (immutable) taşınıyor.
@Getter
@AllArgsConstructor
public class LoginResponse {

    // Kullanıcının sonraki tüm korumalı isteklere ekleyeceği dijital pasaportu (JWT erişim anahtarı).
    private String token;

    // React'in hangi kullanıcının işlem yaptığını bilmesi ve state içinde tutabilmesi için kullanıcının benzersiz ID'si.
    private Long userId;

    // Arayüzde "Hoş geldin emirhan" gibi kullanıcıya özel karşılama metinleri gösterebilmek için kullanıcı adı.
    private String username;
}
package com.todoapp.todoapp.dto;

import lombok.Getter;
import lombok.Setter;

// Kullanıcı kayıt olurken React formundan gönderilen bilgileri karşılayan DTO sınıfım.
// Entity nesnesi yerine bu DTO'yu kullanarak yalnızca kayıt için zorunlu olan verileri servis katmanına taşıyorum.
@Getter
@Setter
public class RegisterRequest {

    // Kullanıcının kayıt formuna yazdığı benzersiz kullanıcı adı.
    private String username;

    // Kullanıcının iletişim ve hesap doğrulaması için girdiği e-posta adresi.
    private String email;

    // Kullanıcının belirlediği açık metin şifre; sadece bu istek boyunca taşınır, AuthService içinde BCrypt ile hash'lenip öyle kaydedilir.
    private String password;
}
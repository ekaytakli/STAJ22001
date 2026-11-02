package com.todoapp.todoapp.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

// Kullanıcı kayıt olurken React formundan gönderilen bilgileri karşılayan DTO sınıfım.
// Entity nesnesi yerine bu DTO'yu kullanarak yalnızca kayıt için zorunlu olan verileri servis katmanına taşıyorum.
@Getter
@Setter
public class RegisterRequest {

    // Kullanıcının kayıt formuna yazdığı benzersiz kullanıcı adı.
    @NotBlank(message = "Kullanıcı adı boş olamaz.")
    @Size(max = 255, message = "Kullanıcı adı en fazla 255 karakter olabilir.")
    private String username;

    // Kullanıcının iletişim ve hesap doğrulaması için girdiği e-posta adresi.
    @NotBlank(message = "E-posta boş olamaz.")
    @Email(message = "Geçerli bir e-posta girin.")
    @Size(max = 255, message = "E-posta en fazla 255 karakter olabilir.")
    private String email;

    // Kullanıcının belirlediği açık metin şifre; sadece bu istek boyunca taşınır, AuthService içinde BCrypt ile hash'lenip öyle kaydedilir.
    @NotBlank(message = "Şifre boş olamaz.")
    @Size(min = 8, max = 72, message = "Şifre 8 ile 72 karakter arasında olmalıdır.")
    private String password;
}
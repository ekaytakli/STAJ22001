package com.todoapp.todoapp.dto;

import lombok.Getter;
import lombok.Setter;

// Kullanıcı giriş yaparken React formundan gelen veriyi karşılamak için kullandığım veri transfer nesnem (DTO).
// Veritabanı tablosuyla (Entity) doğrudan ilişkisi yoktur; sadece ağ üzerinden temiz ve güvenli veri taşır.
@Getter
@Setter
public class LoginRequest {

    // Kullanıcının login formuna yazdığı kullanıcı adı.
    private String username;

    // Kullanıcının login formuna yazdığı açık metin şifresi (AuthService içinde doğrulanacak).
    private String password;
}
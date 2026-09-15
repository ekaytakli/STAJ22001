package com.todoapp.todoapp.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

// PostgreSQL'de "user" kelimesi rezerve olduğu için tablonun adını açıkça "users" olarak tanımlıyorum.
@Entity
@Table(name = "users")
// Getter, setter ve constructor'ları elle yazıp kod kalabalığı yapmamak için Lombok kullanıyorum.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    // Her kullanıcının benzersiz ID'si; veritabanı tarafından otomatik artarak üretilir.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Sisteme girişte kullanılan kullanıcı adı; hem zorunlu hem de sistemde tek (unique) olmak zorunda.
    @Column(unique = true, nullable = false)
    private String username;

    // Kullanıcının iletişim ve doğrulama e-postası; aynı e-posta ile ikinci bir hesap açılamaz.
    @Column(unique = true, nullable = false)
    private String email;

    // Kullanıcının BCrypt ile hash'lenmiş şifresini saklıyorum.
    // @JsonIgnore ile API yanıtlarında bu alanın React'e gitmesini engelleyip güvenlik açığını kapatıyorum.
    @Column(nullable = false)
    @JsonIgnore
    private String password;
}
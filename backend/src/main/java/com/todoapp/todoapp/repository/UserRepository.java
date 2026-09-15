package com.todoapp.todoapp.repository;

import com.todoapp.todoapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

// Users tablosundaki veritabanı işlemlerini yönettiğim ve Spring Data JPA'nın hazır CRUD metotlarını kullandığım katmanım.
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Giriş (login) işleminde girilen kullanıcı adıyla veritabanındaki kullanıcıyı ve şifre hash'ini bulmak için kullanıyorum.
    Optional<User> findByUsername(String username);

    // Kayıt esnasında aynı kullanıcı adı önceden alınmış mı diye veritabanını kontrol edip çakışmayı önlediğim metot.
    boolean existsByUsername(String username);

    // Aynı e-posta adresiyle birden fazla hesap açılmasını engellemek için kontrol yaptığım metot.
    boolean existsByEmail(String email);
}
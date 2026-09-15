package com.todoapp.todoapp.repository;

import com.todoapp.todoapp.entity.Todo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

// Todo tablosu için SQL yazmadan temel CRUD (Ekle/Sil/Güncelle/Oku) işlemlerini yönettiğim veri erişim katmanım.
@Repository
public interface TodoRepository extends JpaRepository<Todo, Long> {

    // Giriş yapmış kullanıcının sadece kendi görevlerini listelemek için kullandığım sorgu metodu.
    List<Todo> findByUserId(Long userId);

    // Kullanıcının görevlerini "tamamlananlar" veya "devam edenler" şeklinde filtreleyebilmek için yazdığım metot.
    List<Todo> findByUserIdAndCompleted(Long userId, boolean completed);

    // Bir görevi silerken veya güncellerken, o görevin gerçekten o kullanıcıya ait olup olmadığını doğrulayan güvenlik sorgum.
    Optional<Todo> findByIdAndUserId(Long id, Long userId);
}
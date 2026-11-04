package com.todoapp.todoapp.repository;

import com.todoapp.todoapp.entity.Todo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

// Todo tablosu için SQL yazmadan temel CRUD (Ekle/Sil/Güncelle/Oku) işlemlerini yönettiğim veri erişim katmanım.
@Repository
public interface TodoRepository extends JpaRepository<Todo, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Todo> {

    // Giriş yapmış kullanıcının sadece kendi görevlerini listelemek için kullandığım sorgu metodu.
    List<Todo> findByUserId(Long userId);
    long countByUserId(Long userId);
    long countByUserIdAndCompleted(Long userId, boolean completed);
    @org.springframework.data.jpa.repository.Query("select t.category from Todo t where t.user.id = :userId group by t.category order by min(t.id)")
    List<String> findCategoriesByUserId(@org.springframework.data.repository.query.Param("userId") Long userId);

    // Kullanıcının görevlerini "tamamlananlar" veya "devam edenler" şeklinde filtreleyebilmek için yazdığım metot.
    List<Todo> findByUserIdAndCompleted(Long userId, boolean completed);

    // Bir görevi silerken veya güncellerken, o görevin gerçekten o kullanıcıya ait olup olmadığını doğrulayan güvenlik sorgum.
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    Optional<Todo> findByIdAndUserId(Long id, Long userId);
}

package com.todoapp.todoapp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

// Spring ve Hibernate'e bu sınıfın veritabanındaki "todos" tablosunu temsil ettiğini bildiriyorum.
@Entity
@Table(name = "todos")
// Lombok ile getter, setter ve yapıcı metotları (constructor) elle yazmadan otomatik üretiyorum.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Todo {

    // Her göreve benzersiz bir Primary Key tanımlıyorum; ID değerini veritabanı otomatik artırsın.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Görev başlığının formdan boş gelmesini ve veritabanına null yazılmasını engelliyorum.
    @NotBlank(message = "Başlık boş bırakılamaz")
    @Column(nullable = false)
    private String title;

    // Kullanıcının görevle ilgili girmek isteyebileceği isteğe bağlı açıklama alanı.
    private String description;

    // Görevin yapılıp yapılmadığı bilgisi; yeni görevler varsayılan olarak tamamlanmamış (false) başlasın.
    @Column(nullable = false)
    private boolean completed = false;

    // Görevin oluşturulma zamanını tutuyorum; sonradan güncellenip bozulmasın diye updatable=false yaptım.
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Veritabanına kayıt ilk kez eklenmeden hemen önce o anın tarih-saatini otomatik atıyorum.
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    // Bir kullanıcının birden fazla görevi olabilir, ama her görev tek bir kullanıcıya aittir (Many-to-One).
    @ManyToOne
    // Veritabanındaki todos tablosuna "user_id" adında foreign key sütunu ekleyerek görevi sahibine bağlıyorum.
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
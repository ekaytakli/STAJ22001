package com.todoapp.todoapp.service;

import com.todoapp.todoapp.entity.Todo;
import com.todoapp.todoapp.entity.User;
import com.todoapp.todoapp.repository.TodoRepository;
import com.todoapp.todoapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

// Görevlerle (Todo) ilgili tüm iş mantığını ve kullanıcı yetki kontrollerini yürüttüğüm servis katmanım.
@Service
@RequiredArgsConstructor
public class TodoService {

    // Görevlerin veritabanı işlemlerini yönettiğim repository.
    private final TodoRepository todoRepository;

    // Görevi oluştururken kullanıcıyı veritabanından çekmek için kullandığım repository.
    private final UserRepository userRepository;

    // Giriş yapmış kullanıcı adına yeni bir görev oluşturan metot.
    public Todo createTodo(Todo todo, Long userId) {

        // ID'si verilen kullanıcının veritabanında gerçekten var olup olmadığını kontrol ediyorum.
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("Kullanıcı bulunamadı!"));

        // Yeni görevi bu kullanıcıyla ilişkilendiriyorum (todos tablosundaki user_id sütununu doldurur).
        todo.setUser(user);

        // Kullanıcıya bağlanan görevi veritabanına kaydedip geri döndürüyorum.
        return todoRepository.save(todo);
    }

    // Sadece giriş yapan kullanıcının kendi görevlerini listeleyen metot.
    public List<Todo> getTodosByUserId(Long userId) {
        return todoRepository.findByUserId(userId);
    }

    // Kullanıcının görevlerini tamamlanma durumuna (yapıldı / yapılmadı) göre filtreleyen metot.
    public List<Todo> getTodosByUserIdAndCompleted(
            Long userId,
            boolean completed
    ) {
        return todoRepository.findByUserIdAndCompleted(
                userId,
                completed
        );
    }

    // Güvenlik kalkanı: Görevi hem görev ID'si hem de kullanıcı ID'si ile sorgulayan ortak doğrulama metodum.
    public Todo getTodoByIdAndUserId(Long id, Long userId) {
        return todoRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Hata: Todo bulunamadı veya bu kullanıcıya ait değil!"
                        ));
    }

    // Bir görevin başlık, açıklama ve tamamlanma durumunu güncelleyen metot.
    public Todo updateTodo(
            Long id,
            Todo updatedTodo,
            Long userId
    ) {
        // Önce görevin gerçekten bu kullanıcıya ait olup olmadığını doğruluyorum.
        Todo todo = getTodoByIdAndUserId(id, userId);

        // Formdan gelen yeni değerleri mevcut kayda aktarıyorum.
        todo.setTitle(updatedTodo.getTitle());
        todo.setDescription(updatedTodo.getDescription());
        todo.setCompleted(updatedTodo.isCompleted());

        // Değişiklikleri veritabanına kaydediyorum.
        return todoRepository.save(todo);
    }

    // Görevin yapıldı/yapılmadı kutucuğuna tıklandığında durumunu tersine çeviren pratik metot.
    public Todo toggleTodoCompletion(Long id, Long userId) {
        // Görevin kullanıcıya ait olduğunu doğruluyorum.
        Todo todo = getTodoByIdAndUserId(id, userId);

        // Mevcut durumu tersine çeviriyorum (true ise false, false ise true yap).
        todo.setCompleted(!todo.isCompleted());

        // Yeni durumu kaydedip döndürüyorum.
        return todoRepository.save(todo);
    }

    // Görevi veritabanından kalıcı olarak silen metot.
    public void deleteTodo(Long id, Long userId) {
        // Kullanıcı sadece kendi görevini silebilsin diye önce sahiplik kontrolü yapıyorum.
        Todo todo = getTodoByIdAndUserId(id, userId);

        // Görevi veritabanından kaldırıyorum.
        todoRepository.delete(todo);
    }
}
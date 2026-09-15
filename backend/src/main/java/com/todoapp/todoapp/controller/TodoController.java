package com.todoapp.todoapp.controller;

import com.todoapp.todoapp.entity.Todo;
import com.todoapp.todoapp.security.UserPrincipal;
import com.todoapp.todoapp.service.TodoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Giriş yapan kullanıcının Todo işlemlerini yöneten controller sınıfıdır.
 *
 * Bu sınıftaki tüm endpointler /api/todos adresi altında çalışır.
 * Kullanıcı bilgisi request içinden manuel olarak alınmaz; Spring Security
 * tarafından doğrulanmış UserPrincipal nesnesi kullanılır.
 *
 * Böylece kullanıcı yalnızca kendi Todo kayıtları üzerinde işlem yapar.
 */
@RestController
@RequestMapping("/api/todos")
@RequiredArgsConstructor
public class TodoController {

    /**
     * Todo oluşturma, listeleme, güncelleme ve silme işlemlerini
     * gerçekleştiren servis katmanıdır.
     */
    private final TodoService todoService;

    /**
     * Giriş yapan kullanıcı için yeni bir Todo oluşturur.
     *
     * @Valid anotasyonu, Todo entity'sindeki doğrulama kurallarını çalıştırır.
     * @AuthenticationPrincipal ise JWT doğrulaması sonucunda oluşturulan
     * kullanıcı bilgisini Spring Security context'inden alır.
     *
     * Endpoint:
     * POST /api/todos
     *
     * @param todo frontend tarafından gönderilen Todo bilgileri
     * @param principal giriş yapan kullanıcıya ait güvenlik bilgileri
     * @return veritabanına kaydedilen Todo
     */
    @PostMapping
    public ResponseEntity<Todo> createTodo(
            @Valid @RequestBody Todo todo,
            @AuthenticationPrincipal UserPrincipal principal) {

        Todo createdTodo = todoService.createTodo(
                todo,
                principal.getId()
        );

        return ResponseEntity.ok(createdTodo);
    }

    /**
     * Giriş yapan kullanıcıya ait tüm Todo kayıtlarını listeler.
     *
     * Kullanıcı ID'si frontend'den alınmaz. JWT ile doğrulanan principal
     * nesnesinden elde edilir. Bu yaklaşım, başka bir kullanıcının ID'sini
     * göndererek onun kayıtlarına erişilmesini engeller.
     *
     * Endpoint:
     * GET /api/todos
     *
     * @param principal giriş yapan kullanıcıya ait güvenlik bilgileri
     * @return kullanıcıya ait Todo listesi
     */
    @GetMapping
    public ResponseEntity<List<Todo>> getTodos(
            @AuthenticationPrincipal UserPrincipal principal) {

        List<Todo> todos =
                todoService.getTodosByUserId(principal.getId());

        return ResponseEntity.ok(todos);
    }

    /**
     * Giriş yapan kullanıcıya ait tamamlanmış Todo kayıtlarını listeler.
     *
     * Endpoint:
     * GET /api/todos/completed
     *
     * @param principal giriş yapan kullanıcıya ait güvenlik bilgileri
     * @return tamamlanmış Todo listesi
     */
    @GetMapping("/completed")
    public ResponseEntity<List<Todo>> getCompletedTodos(
            @AuthenticationPrincipal UserPrincipal principal) {

        List<Todo> todos =
                todoService.getTodosByUserIdAndCompleted(
                        principal.getId(),
                        true
                );

        return ResponseEntity.ok(todos);
    }

    /**
     * Giriş yapan kullanıcıya ait tamamlanmamış Todo kayıtlarını listeler.
     *
     * Endpoint:
     * GET /api/todos/pending
     *
     * @param principal giriş yapan kullanıcıya ait güvenlik bilgileri
     * @return tamamlanmamış Todo listesi
     */
    @GetMapping("/pending")
    public ResponseEntity<List<Todo>> getPendingTodos(
            @AuthenticationPrincipal UserPrincipal principal) {

        List<Todo> todos =
                todoService.getTodosByUserIdAndCompleted(
                        principal.getId(),
                        false
                );

        return ResponseEntity.ok(todos);
    }

    /**
     * Belirtilen Todo kaydının başlık, açıklama veya tamamlanma durumunu
     * günceller.
     *
     * Kullanıcı ID'si servis katmanına gönderilir. Servis katmanı, güncellenecek
     * Todo'nun gerçekten giriş yapan kullanıcıya ait olup olmadığını kontrol
     * etmelidir.
     *
     * Endpoint:
     * PUT /api/todos/{id}
     *
     * @param id güncellenecek Todo kaydının ID değeri
     * @param updatedTodo frontend tarafından gönderilen yeni Todo bilgileri
     * @param principal giriş yapan kullanıcıya ait güvenlik bilgileri
     * @return güncellenmiş Todo
     */
    @PutMapping("/{id}")
    public ResponseEntity<Todo> updateTodo(
            @PathVariable Long id,
            @Valid @RequestBody Todo updatedTodo,
            @AuthenticationPrincipal UserPrincipal principal) {

        Todo todo = todoService.updateTodo(
                id,
                updatedTodo,
                principal.getId()
        );

        return ResponseEntity.ok(todo);
    }

    /**
     * Todo kaydının tamamlanma durumunu değiştirir.
     *
     * Tamamlanmamış bir Todo tamamlanmış, tamamlanmış bir Todo ise
     * tamamlanmamış hale getirilir.
     *
     * Endpoint:
     * PUT /api/todos/{id}/toggle
     *
     * @param id durumu değiştirilecek Todo kaydının ID değeri
     * @param principal giriş yapan kullanıcıya ait güvenlik bilgileri
     * @return tamamlanma durumu değiştirilmiş Todo
     */
    @PutMapping("/{id}/toggle")
    public ResponseEntity<Todo> toggleTodoCompletion(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {

        Todo updatedTodo = todoService.toggleTodoCompletion(
                id,
                principal.getId()
        );

        return ResponseEntity.ok(updatedTodo);
    }

    /**
     * Belirtilen Todo kaydını siler.
     *
     * Servis katmanı, silinecek kaydın giriş yapan kullanıcıya ait olduğunu
     * doğruladıktan sonra silme işlemini gerçekleştirir.
     *
     * Endpoint:
     * DELETE /api/todos/{id}
     *
     * @param id silinecek Todo kaydının ID değeri
     * @param principal giriş yapan kullanıcıya ait güvenlik bilgileri
     * @return içerik içermeyen 204 No Content cevabı
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTodo(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {

        todoService.deleteTodo(
                id,
                principal.getId()
        );

        return ResponseEntity.noContent().build();
    }
}
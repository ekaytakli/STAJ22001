package com.todoapp.todoapp.controller;

import com.todoapp.todoapp.dto.CreateTodoRequest;
import com.todoapp.todoapp.dto.UpdateTodoRequest;
import com.todoapp.todoapp.dto.TodoResponse;
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
     * @Valid anotasyonu, istek DTO'sundaki doğrulama kurallarını çalıştırır.
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
    public ResponseEntity<TodoResponse> createTodo(
            @Valid @RequestBody CreateTodoRequest todo,
            @AuthenticationPrincipal UserPrincipal principal) {

        TodoResponse createdTodo = todoService.createTodo(
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
    @GetMapping("/page")
    public com.todoapp.todoapp.dto.TodoPageResponse getPage(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "all") String status, @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String category, @RequestParam(defaultValue = "") String priority,
            @RequestParam(defaultValue = "default") String sort) {
        return todoService.getPage(principal.getId(), page, size, status, search, category, priority, sort);
    }

    @GetMapping
    public ResponseEntity<List<TodoResponse>> getTodos(
            @AuthenticationPrincipal UserPrincipal principal) {

        List<TodoResponse> todos =
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
    public ResponseEntity<List<TodoResponse>> getCompletedTodos(
            @AuthenticationPrincipal UserPrincipal principal) {

        List<TodoResponse> todos =
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
    public ResponseEntity<List<TodoResponse>> getPendingTodos(
            @AuthenticationPrincipal UserPrincipal principal) {

        List<TodoResponse> todos =
                todoService.getTodosByUserIdAndCompleted(
                        principal.getId(),
                        false
                );

        return ResponseEntity.ok(todos);
    }

    /**
     * Belirtilen Todo kaydının başlık, açıklama, öncelik, kategori ve tamamlanma durumunu
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
    public ResponseEntity<TodoResponse> updateTodo(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTodoRequest updatedTodo,
            @AuthenticationPrincipal UserPrincipal principal) {

        TodoResponse todo = todoService.updateTodo(
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
    public ResponseEntity<TodoResponse> toggleTodoCompletion(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {

        TodoResponse updatedTodo = todoService.toggleTodoCompletion(
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

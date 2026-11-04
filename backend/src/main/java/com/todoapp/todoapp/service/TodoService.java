package com.todoapp.todoapp.service;

import com.todoapp.todoapp.entity.Todo;
import com.todoapp.todoapp.dto.CreateTodoRequest;
import com.todoapp.todoapp.dto.UpdateTodoRequest;
import com.todoapp.todoapp.dto.TodoResponse;
import com.todoapp.todoapp.dto.TodoMapper;
import com.todoapp.todoapp.entity.User;
import com.todoapp.todoapp.repository.TodoRepository;
import com.todoapp.todoapp.repository.UserRepository;
import com.todoapp.todoapp.exception.ApiException;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.LinkedHashMap;

// Görevlerle (Todo) ilgili tüm iş mantığını ve kullanıcı yetki kontrollerini yürüttüğüm servis katmanım.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TodoService {

    // Görevlerin veritabanı işlemlerini yönettiğim repository.
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public com.todoapp.todoapp.dto.TodoPageResponse getPage(Long userId, int page, int size,
            String status, String search, String category, String priority, String sort) {
        if (page < 0 || size < 1 || size > 100 || search.length() > 255 || category.length() > 255
                || !List.of("all", "pending", "completed").contains(status)
                || !List.of("", "LOW", "MEDIUM", "HIGH").contains(priority)
                || !List.of("default", "title-asc", "title-desc", "priority-asc", "priority-desc", "created-desc", "updated-desc", "due-asc").contains(sort)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid pagination or filter parameters.");
        }
        org.springframework.data.jpa.domain.Specification<Todo> spec = (root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            predicates.add(cb.equal(root.get("user").get("id"), userId));
            if (!status.equals("all")) predicates.add(cb.equal(root.get("completed"), status.equals("completed")));
            // Explicit Turkish case folding is independent of the database's default locale.
            java.util.function.Function<jakarta.persistence.criteria.Expression<String>, jakarta.persistence.criteria.Expression<String>> fold =
                    value -> cb.lower(cb.function("translate", String.class, value, cb.literal("I\u0130\u00c7\u011e\u00d6\u015e\u00dc"), cb.literal("\u0131i\u00e7\u011f\u00f6\u015f\u00fc")));
            String term = search.strip().toLowerCase(Locale.forLanguageTag("tr-TR"));
            if (!term.isEmpty()) {
                String pattern = "%" + term.replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
                predicates.add(cb.or(cb.like(fold.apply(root.get("title")), pattern, '!'),
                        cb.like(fold.apply(root.get("description")), pattern, '!')));
            }
            if (!category.isBlank()) {
                var normalized = cb.trim(cb.function("regexp_replace", String.class,
                        cb.coalesce(root.get("category"), ""),
                        cb.literal("[[:space:]\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+"),
                        cb.literal(" "), cb.literal("g")));
                var effectiveCategory = cb.<String>selectCase().when(cb.equal(normalized, ""), "Genel").otherwise(normalized);
                predicates.add(cb.equal(fold.apply(effectiveCategory), normalizeCategory(category).toLowerCase(Locale.forLanguageTag("tr-TR"))));
            }
            if (!priority.isEmpty()) predicates.add(cb.equal(root.get("priority"), com.todoapp.todoapp.entity.Priority.valueOf(priority)));
            if (query != null && query.getResultType() != Long.class) {
                var orders = new java.util.ArrayList<jakarta.persistence.criteria.Order>();
                if (sort.startsWith("title")) {
                    var title = ((org.hibernate.query.criteria.HibernateCriteriaBuilder) cb)
                            .collate(fold.apply(root.get("title")), "\"tr-x-icu\"");
                    orders.add(sort.endsWith("asc") ? cb.asc(title) : cb.desc(title));
                }
                else if (sort.startsWith("priority")) {
                    var rank = cb.<Integer>selectCase().when(cb.equal(root.get("priority"), com.todoapp.todoapp.entity.Priority.HIGH), 3)
                            .when(cb.equal(root.get("priority"), com.todoapp.todoapp.entity.Priority.MEDIUM), 2).otherwise(1);
                    orders.add(sort.endsWith("asc") ? cb.asc(rank) : cb.desc(rank));
                } else if (!sort.equals("default")) {
                    String field = sort.equals("created-desc") ? "createdAt" : sort.equals("updated-desc") ? "updatedAt" : "dueDate";
                    orders.add(cb.asc(cb.<Integer>selectCase().when(cb.isNull(root.get(field)), 1).otherwise(0)));
                    orders.add(sort.equals("due-asc") ? cb.asc(root.get(field)) : cb.desc(root.get(field)));
                }
                orders.add(cb.desc(root.get("id")));
                query.orderBy(orders);
            }
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
        long count = todoRepository.count(spec);
        int pages = (int) Math.ceil((double) count / size);
        int actualPage = Math.min(page, Math.max(0, pages - 1));
        var result = todoRepository.findAll(spec, org.springframework.data.domain.PageRequest.of(actualPage, size));
        return new com.todoapp.todoapp.dto.TodoPageResponse(result.getContent().stream().map(TodoMapper::toResponse).toList(),
                actualPage, size, count, pages, todoRepository.countByUserId(userId),
                todoRepository.countByUserIdAndCompleted(userId, true), categoryNames(userId));
    }

    static String normalizeCategory(String category) {
        if (category == null) return "Genel";
        String normalized = category.replaceAll("(?U)\\s+", " ").strip();
        return normalized.isEmpty() ? "Genel" : normalized;
    }

    private List<String> categoryNames(Long userId) {
        var names = new LinkedHashMap<String, String>();
        for (String value : todoRepository.findCategoriesByUserId(userId)) {
            String normalized = normalizeCategory(value);
            names.putIfAbsent(normalized.toLowerCase(Locale.forLanguageTag("tr-TR")), normalized);
        }
        return List.copyOf(names.values());
    }

    private String resolveCategory(String category, Long userId) {
        String normalized = normalizeCategory(category);
        Locale turkish = Locale.forLanguageTag("tr-TR");
        String key = normalized.toLowerCase(turkish);
        return categoryNames(userId).stream()
                .filter(value -> value.toLowerCase(turkish).equals(key))
                .findFirst().orElse(normalized);
    }

    private final TodoRepository todoRepository;

    // Görevi oluştururken kullanıcıyı veritabanından çekmek için kullandığım repository.
    private final UserRepository userRepository;

    // Giriş yapmış kullanıcı adına yeni bir görev oluşturan metot.
    @Transactional
    public TodoResponse createTodo(CreateTodoRequest request, Long userId) {

        // ID'si verilen kullanıcının veritabanında gerçekten var olup olmadığını kontrol ediyorum.
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ApiException(HttpStatus.NOT_FOUND,"Kullanıcı bulunamadı!"));

        // Yeni görevi bu kullanıcıyla ilişkilendiriyorum (todos tablosundaki user_id sütununu doldurur).
        Todo todo = new Todo();
        todo.setTitle(request.getTitle());
        todo.setDescription(request.getDescription());
        todo.setPriority(request.getPriority());
        todo.setCategory(resolveCategory(request.getCategory(), userId));
        todo.setDueDate(request.getDueDate());
        todo.setCompleted(false);
        todo.setUser(user);

        // Kullanıcıya bağlanan görevi veritabanına kaydedip geri döndürüyorum.
        return TodoMapper.toResponse(todoRepository.saveAndFlush(todo));
    }

    // Sadece giriş yapan kullanıcının kendi görevlerini listeleyen metot.
    public List<TodoResponse> getTodosByUserId(Long userId) {
        return todoRepository.findByUserId(userId).stream().map(TodoMapper::toResponse).toList();
    }

    // Kullanıcının görevlerini tamamlanma durumuna (yapıldı / yapılmadı) göre filtreleyen metot.
    public List<TodoResponse> getTodosByUserIdAndCompleted(
            Long userId,
            boolean completed
    ) {
        return todoRepository.findByUserIdAndCompleted(
                userId,
                completed
        ).stream().map(TodoMapper::toResponse).toList();
    }

    // Güvenlik kalkanı: Görevi hem görev ID'si hem de kullanıcı ID'si ile sorgulayan ortak doğrulama metodum.
    private Todo getTodoByIdAndUserId(Long id, Long userId) {
        return todoRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() ->
                        new ApiException(HttpStatus.NOT_FOUND,
                                "Hata: Todo bulunamadı veya bu kullanıcıya ait değil!"
                        ));
    }

    // Görevin başlık, açıklama, durum, öncelik ve kategori alanlarını günceller.
    @Transactional
    public TodoResponse updateTodo(
            Long id,
            UpdateTodoRequest updatedTodo,
            Long userId
    ) {
        // Önce görevin gerçekten bu kullanıcıya ait olup olmadığını doğruluyorum.
        Todo todo = getTodoByIdAndUserId(id, userId);

        // Formdan gelen yeni değerleri mevcut kayda aktarıyorum.
        todo.setTitle(updatedTodo.getTitle());
        todo.setDescription(updatedTodo.getDescription());
        todo.setCompleted(updatedTodo.getCompleted());
        todo.setPriority(updatedTodo.getPriority());
        todo.setCategory(resolveCategory(updatedTodo.getCategory(), userId));
        todo.setDueDate(updatedTodo.getDueDate());

        // Değişiklikleri veritabanına kaydediyorum.
        return TodoMapper.toResponse(todoRepository.saveAndFlush(todo));
    }

    // Görevin yapıldı/yapılmadı kutucuğuna tıklandığında durumunu tersine çeviren pratik metot.
    @Transactional
    public TodoResponse toggleTodoCompletion(Long id, Long userId) {
        // Görevin kullanıcıya ait olduğunu doğruluyorum.
        Todo todo = getTodoByIdAndUserId(id, userId);

        // Mevcut durumu tersine çeviriyorum (true ise false, false ise true yap).
        todo.setCompleted(!todo.isCompleted());

        // Yeni durumu kaydedip döndürüyorum.
        return TodoMapper.toResponse(todoRepository.saveAndFlush(todo));
    }

    // Görevi veritabanından kalıcı olarak silen metot.
    @Transactional
    public void deleteTodo(Long id, Long userId) {
        // Kullanıcı sadece kendi görevini silebilsin diye önce sahiplik kontrolü yapıyorum.
        Todo todo = getTodoByIdAndUserId(id, userId);

        // Görevi veritabanından kaldırıyorum.
        todoRepository.delete(todo);
    }
}

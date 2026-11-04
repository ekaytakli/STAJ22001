package com.todoapp.todoapp.integration;

import com.todoapp.todoapp.dto.TodoPageResponse;
import com.todoapp.todoapp.dto.UpdateTodoRequest;
import com.todoapp.todoapp.entity.Priority;
import com.todoapp.todoapp.entity.Todo;
import com.todoapp.todoapp.entity.User;
import com.todoapp.todoapp.repository.TodoRepository;
import com.todoapp.todoapp.repository.UserRepository;
import com.todoapp.todoapp.service.TodoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
    "app.jwt.secret=integration-test-only-signing-key-not-for-production",
    "spring.jpa.show-sql=false", "spring.jpa.hibernate.ddl-auto=validate",
    "spring.flyway.baseline-on-migrate=true"
})
@EnabledIfEnvironmentVariable(named = "TEST_DB_URL", matches = ".+")
@Transactional
class TodoPostgresIntegrationTests {
    @DynamicPropertySource
    static void database(DynamicPropertyRegistry properties) {
        String url = System.getenv("TEST_DB_URL");
        if (url == null || !url.matches("jdbc:postgresql://[^/]+/todo_integration")) {
            throw new IllegalStateException("Integration tests require a dedicated database named todo_integration.");
        }
        properties.add("spring.datasource.url", () -> url);
        properties.add("spring.datasource.username", () -> System.getenv("TEST_DB_USERNAME"));
        properties.add("spring.datasource.password", () -> System.getenv("TEST_DB_PASSWORD"));
    }

    @Autowired TodoService service;
    @Autowired TodoRepository todos;
    @Autowired UserRepository users;
    User owner;
    User other;

    @BeforeEach
    void fixtures() {
        owner = user();
        other = user();
    }
    User user() {
        User user = new User();
        String unique = UUID.randomUUID().toString();
        user.setUsername(unique);
        user.setEmail(unique + "@example.test");
        user.setPassword("test-only");
        return users.saveAndFlush(user);
    }
    Todo task(User user, String title, boolean completed, Priority priority, String category, LocalDate due) {
        Todo task = new Todo();
        task.setUser(user);
        task.setTitle(title);
        task.setCompleted(completed);
        task.setPriority(priority);
        task.setCategory(category);
        task.setDueDate(due);
        return todos.saveAndFlush(task);
    }
    TodoPageResponse page(int number, int size, String status, String search, String category, String priority, String sort) {
        return service.getPage(owner.getId(), number, size, status, search, category, priority, sort);
    }

    @Test
    void searchUsesTurkishCaseForTitleAndNullableDescription() {
        task(owner, "\u0130\u015f plan\u0131", false, Priority.HIGH, "Genel", null);
        Todo note = task(owner, "Notes", false, Priority.LOW, "Genel", null);
        note.setDescription("I\u015f\u0131k kontrol\u00fc");
        todos.saveAndFlush(note);
        assertEquals(1, page(0, 10, "all", "i\u015f", "", "", "default").totalElements());
        assertEquals(1, page(0, 10, "all", "\u0131\u015f\u0131k", "", "", "default").totalElements());
        task(owner, "\u00c7\u00d6\u011e\u00dc\u015e", false, Priority.LOW, "Genel", null);
        assertEquals(1, page(0, 10, "all", "\u00e7\u00f6\u011f\u00fc\u015f", "", "", "default").totalElements());
        assertEquals(0, page(0, 10, "all", "missing", "", "", "default").totalElements());
    }

    @Test
    void searchTreatsSqlWildcardsAsLiteralText() {
        task(owner, "Budget 100%_!", false, Priority.MEDIUM, "Genel", null);
        task(owner, "Budget 100XX", false, Priority.MEDIUM, "Genel", null);
        assertEquals(1, page(0, 10, "all", "%_!", "", "", "default").totalElements());
    }

    @Test
    void combinesFiltersAndKeepsGlobalSummaryIsolatedByOwner() {
        task(owner, "Plan", false, Priority.HIGH, "\u0130\u015f", null);
        task(owner, "Plan done", true, Priority.HIGH, "\u0130\u015f", null);
        task(owner, "Plan low", false, Priority.LOW, "Home", null);
        task(other, "Plan secret", false, Priority.HIGH, "Secret", null);
        var result = page(0, 10, "pending", "plan", "i\u015f", "HIGH", "default");
        assertEquals(1, result.totalElements());
        assertEquals(3, result.total());
        assertEquals(1, result.completed());
        assertFalse(result.categories().contains("Secret"));
        assertEquals("Plan", result.items().getFirst().title());
    }

    @Test
    void pagesHaveNoOverlapAndDeletionClampsToLastPage() {
        for (int i = 0; i < 12; i++) task(owner, "Task " + i, false, Priority.MEDIUM, "Genel", null);
        var first = page(0, 10, "all", "", "", "", "default");
        var second = page(1, 10, "all", "", "", "", "default");
        assertEquals(12, first.totalElements());
        assertEquals(2, first.totalPages());
        assertEquals(10, first.items().size());
        assertEquals(2, second.items().size());
        assertTrue(first.items().stream().noneMatch(a -> second.items().stream().anyMatch(b -> a.id().equals(b.id()))));
        second.items().forEach(todo -> service.deleteTodo(todo.id(), owner.getId()));
        todos.flush();
        assertEquals(0, page(1, 10, "all", "", "", "", "default").page());
    }

    @Test
    void sortsTurkishAlphabetIndependentlyOfDatabaseLocale() {
        for (String title : List.of("Zebra", "\u00dcz\u00fcm", "\u015eeker", "Saman", "\u00c7anta", "Ceviz", "I\u015f\u0131k", "\u0130pek")) {
            task(owner, title, false, Priority.MEDIUM, "Genel", null);
        }
        var result = page(0, 10, "all", "", "", "", "title-asc");
        assertEquals(List.of("Ceviz", "\u00c7anta", "I\u015f\u0131k", "\u0130pek", "Saman", "\u015eeker", "\u00dcz\u00fcm", "Zebra"),
                result.items().stream().map(todo -> todo.title()).toList());
    }

    @Test
    void priorityRanksAndDatesSortWithMissingDatesLast() {
        Todo low = task(owner, "Low", false, Priority.LOW, "Genel", null);
        Todo high = task(owner, "High", false, Priority.HIGH, "Genel", LocalDate.of(2027, 1, 1));
        task(owner, "Medium", false, Priority.MEDIUM, "Genel", LocalDate.of(2027, 2, 1));
        assertEquals(high.getId(), page(0, 10, "all", "", "", "", "priority-desc").items().getFirst().id());
        var due = page(0, 10, "all", "", "", "", "due-asc");
        assertEquals(high.getId(), due.items().getFirst().id());
        assertEquals(low.getId(), due.items().getLast().id());
    }

    @Test
    void emptyOwnerHasAnEmptyPageAndZeroSummary() {
        task(other, "Private", false, Priority.HIGH, "Secret", null);
        var result = page(99, 10, "all", "", "", "", "default");
        assertTrue(result.items().isEmpty());
        assertEquals(0, result.page());
        assertEquals(0, result.totalPages());
        assertEquals(0, result.total());
        assertTrue(result.categories().isEmpty());
    }

    @Test
    void legacyCategoryVariantsShareOneSuggestionAndFilter() {
        task(owner, "First", false, Priority.MEDIUM, "  İş\t Notları  ", null);
        task(owner, "Second", false, Priority.MEDIUM, "iş  notları", null);
        task(owner, "Third", false, Priority.MEDIUM, "\u00a0İŞ\u00a0NOTLARI\u00a0", null);
        task(other, "Private", false, Priority.MEDIUM, "Secret", null);
        var result = page(0, 10, "all", "", "iş notları", "", "default");
        assertEquals(3, result.totalElements());
        assertEquals(List.of("İş Notları"), result.categories());
        // Reading/filtering legacy records does not rewrite their stored names.
        assertEquals("  İş\t Notları  ", todos.findByUserId(owner.getId()).getFirst().getCategory());
    }

    @Test
    void missingLegacyCategoryMatchesGeneral() {
        task(owner, "Null", false, Priority.MEDIUM, null, null);
        task(owner, "Blank", false, Priority.MEDIUM, "\t  ", null);
        var result = page(0, 10, "all", "", "Genel", "", "default");
        assertEquals(2, result.totalElements());
        assertEquals(List.of("Genel"), result.categories());
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void failedUpdateRollsBackAllFieldsInItsOwnTransaction() {
        try {
            Todo original = task(owner, "Original", false, Priority.MEDIUM, "Home", null);
            UpdateTodoRequest request = new UpdateTodoRequest();
            request.setTitle("x".repeat(256));
            request.setDescription("Must roll back");
            request.setCompleted(true);
            request.setPriority(Priority.HIGH);
            request.setCategory("Work");
            assertThrows(org.springframework.dao.DataIntegrityViolationException.class,
                    () -> service.updateTodo(original.getId(), request, owner.getId()));
            Todo persisted = todos.findById(original.getId()).orElseThrow();
            assertEquals("Original", persisted.getTitle());
            assertNull(persisted.getDescription());
            assertFalse(persisted.isCompleted());
            assertEquals(Priority.MEDIUM, persisted.getPriority());
            assertEquals("Home", persisted.getCategory());
        } finally {
            cleanupCommittedFixtures();
        }
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void simultaneousTogglesDoNotLoseAnUpdate() throws Exception {
        try {
            Todo original = task(owner, "Concurrent", false, Priority.MEDIUM, "Home", null);
            Long userId = owner.getId();
            var start = new java.util.concurrent.CountDownLatch(1);
            try (var executor = java.util.concurrent.Executors.newFixedThreadPool(2)) {
                java.util.concurrent.Callable<Boolean> toggle = () -> {
                    start.await();
                    return service.toggleTodoCompletion(original.getId(), userId).completed();
                };
                var first = executor.submit(toggle);
                var second = executor.submit(toggle);
                start.countDown();
                boolean firstResult = first.get(10, java.util.concurrent.TimeUnit.SECONDS);
                boolean secondResult = second.get(10, java.util.concurrent.TimeUnit.SECONDS);
                assertNotEquals(firstResult, secondResult);
            }
            assertFalse(todos.findById(original.getId()).orElseThrow().isCompleted());
        } finally {
            cleanupCommittedFixtures();
        }
    }

    private void cleanupCommittedFixtures() {
        for (User user : List.of(owner, other)) {
            todos.deleteAll(todos.findByUserId(user.getId()));
            users.deleteById(user.getId());
        }
    }
}

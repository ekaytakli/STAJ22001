package com.todoapp.todoapp.entity;

import com.todoapp.todoapp.dto.TodoMapper;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.time.LocalDate;
import static org.junit.jupiter.api.Assertions.*;

class TodoDatesTests {
    @Test
    void creationSetsServerTimestampsAndPreservesDueDate() {
        Todo todo = new Todo();
        LocalDate due = LocalDate.of(2027, 1, 15);
        todo.setDueDate(due);
        todo.onCreate();
        assertNotNull(todo.getCreatedAt());
        assertEquals(todo.getCreatedAt(), todo.getUpdatedAt());
        var response = TodoMapper.toResponse(todo);
        assertEquals(due, response.dueDate());
        assertEquals(todo.getCreatedAt(), response.createdAt());
        assertEquals(todo.getUpdatedAt(), response.updatedAt());
    }

    @Test
    void updatePreservesCreationTimestampAndAllowsClearingDueDate() {
        Todo todo = new Todo();
        Instant original = Instant.parse("2020-01-01T00:00:00Z");
        todo.setCreatedAt(original);
        todo.setUpdatedAt(original);
        todo.setDueDate(null);
        todo.onUpdate();
        assertEquals(original, todo.getCreatedAt());
        assertTrue(todo.getUpdatedAt().isAfter(original));
        assertNull(TodoMapper.toResponse(todo).dueDate());
    }

    @Test
    void legacyDatesRemainUnknownUntilUpdated() {
        Todo todo = new Todo();
        todo.onUpdate();
        assertNull(TodoMapper.toResponse(todo).createdAt());
        assertNotNull(todo.getUpdatedAt());
    }
}

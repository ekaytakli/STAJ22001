package com.todoapp.todoapp.service;

import com.todoapp.todoapp.dto.CreateTodoRequest;
import com.todoapp.todoapp.dto.UpdateTodoRequest;
import com.todoapp.todoapp.entity.Priority;
import com.todoapp.todoapp.entity.Todo;
import com.todoapp.todoapp.entity.User;
import com.todoapp.todoapp.exception.ApiException;
import com.todoapp.todoapp.repository.TodoRepository;
import com.todoapp.todoapp.repository.UserRepository;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class TodoServiceTests {
    private final TodoRepository todos = mock(TodoRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final TodoService service = new TodoService(todos, users);

    @Test
    void createAssignsAuthenticatedOwnerAndPendingStatus() {
        User owner = new User();
        owner.setId(7L);
        when(users.findById(7L)).thenReturn(Optional.of(owner));
        when(todos.findByUserId(7L)).thenReturn(List.of());
        when(todos.saveAndFlush(any(Todo.class))).thenAnswer(call -> {
            Todo saved = call.getArgument(0);
            assertSame(owner, saved.getUser());
            saved.setId(3L);
            return saved;
        });
        CreateTodoRequest request = new CreateTodoRequest();
        request.setTitle("Task");
        request.setPriority(Priority.HIGH);
        request.setCategory("  Work  ");
        request.setDueDate(LocalDate.of(2027, 1, 1));
        var response = service.createTodo(request, 7L);
        assertEquals(3L, response.id());
        assertFalse(response.completed());
        assertEquals(Priority.HIGH, response.priority());
        assertEquals("Work", response.category());
        assertEquals(request.getDueDate(), response.dueDate());
    }

    @Test
    void unknownOwnerCannotCreateTask() {
        when(users.findById(7L)).thenReturn(Optional.empty());
        assertThrows(ApiException.class, () -> service.createTodo(new CreateTodoRequest(), 7L));
        verifyNoInteractions(todos);
    }

    @Test
    void anotherUsersTaskCannotBeUpdatedToggledOrDeleted() {
        when(todos.findByIdAndUserId(3L, 7L)).thenReturn(Optional.empty());
        assertThrows(ApiException.class, () -> service.updateTodo(3L, new UpdateTodoRequest(), 7L));
        assertThrows(ApiException.class, () -> service.toggleTodoCompletion(3L, 7L));
        assertThrows(ApiException.class, () -> service.deleteTodo(3L, 7L));
        verify(todos, never()).saveAndFlush(any());
        verify(todos, never()).delete(any(Todo.class));
        verify(todos, never()).findById(anyLong());
    }

    @Test
    void ownerCanUpdateAllEditableFieldsAndClearDueDate() {
        Todo existing = new Todo();
        existing.setDueDate(LocalDate.of(2027, 1, 1));
        when(todos.findByIdAndUserId(3L, 7L)).thenReturn(Optional.of(existing));
        when(todos.findByUserId(7L)).thenReturn(List.of());
        when(todos.saveAndFlush(existing)).thenReturn(existing);
        UpdateTodoRequest request = new UpdateTodoRequest();
        request.setTitle("Updated");
        request.setDescription("Details");
        request.setCategory("Home");
        request.setPriority(Priority.LOW);
        request.setCompleted(true);
        request.setDueDate(null);
        var result = service.updateTodo(3L, request, 7L);
        assertEquals("Updated", result.title());
        assertEquals("Details", result.description());
        assertEquals("Home", result.category());
        assertEquals(Priority.LOW, result.priority());
        assertTrue(result.completed());
        assertNull(result.dueDate());
    }

    @Test
    void ownerCanToggleBothWaysAndDelete() {
        Todo existing = new Todo();
        when(todos.findByIdAndUserId(3L, 7L)).thenReturn(Optional.of(existing));
        when(todos.saveAndFlush(existing)).thenReturn(existing);
        assertTrue(service.toggleTodoCompletion(3L, 7L).completed());
        assertFalse(service.toggleTodoCompletion(3L, 7L).completed());
        service.deleteTodo(3L, 7L);
        verify(todos).delete(existing);
    }
}

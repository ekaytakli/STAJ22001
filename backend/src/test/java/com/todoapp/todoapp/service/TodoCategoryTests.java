package com.todoapp.todoapp.service;

import com.todoapp.todoapp.dto.CreateTodoRequest;
import com.todoapp.todoapp.entity.Todo;
import com.todoapp.todoapp.entity.User;
import com.todoapp.todoapp.repository.TodoRepository;
import com.todoapp.todoapp.repository.UserRepository;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TodoCategoryTests {
    @Test
    void normalizesWhitespace() {
        assertEquals("Work Notes", TodoService.normalizeCategory("  Work \t Notes  "));
    }

    @Test
    void reusesCurrentUsersCategoryWithTurkishCaseMatching() {
        TodoRepository todos = mock(TodoRepository.class);
        UserRepository users = mock(UserRepository.class);
        when(users.findById(7L)).thenReturn(Optional.of(new User()));
        Todo existing = new Todo();
        existing.setId(1L);
        existing.setCategory("\u0130\u015f Notlar\u0131");
        when(todos.findCategoriesByUserId(7L)).thenReturn(List.of(existing.getCategory()));
        when(todos.saveAndFlush(any(Todo.class))).thenAnswer(invocation -> invocation.getArgument(0));
        CreateTodoRequest request = new CreateTodoRequest();
        request.setTitle("Test");
        request.setCategory("  i\u015f   notlar\u0131  ");
        var result = new TodoService(todos, users).createTodo(request, 7L);
        assertEquals(existing.getCategory(), result.category());
        verify(todos).findCategoriesByUserId(7L);
    }
}

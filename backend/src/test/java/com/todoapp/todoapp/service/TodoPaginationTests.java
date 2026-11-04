package com.todoapp.todoapp.service;

import com.todoapp.todoapp.entity.Todo;
import com.todoapp.todoapp.exception.ApiException;
import com.todoapp.todoapp.repository.TodoRepository;
import com.todoapp.todoapp.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class TodoPaginationTests {
    @Test
    void rejectsInvalidSizePageStatusAndSortBeforeQuerying() {
        TodoRepository repository = mock(TodoRepository.class);
        TodoService service = new TodoService(repository, mock(UserRepository.class));
        assertThrows(ApiException.class, () -> service.getPage(7L, -1, 10, "all", "", "", "", "default"));
        assertThrows(ApiException.class, () -> service.getPage(7L, 0, 101, "all", "", "", "", "default"));
        assertThrows(ApiException.class, () -> service.getPage(7L, 0, 10, "other", "", "", "", "default"));
        assertThrows(ApiException.class, () -> service.getPage(7L, 0, 10, "all", "", "", "", "user"));
        verifyNoInteractions(repository);
    }

    @Test
    @SuppressWarnings("unchecked")
    void clampsPageAfterDeletionAndReturnsGlobalSummary() {
        TodoRepository repository = mock(TodoRepository.class);
        when(repository.count(any(Specification.class))).thenReturn(10L);
        when(repository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(new PageImpl<Todo>(List.of()));
        when(repository.countByUserId(7L)).thenReturn(40L);
        when(repository.countByUserIdAndCompleted(7L, true)).thenReturn(30L);
        when(repository.findCategoriesByUserId(7L)).thenReturn(List.of("Work"));
        var result = new TodoService(repository, mock(UserRepository.class))
                .getPage(7L, 1, 10, "pending", "", "", "", "due-asc");
        assertEquals(0, result.page());
        assertEquals(1, result.totalPages());
        assertEquals(10, result.totalElements());
        assertEquals(40, result.total());
        assertEquals(30, result.completed());
        assertEquals(List.of("Work"), result.categories());
        verify(repository).findAll(any(Specification.class), argThat((Pageable page) -> page.getPageNumber() == 0 && page.getPageSize() == 10));
    }
}

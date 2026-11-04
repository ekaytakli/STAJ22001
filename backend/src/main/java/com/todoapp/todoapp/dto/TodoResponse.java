package com.todoapp.todoapp.dto;

import com.todoapp.todoapp.entity.Priority;
import java.time.Instant;
import java.time.LocalDate;

public record TodoResponse(
        Long id,
        String title,
        String description,
        boolean completed,
        Priority priority,
        String category,
        LocalDate dueDate,
        Instant createdAt,
        Instant updatedAt
) {
}

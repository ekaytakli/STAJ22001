package com.todoapp.todoapp.dto;

import com.todoapp.todoapp.entity.Priority;

public record TodoResponse(
        Long id,
        String title,
        String description,
        boolean completed,
        Priority priority,
        String category
) {
}

package com.todoapp.todoapp.dto;

import com.todoapp.todoapp.entity.Todo;

public final class TodoMapper {
    private TodoMapper() {
    }

    public static TodoResponse toResponse(Todo todo) {
        return new TodoResponse(
                todo.getId(), todo.getTitle(), todo.getDescription(),
                todo.isCompleted(), todo.getPriority(), todo.getCategory());
    }
}

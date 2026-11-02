package com.todoapp.todoapp.dto;

import com.todoapp.todoapp.entity.Priority;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateTodoRequest {
    private String title;
    private String description;
    private Priority priority = Priority.MEDIUM;
    private String category = "Genel";
}

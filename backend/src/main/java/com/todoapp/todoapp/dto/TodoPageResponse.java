package com.todoapp.todoapp.dto;
import java.util.List;
public record TodoPageResponse(List<TodoResponse> items, int page, int size, long totalElements,
        int totalPages, long total, long completed, List<String> categories) {}

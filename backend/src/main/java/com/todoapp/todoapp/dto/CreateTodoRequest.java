package com.todoapp.todoapp.dto;

import com.todoapp.todoapp.entity.Priority;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateTodoRequest {
    @NotBlank(message = "Başlık boş olamaz.")
    @Size(max = 255, message = "Başlık en fazla 255 karakter olabilir.")
    private String title;
    @Size(max = 255, message = "Açıklama en fazla 255 karakter olabilir.")
    private String description;
    @NotNull(message = "Öncelik boş olamaz.")
    private Priority priority = Priority.MEDIUM;
    @NotBlank(message = "Kategori boş olamaz.")
    @Size(max = 255, message = "Kategori en fazla 255 karakter olabilir.")
    private String category = "Genel";
}

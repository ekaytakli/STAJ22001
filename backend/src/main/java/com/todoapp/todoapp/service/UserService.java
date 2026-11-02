package com.todoapp.todoapp.service;

import com.todoapp.todoapp.entity.User;
import com.todoapp.todoapp.repository.UserRepository;
import com.todoapp.todoapp.exception.ApiException;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import com.todoapp.todoapp.dto.UserProfileResponse;

// Kullanıcı yönetimiyle (profil sorgulama) ilgili temel iş mantıklarını yürüttüğüm servis katmanım.
@Service
@RequiredArgsConstructor
public class UserService {

    // Veritabanındaki "users" tablosuyla haberleşmek için kullandığım repository.
    private final UserRepository userRepository;

    // Verilen ID değerine göre veritabanından tek bir kullanıcıyı çeken metot.
    public UserProfileResponse getUserProfile(Long id) {

        // ID veritabanında yoksa genel bir hata fırlatarak akışı güvenli şekilde sonlandırıyorum.
        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ApiException(HttpStatus.NOT_FOUND,
                                "Hata: " + id
                                        + " ID'li kullanıcı bulunamadı!"
                        ));
        return new UserProfileResponse(user.getId(), user.getUsername(), user.getEmail());
    }
}

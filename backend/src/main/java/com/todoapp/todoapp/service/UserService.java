package com.todoapp.todoapp.service;

import com.todoapp.todoapp.entity.User;
import com.todoapp.todoapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.todoapp.todoapp.dto.UserProfileResponse;

// Kullanıcı yönetimiyle (kayıt ve profil sorgulama) ilgili temel iş mantıklarını yürüttüğüm servis katmanım.
@Service
@RequiredArgsConstructor
public class UserService {

    // Veritabanındaki "users" tablosuyla haberleşmek için kullandığım repository.
    private final UserRepository userRepository;

    // Şifreyi açık metin bırakmayıp veritabanına hash'leyerek yazmak için kullandığım BCrypt kodlayıcım.
    private final PasswordEncoder passwordEncoder;

    // Yeni kullanıcı oluşturan metot.
    public User registerUser(User user) {

        // Aynı kullanıcı adının sistemde önceden kayıtlı olup olmadığını kontrol ediyorum.
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException(
                    "Hata: Bu kullanıcı adı zaten kullanılmaktadır!"
            );
        }

        // Aynı e-posta adresiyle mükerrer hesap açılmasını engelliyorum.
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException(
                    "Hata: Bu e-posta adresi zaten kullanılmaktadır!"
            );
        }

        // Şifreyi açık metin halinden çıkarıp BCrypt ile geri döndürülemez biçimde hash'liyorum.
        user.setPassword(
                passwordEncoder.encode(user.getPassword())
        );

        // Doğrulamaları geçen kullanıcıyı veritabanına kaydedip kaydedilen nesneyi geri dönüyorum.
        return userRepository.save(user);
    }

    // Verilen ID değerine göre veritabanından tek bir kullanıcıyı çeken metot.
    public UserProfileResponse getUserProfile(Long id) {

        // ID veritabanında yoksa genel bir hata fırlatarak akışı güvenli şekilde sonlandırıyorum.
        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Hata: " + id
                                        + " ID'li kullanıcı bulunamadı!"
                        ));
        return new UserProfileResponse(user.getId(), user.getUsername(), user.getEmail());
    }
}

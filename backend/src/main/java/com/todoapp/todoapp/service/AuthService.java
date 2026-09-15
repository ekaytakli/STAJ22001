package com.todoapp.todoapp.service;

import com.todoapp.todoapp.dto.LoginRequest;
import com.todoapp.todoapp.dto.LoginResponse;
import com.todoapp.todoapp.dto.RegisterRequest;
import com.todoapp.todoapp.entity.User;
import com.todoapp.todoapp.repository.UserRepository;
import com.todoapp.todoapp.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

// Kullanıcı kayıt ve giriş işlemlerinin tüm iş kurallarını (business logic) yönettiğim servis sınıfım.
@Service
@RequiredArgsConstructor
public class AuthService {

    // Kullanıcı sorguları ve kayıt işlemleri için veritabanı erişim katmanım.
    private final UserRepository userRepository;

    // Şifreleri BCrypt ile hash'lemek ve giriş yaparken hash'leri kıyaslamak için kullandığım kodlayıcı.
    private final PasswordEncoder passwordEncoder;

    // Giriş başarılı olduğunda kullanıcıya özel JWT biletini üreten servis.
    private final JwtService jwtService;

    // Kullanıcının sisteme giriş yapma sürecini yöneten metot.
    public LoginResponse login(LoginRequest loginRequest) {

        // Kullanıcı adına göre veritabanında arama yapıyorum; kullanıcı yoksa genel bir hata mesajı veriyorum.
        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() ->
                        new RuntimeException("Hatalı kullanıcı adı veya şifre!"));

        // Formdan gelen açık şifreyi, veritabanındaki BCrypt hash'i ile eşleşiyor mu diye kontrol ediyorum.
        if (!passwordEncoder.matches(
                loginRequest.getPassword(),
                user.getPassword()
        )) {
            // Bilgi sızıntısı olmaması için şifre veya kullanıcı adının hangisinin hatalı olduğunu açıkça belirtmiyorum.
            throw new RuntimeException("Hatalı kullanıcı adı veya şifre!");
        }

        // Kimlik bilgileri doğruysa kullanıcı adına imzalı 1 saatlik JWT token üretiyorum.
        String token = jwtService.generateToken(user);

        // React tarafına token, kullanıcı ID'si ve kullanıcı adından oluşan yanıt paketimi dönüyorum.
        return new LoginResponse(
                token,
                user.getId(),
                user.getUsername()
        );
    }

    // Yeni kullanıcı hesabı oluşturma sürecini yöneten metot.
    public User register(RegisterRequest registerRequest) {

        // Aynı kullanıcı adının sistemde önceden alınıp alınmadığını kontrol ediyorum.
        if (userRepository.existsByUsername(
                registerRequest.getUsername()
        )) {
            throw new RuntimeException(
                    "Bu kullanıcı adı zaten kullanılıyor!"
            );
        }

        // Aynı e-posta adresiyle başka bir hesap açılmış mı diye kontrol ediyorum.
        if (userRepository.existsByEmail(
                registerRequest.getEmail()
        )) {
            throw new RuntimeException(
                    "Bu e-posta adresi zaten kayıtlı!"
            );
        }

        // Veritabanına yazılacak yeni User nesnesini oluşturuyorum.
        User user = new User();

        // DTO'dan gelen kullanıcı adı ve e-posta bilgilerini entity nesnesine aktarıyorum.
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());

        // Kullanıcının girdiği açık metin şifreyi BCrypt ile geri döndürülemez şekilde hash'leyip öyle atıyorum.
        user.setPassword(
                passwordEncoder.encode(
                        registerRequest.getPassword()
                )
        );

        // Kullanıcıyı veritabanına kalıcı olarak kaydedip oluşturulan entity'yi geri döndürüyorum.
        return userRepository.save(user);
    }
}
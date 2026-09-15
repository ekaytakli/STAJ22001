package com.todoapp.todoapp.security;

import com.todoapp.todoapp.entity.User;
import com.todoapp.todoapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

// Spring Security'nin kendi kullanıcı doğrulama yapısı ile veritabanım arasındaki köprüyü kuran servis sınıfım.
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    // Veritabanındaki "users" tablosuna erişip kullanıcıyı aramak için repository'yi enjekte ediyorum.
    @Autowired
    private UserRepository userRepository;

    // Spring Security ve JWT filtrem kullanıcıyı sorgulamak istediğinde otomatik olarak bu metodu tetikler.
    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        // Kullanıcı adına göre veritabanında arama yapıyorum; kullanıcı yoksa hata fırlatarak işlemi kesiyorum.
        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new UsernameNotFoundException("Kullanıcı bulunamadı."));

        // Bulunan kendi User entity nesnemi, Spring Security'nin dilinden anlayan UserPrincipal nesnesine sarıp teslim ediyorum.
        return new UserPrincipal(user);
    }
}
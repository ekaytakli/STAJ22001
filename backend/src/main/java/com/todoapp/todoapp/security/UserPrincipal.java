package com.todoapp.todoapp.security;

import com.todoapp.todoapp.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

// Kendi User entity'mi Spring Security'nin standart kimlik kartı formatına (UserDetails) çeviren adaptör sınıfım.
public class UserPrincipal implements UserDetails {

    // Veritabanından çektiğim orijinal kullanıcı nesnesini burada tutuyorum.
    private final User user;

    // Veritabanından gelen User nesnesini alıp bu adaptörün içine yerleştiren yapıcı metot.
    public UserPrincipal(User user) {
        this.user = user;
    }

    // Projede Admin/User gibi ayrı roller kullanmadığım için yetki listesini şimdilik boş dönüyorum.
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.emptyList();
    }

    // Spring Security'nin şifre eşleştirmesi yapabilmesi için hash'lenmiş şifreyi teslim ediyorum.
    @Override
    public String getPassword() {
        return user.getPassword();
    }

    // Spring Security'nin kullanıcıyı tanıması için kullanıcı adını veriyorum.
    @Override
    public String getUsername() {
        return user.getUsername();
    }

    // Controller katmanında @AuthenticationPrincipal ile doğrudan kullanıcının ID'sine ulaşıp todo'ları filtrelemek için yazdığım özel getter.
    public Long getId() {
        return user.getId();
    }

    // Hesabın kullanım süresinin dolmadığını (ömür boyu geçerli) belirtmek için doğrudan true dönüyorum.
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    // Kullanıcının hatalı girişler sonucu kilitlenmediğini belirtmek için doğrudan true dönüyorum.
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    // Kullanıcının şifresinin süresinin dolmadığını bildirmek için doğrudan true dönüyorum.
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    // Kullanıcı hesabının aktif/açık olduğunu onaylamak için doğrudan true dönüyorum.
    @Override
    public boolean isEnabled() {
        return true;
    }
}
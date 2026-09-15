package com.todoapp.todoapp.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// Her HTTP isteğinde bir kez araya girip gelen JWT token'ı kontrol eden güvenlik filtre sınıfım.
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    // Token'ı çözmek, içinden kullanıcı adını almak ve geçerliliğini test etmek için kullandığım servis.
    private final JwtService jwtService;

    // Token'dan çıkan kullanıcı adıyla veritabanına gidip kullanıcıyı yükleyen servis.
    private final UserDetailsServiceImpl userDetailsService;

    // Gelen isteğin controller'a gitmeden önce kontrol edildiği ana filtreleme metodum.
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // React'in gönderdiği istek başlığından Authorization alanını okuyorum.
        String authHeader = request.getHeader("Authorization");

        // Başlık boşsa veya 'Bearer ' ile başlamıyorsa token yok demektir; isteği bekletmeden zincirdeki sonraki adıma bırakıyorum.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // 'Bearer ' kelimesi 7 karakter olduğu için başından kırpıp sadece saf token metnini alıyorum.
            String token = authHeader.substring(7);

            // Token'ın içini açıp şifrelenmiş kullanıcı adını (username) çekiyorum.
            String username = jwtService.extractUsername(token);

            // Kullanıcı adı bulunduysa ve bu istek için sistemde henüz aktif bir oturum kaydı açılmamışsa kontrole devam ediyorum.
            if (username != null
                    && SecurityContextHolder.getContext().getAuthentication() == null) {

                // Token'daki kullanıcı adıyla veritabanına gidip kullanıcının güncel yetki ve hesap bilgilerini çekiyorum.
                UserDetails userDetails =
                        userDetailsService.loadUserByUsername(username);

                // Token'ın süresinin dolup dolmadığını ve gerçekten bu kullanıcıya ait olup olmadığını doğruluyorum.
                if (jwtService.isTokenValid(
                        token,
                        userDetails.getUsername()
                )) {

                    // Token geçerli olduğu için Spring Security'ye "Bu kullanıcı doğrulandı" diyecek kimlik kartını oluşturuyorum (şifre yerine null veriyorum).
                    UsernamePasswordAuthenticationToken authenticationToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    // İsteğin geldiği IP ve tarayıcı detaylarını bu kimlik kartına iliştiriyorum.
                    authenticationToken.setDetails(
                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request)
                    );

                    // Onaylanmış kullanıcıyı Spring'in güvenlik hafızasına (SecurityContext) teslim ediyorum; böylece Controller'lar kullanıcıyı tanıyabiliyor.
                    SecurityContextHolder
                            .getContext()
                            .setAuthentication(authenticationToken);
                }
            }
        } catch (RuntimeException ignored) {
            // Token sahteyse, bozulmuşsa veya süresi dolmuşsa güvenlik hafızasını sıfırlıyorum ki sahte kimlikle içeri sızılamasın.
            SecurityContextHolder.clearContext();
        }

        // Kimlik kontrolü bitti; isteğin diğer güvenlik adımlarına ve ardından Controller'a geçmesine izin veriyorum.
        filterChain.doFilter(request, response);
    }
}
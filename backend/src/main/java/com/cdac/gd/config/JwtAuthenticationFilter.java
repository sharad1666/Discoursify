package com.cdac.gd.config;

import com.cdac.gd.repository.UserRepository;
import com.cdac.gd.model.User;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.Collections;
import java.util.Optional;
import java.util.Base64;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                // Decode Payload (Unsecured for MVP - relies on Frontend Firebase validation)
                String[] parts = token.split("\\.");
                if (parts.length > 1) {
                    String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
                    String email = extractEmail(payload);

                    if (email != null) {
                        Optional<User> userOpt = userRepository.findByEmail(email);
                        if (userOpt.isPresent()) {
                            User user = userOpt.get();

                            // CRITICAL: Block Banned Users
                            if ("banned".equalsIgnoreCase(user.getStatus())) {
                                boolean isAdmin = "shivtejbhilare@gmail.com".equalsIgnoreCase(user.getEmail()) ||
                                        "bhilareshivtejofficial@gmail.com".equalsIgnoreCase(user.getEmail());

                                if (!isAdmin) {
                                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                                    response.getWriter().write("User is banned");
                                    return; // Stop processing, request rejected
                                }
                                // If admin, proceed (and UserService will unban on next sync)
                            }

                            // Set Principal for Controller injection
                            String role = user.getRole();
                            if ("bhilareshivtejofficial@gmail.com".equalsIgnoreCase(user.getEmail()) ||
                                    "shivtejbhilare@gmail.com".equalsIgnoreCase(user.getEmail())) {
                                role = "ADMIN";
                            }

                            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                    (java.security.Principal) () -> user.getEmail(),
                                    null,
                                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role)));
                            SecurityContextHolder.getContext().setAuthentication(auth);
                        }
                    }
                }
            } catch (Exception e) {
                // Token invalid, proceed as guest
            }
        }
        filterChain.doFilter(request, response);
    }

    private String extractEmail(String payload) {
        try {
            // Simple regex to extract email from JSON
            java.util.regex.Pattern p = java.util.regex.Pattern.compile("\"email\"\\s*:\\s*\"([^\"]+)\"");
            java.util.regex.Matcher m = p.matcher(payload);
            if (m.find()) {
                return m.group(1);
            }
        } catch (Exception e) {
        }
        return null;
    }
}

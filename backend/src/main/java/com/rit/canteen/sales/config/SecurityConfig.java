package com.rit.canteen.sales.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    // Frontend origins — update this list for production
    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000}")
    private String allowedOriginsStr;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // ── PUBLIC: Auth endpoints (login / register for both user types) ──
                .requestMatchers(HttpMethod.POST, "/api/system/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/check").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/logout").permitAll()

                // ── PUBLIC: Real-time stock updates (SSE — read-only, ordering app listens) ──
                .requestMatchers("/api/stock/stream").permitAll()

                // ── PUBLIC: Terminal hardware order lookup (auth via X-API-KEY header, not JWT) ──
                .requestMatchers("/api/terminals/orders/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/terminals/validate").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/terminals/pair").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/terminals/pair").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/terminals/*/verify-pin").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/terminals/counters").permitAll()

                // ── PUBLIC: Device log ingestion (ESP32 Bill-Bot devices, no JWT) ──
                .requestMatchers(HttpMethod.POST, "/api/device-logs").permitAll()

                // ── PUBLIC: Notifications read (admin frontend polls this before login guard kicks in) ──
                .requestMatchers(HttpMethod.GET, "/api/notifications/**").permitAll()

                // ── PUBLIC: Catalog endpoints (Read-only, allowed for browsing before login) ──
                .requestMatchers(HttpMethod.GET, "/api/stalls/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/base-items/**").permitAll()

                // ── CUSTOMER: ordering app routes (require CUSTOMER or any authenticated role) ──
                .requestMatchers(HttpMethod.POST, "/api/orders").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/orders/user/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/wallet/balance/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/wallet/transactions/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/wallet/topup").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/coupons/redeem").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/feedback/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/feedback/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/auth/user/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/auth/change-pin").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/auth/users/*").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/orders/*").authenticated()

                // ── STAFF/MANAGER/MASTER: All other management APIs ──
                .requestMatchers("/api/**").hasAnyRole("MASTER", "MANAGER", "STAFF", "OPERATOR")

                // Everything else — deny
                .anyRequest().denyAll()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public BCryptPasswordEncoder bCryptPasswordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Explicit allowed origins — no wildcard in production
        List<String> origins = Arrays.asList(allowedOriginsStr.split(","));
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedOriginPatterns(List.of(
            "http://localhost:*",
            "http://192.168.*:*",
            "http://10.*:*"
        ));

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(false);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

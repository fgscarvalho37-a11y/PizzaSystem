package com.pizzasystem.backend.config;

import com.pizzasystem.backend.security.AdminSessionAuthenticationFilter;

import org.springframework.beans.factory.annotation.Value;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;

import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

@Configuration
public class SecurityConfig {

    private final AdminSessionAuthenticationFilter
            adminSessionAuthenticationFilter;

    @Value(
            "${pizzasystem.cors.allowed-origin:http://localhost:3000}"
    )
    private String allowedOrigin;

    public SecurityConfig(
            AdminSessionAuthenticationFilter
                    adminSessionAuthenticationFilter
    ) {

        this.adminSessionAuthenticationFilter =
                adminSessionAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        CookieCsrfTokenRepository csrfRepository =
                CookieCsrfTokenRepository
                        .withHttpOnlyFalse();

        csrfRepository.setCookiePath("/");

        CsrfTokenRequestAttributeHandler csrfHandler =
                new CsrfTokenRequestAttributeHandler();

        http

                // =========================
                // CORS
                // =========================

                .cors(
                        Customizer.withDefaults()
                )

                // =========================
                // FILTRO ADMIN
                // =========================

                .addFilterBefore(
                        adminSessionAuthenticationFilter,
                        CsrfFilter.class
                )

                // =========================
                // CSRF
                // =========================

                .csrf(
                        csrf -> csrf

                                .csrfTokenRepository(
                                        csrfRepository
                                )

                                .csrfTokenRequestHandler(
                                        csrfHandler
                                )

                                // AUTH ADMIN

                                .ignoringRequestMatchers(
                                        "/api/auth/login"
                                )

                                .ignoringRequestMatchers(
                                        "/api/auth/logout"
                                )

                                // AUTH CLIENTE

                                .ignoringRequestMatchers(
                                        "/api/customer-auth/register",
                                        "/api/customer-auth/login",
                                        "/api/customer-auth/logout"
                                )

                                // FIDELIDADE CLIENTE

                                .ignoringRequestMatchers(
                                        "/api/customer/loyalty/*/redeem"
                                )

                                // PEDIDOS PÚBLICOS

                                .ignoringRequestMatchers(
                                        "/api/orders",
                                        "/api/orders/*/cancel"
                                )

                                // PAGAMENTOS

                                .ignoringRequestMatchers(
                                        "/api/payments/**"
                                )
                )

                // =========================
                // GERA COOKIE CSRF
                // =========================

                .addFilterAfter(
                        new OncePerRequestFilter() {

                            @Override
                            protected void doFilterInternal(
                                    HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain
                            ) throws ServletException,
                                    IOException {

                                filterChain.doFilter(
                                        request,
                                        response
                                );

                                CsrfToken csrfToken =
                                        (CsrfToken)
                                                request.getAttribute(
                                                        CsrfToken.class
                                                                .getName()
                                                );

                                if (csrfToken != null) {
                                    csrfToken.getToken();
                                }
                            }
                        },
                        CsrfFilter.class
                )

                // =========================
                // AUTORIZAÇÃO
                // =========================

                .authorizeHttpRequests(
                        auth -> auth

                                .requestMatchers(
                                        HttpMethod.OPTIONS,
                                        "/**"
                                )
                                .permitAll()

                                // =========================
                                // AUTENTICAÇÃO
                                // =========================

                                .requestMatchers(
                                        "/api/auth/**"
                                )
                                .permitAll()

                                .requestMatchers(
                                        "/api/customer-auth/**"
                                )
                                .permitAll()

                                // =========================
                                // ÁREA DO CLIENTE
                                // =========================

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/customer/orders"
                                )
                                .permitAll()

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/customer/loyalty"
                                )
                                .permitAll()

                                .requestMatchers(
                                        HttpMethod.POST,
                                        "/api/customer/loyalty/*/redeem"
                                )
                                .permitAll()

                                // =========================
                                // IMAGENS PÚBLICAS
                                // =========================

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/uploads/**"
                                )
                                .permitAll()

                                // =========================
                                // ROTAS PÚBLICAS
                                // =========================

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/public/**"
                                )
                                .permitAll()

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/store/profile"
                                )
                                .permitAll()

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/products/available",
                                        "/api/products/category/*"
                                )
                                .permitAll()

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/categories/**"
                                )
                                .permitAll()

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/delivery-areas/active"
                                )
                                .permitAll()

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/store/status"
                                )
                                .permitAll()

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/coupons/validate"
                                )
                                .permitAll()

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/crusts/active"
                                )
                                .permitAll()

                                .requestMatchers(
                                        HttpMethod.POST,
                                        "/api/orders"
                                )
                                .permitAll()

                                .requestMatchers(
                                        HttpMethod.PATCH,
                                        "/api/orders/*/cancel"
                                )
                                .permitAll()

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/orders/*"
                                )
                                .permitAll()

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/orders/*/items"
                                )
                                .permitAll()

                                .requestMatchers(
                                        "/api/payments/**"
                                )
                                .permitAll()

                                // =========================
                                // RESTANTE = ADMIN
                                // =========================

                                .anyRequest()
                                .hasRole("ADMIN")
                )

                // =========================
                // LOGIN PADRÃO DESATIVADO
                // =========================

                .formLogin(
                        form ->
                                form.disable()
                )

                // =========================
                // BASIC AUTH DESATIVADO
                // =========================

                .httpBasic(
                        basic ->
                                basic.disable()
                )

                // =========================
                // 401
                // =========================

                .exceptionHandling(
                        exceptions ->
                                exceptions
                                        .authenticationEntryPoint(
                                                new HttpStatusEntryPoint(
                                                        HttpStatus.UNAUTHORIZED
                                                )
                                        )
                );

        return http.build();
    }

    // =========================
    // PASSWORD
    // =========================

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }

    // =========================
    // CORS
    // =========================

    @Bean
    public CorsConfigurationSource
    corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of(
                        allowedOrigin
                )
        );

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of(
                        "*"
                )
        );

        configuration.setAllowCredentials(
                true
        );

        configuration.setMaxAge(
                3600L
        );

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}
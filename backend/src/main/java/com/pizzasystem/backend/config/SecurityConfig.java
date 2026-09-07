package com.pizzasystem.backend.config;

import com.pizzasystem.backend.security.AdminSessionAuthenticationFilter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;

import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final AdminSessionAuthenticationFilter
            adminSessionAuthenticationFilter;

    public SecurityConfig(
            AdminSessionAuthenticationFilter
                    adminSessionAuthenticationFilter
    ) {
        this.adminSessionAuthenticationFilter =
                adminSessionAuthenticationFilter;
    }

    // =========================
    // SECURITY FILTER CHAIN
    // =========================

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        CookieCsrfTokenRepository csrfRepository =
                CookieCsrfTokenRepository
                        .withHttpOnlyFalse();

        csrfRepository.setCookiePath(
                "/"
        );

        http

                // =========================
                // CORS
                // =========================

                .cors(
                        Customizer.withDefaults()
                )

                // =========================
                // CSRF
                // =========================

                .csrf(
                        csrf -> csrf

                                .csrfTokenRepository(
                                        csrfRepository
                                )

                                // =========================
                                // LOGIN / LOGOUT
                                // =========================

                                .ignoringRequestMatchers(
                                        "/api/auth/login"
                                )

                                .ignoringRequestMatchers(
                                        "/api/auth/logout"
                                )

                                // =========================
                                // PEDIDO DO CLIENTE
                                // =========================

                                .ignoringRequestMatchers(
                                        "/api/orders"
                                )

                                // =========================
                                // PAGAMENTOS DO CLIENTE
                                // + WEBHOOK MERCADO PAGO
                                // =========================

                                .ignoringRequestMatchers(
                                        "/api/payments/**"
                                )
                )

                // =========================
                // FILTRO DA SESSÃO ADMIN
                // =========================

                .addFilterBefore(
                        adminSessionAuthenticationFilter,
                        AnonymousAuthenticationFilter.class
                )

                // =========================
                // AUTORIZAÇÃO
                // =========================

                .authorizeHttpRequests(
                        auth -> auth

                                // =========================
                                // PREFLIGHT
                                // =========================

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

                                // =========================
                                // PRODUTOS PÚBLICOS
                                // =========================

                              .requestMatchers(
        HttpMethod.GET,
        "/api/products/available",
        "/api/products/category/*"
)
.permitAll()
                                // =========================
                                // CATEGORIAS PÚBLICAS
                                // =========================

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/categories/**"
                                )
                                .permitAll()

                                // =========================
                                // ÁREAS DE ENTREGA PÚBLICAS
                                // =========================

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/delivery-areas/active"
                                )
                                .permitAll()

                                // =========================
                                // STATUS DA LOJA
                                // =========================

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/store/status"
                                )
                                .permitAll()

                                // =========================
                                // VALIDAÇÃO DE CUPOM
                                // =========================

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/coupons/validate"
                                )
                                .permitAll()

                                // =========================
                                // BORDAS ATIVAS
                                // PÚBLICO
                                // =========================

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/crusts/active"
                                )
                                .permitAll()

                                // =========================
                                // CRIAÇÃO DE PEDIDO
                                // =========================

                                .requestMatchers(
                                        HttpMethod.POST,
                                        "/api/orders"
                                )
                                .permitAll()

                                // =========================
                                // ACOMPANHAMENTO DO PEDIDO
                                // =========================

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

                                // =========================
                                // PAGAMENTOS
                                // =========================

                                .requestMatchers(
                                        "/api/payments/**"
                                )
                                .permitAll()

                                // =========================
                                // RESTANTE = ADMIN
                                // =========================

                                .anyRequest()
                                .hasRole(
                                        "ADMIN"
                                )
                )

                // =========================
                // LOGIN HTML DESATIVADO
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
                // NÃO AUTENTICADO = 401
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
    // PASSWORD ENCODER
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
                        "http://localhost:3000"
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
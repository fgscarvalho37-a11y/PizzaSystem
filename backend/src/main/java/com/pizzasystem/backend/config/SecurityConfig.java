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
                                // AUTH ADMIN
                                // =========================

                                .ignoringRequestMatchers(
                                        "/api/auth/login"
                                )

                                .ignoringRequestMatchers(
                                        "/api/auth/logout"
                                )

                                // =========================
                                // AUTH CLIENTE
                                // =========================

                                .ignoringRequestMatchers(
                                        "/api/customer-auth/register",
                                        "/api/customer-auth/login",
                                        "/api/customer-auth/logout"
                                )

                                // =========================
                                // PEDIDOS PÚBLICOS
                                // =========================

                                .ignoringRequestMatchers(
                                        "/api/orders",
                                        "/api/orders/*/cancel"
                                )

                                // =========================
                                // PAGAMENTOS
                                // =========================

                                .ignoringRequestMatchers(
                                        "/api/payments/**"
                                )
                )

                // =========================
                // FILTRO ADMIN
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
                                // OPTIONS
                                // =========================

                                .requestMatchers(
                                        HttpMethod.OPTIONS,
                                        "/**"
                                )
                                .permitAll()

                                // =========================
                                // AUTH ADMIN
                                // =========================

                                .requestMatchers(
                                        "/api/auth/**"
                                )
                                .permitAll()

                                // =========================
                                // AUTH CLIENTE
                                // =========================

                                .requestMatchers(
                                        "/api/customer-auth/**"
                                )
                                .permitAll()

                                // =========================
                                // MEUS PEDIDOS
                                // =========================

                                /*
                                 * Spring libera a chamada,
                                 * mas o controller exige
                                 * CUSTOMER_ID válido na sessão.
                                 */
                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/customer/orders"
                                )
                                .permitAll()

                                // =========================
                                // API PÚBLICA SAAS
                                // =========================

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/public/**"
                                )
                                .permitAll()

                                // =========================
                                // PERFIL PÚBLICO DA STORE
                                // =========================

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/store/profile"
                                )
                                .permitAll()

                                // =========================
                                // PRODUTOS
                                // =========================

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/products/available",
                                        "/api/products/category/*"
                                )
                                .permitAll()

                                // =========================
                                // CATEGORIAS
                                // =========================

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/categories/**"
                                )
                                .permitAll()

                                // =========================
                                // ÁREAS DE ENTREGA
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
                                // CUPOM
                                // =========================

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/coupons/validate"
                                )
                                .permitAll()

                                // =========================
                                // BORDAS
                                // =========================

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/crusts/active"
                                )
                                .permitAll()

                                // =========================
                                // CRIAR PEDIDO
                                // =========================

                                .requestMatchers(
                                        HttpMethod.POST,
                                        "/api/orders"
                                )
                                .permitAll()

                                // =========================
                                // CANCELAR PEDIDO
                                // =========================

                                .requestMatchers(
                                        HttpMethod.PATCH,
                                        "/api/orders/*/cancel"
                                )
                                .permitAll()

                                // =========================
                                // CONSULTAR PEDIDO
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
                // FORM LOGIN
                // =========================

                .formLogin(
                        form ->
                                form.disable()
                )

                // =========================
                // BASIC AUTH
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
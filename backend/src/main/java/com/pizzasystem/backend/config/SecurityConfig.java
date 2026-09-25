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

                .cors(
                        Customizer.withDefaults()
                )

                .addFilterBefore(
                        adminSessionAuthenticationFilter,
                        CsrfFilter.class
                )

                .csrf(
                        csrf -> csrf

                                .csrfTokenRepository(
                                        csrfRepository
                                )

                                .csrfTokenRequestHandler(
                                        csrfHandler
                                )

                                .ignoringRequestMatchers(
                                        "/api/auth/login"
                                )

                                .ignoringRequestMatchers(
                                        "/api/auth/logout"
                                )

                                .ignoringRequestMatchers(
                                        "/api/customer-auth/register",
                                        "/api/customer-auth/login",
                                        "/api/customer-auth/logout"
                                )

                                .ignoringRequestMatchers(
                                        "/api/customer/loyalty/*/redeem"
                                )

                                .ignoringRequestMatchers(
                                        "/api/orders",
                                        "/api/orders/*/cancel"
                                )

                                .ignoringRequestMatchers(
                                        "/api/delivery-areas/quote"
                                )

                                .ignoringRequestMatchers(
                                        "/api/payments/**"
                                )

                                // Backend Orbitta -> PizzaSystem
                                .ignoringRequestMatchers(
                                        "/api/internal/orbitta/**"
                                )
                )

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

                .authorizeHttpRequests(
                        auth -> auth

                                .requestMatchers(
                                        HttpMethod.OPTIONS,
                                        "/**"
                                )
                                .permitAll()

                                .requestMatchers(
                                        "/api/auth/**"
                                )
                                .permitAll()

                                .requestMatchers(
                                        "/api/customer-auth/**"
                                )
                                .permitAll()

                                // A própria rota valida o Bearer secret.
                                .requestMatchers(
                                        "/api/internal/orbitta/**"
                                )
                                .permitAll()

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/admin/mercadopago/oauth/callback"
                                )
                                .permitAll()

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

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/uploads/**"
                                )
                                .permitAll()

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
                                        HttpMethod.POST,
                                        "/api/delivery-areas/quote"
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

                                .anyRequest()
                                .hasRole("ADMIN")
                )

                .formLogin(
                        form ->
                                form.disable()
                )

                .httpBasic(
                        basic ->
                                basic.disable()
                )

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

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

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

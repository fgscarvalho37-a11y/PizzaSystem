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
                                // LOGIN
                                // =========================

                                /*
                                 * Login ainda não possui sessão
                                 * autenticada, então não exigimos
                                 * CSRF nessa operação.
                                 */
                                .ignoringRequestMatchers(
                                        "/api/auth/login"
                                )

                                // =========================
                                // PEDIDO DO CLIENTE
                                // =========================

                                /*
                                 * Pedido público criado pelo
                                 * checkout do cliente.
                                 */
                                .ignoringRequestMatchers(
                                        "/api/orders"
                                )

                                // =========================
                                // PAGAMENTOS / WEBHOOK
                                // =========================

                                /*
                                 * Os endpoints de pagamento
                                 * precisam receber chamadas
                                 * externas, incluindo webhook
                                 * do Mercado Pago.
                                 *
                                 * Vamos auditar esses endpoints
                                 * individualmente no controller.
                                 */
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
                                // LOGIN ADMIN
                                // =========================

                                .requestMatchers(
                                        HttpMethod.POST,
                                        "/api/auth/login"
                                )
                                .permitAll()

                                // =========================
                                // VERIFICAR SESSÃO
                                // =========================

                                /*
                                 * Precisa ser público para que
                                 * o frontend consiga descobrir
                                 * se a sessão existe.
                                 *
                                 * Sem sessão válida, o próprio
                                 * controller retorna 401.
                                 */
                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/auth/me"
                                )
                                .permitAll()

                                // =========================
                                // TOKEN CSRF
                                // =========================

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/auth/csrf"
                                )
                                .permitAll()

                                // =========================
                                // LOGOUT
                                // =========================

                                /*
                                 * Logout só faz sentido para
                                 * uma sessão autenticada.
                                 *
                                 * Diferente do login, ele não
                                 * fica mais liberado por /**.
                                 */
                                .requestMatchers(
                                        HttpMethod.POST,
                                        "/api/auth/logout"
                                )
                                .authenticated()

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
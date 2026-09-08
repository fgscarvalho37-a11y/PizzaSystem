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
                                // PAGAMENTOS
                                // =========================

                                /*
                                 * Os endpoints públicos de pagamento
                                 * precisam receber chamadas do checkout.
                                 *
                                 * O acesso ao pedido continua protegido
                                 * pelo publicAccessToken.
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
                                 * Precisa ser público para o frontend
                                 * descobrir se existe sessão.
                                 *
                                 * Sem sessão válida, o controller
                                 * responde 401.
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

                                .requestMatchers(
                                        HttpMethod.POST,
                                        "/api/auth/logout"
                                )
                                .authenticated()

                                // =========================
                                // API PÚBLICA SAAS
                                // =========================

                                /*
                                 * Endpoints públicos resolvidos
                                 * pelo slug da pizzaria.
                                 *
                                 * Exemplos:
                                 *
                                 * /api/public/stores/misterio-do-sabor
                                 *
                                 * /api/public/stores/
                                 * misterio-do-sabor/menu
                                 *
                                 * Apenas GET fica público.
                                 */
                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/public/**"
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
                                // PERFIL PÚBLICO DA LOJA
                                // =========================

                                /*
                                 * Nome, logo, capa, cores,
                                 * headline, faixa e informações
                                 * públicas do estabelecimento.
                                 *
                                 * Apenas GET é público.
                                 *
                                 * PUT /api/store/profile continua
                                 * protegido pela regra ADMIN.
                                 */
                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/store/profile"
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

                                /*
                                 * Esses endpoints são públicos,
                                 * mas o OrderController exige
                                 * publicAccessToken para clientes.
                                 */
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

                                /*
                                 * Fluxo público do cliente.
                                 *
                                 * O PaymentController valida
                                 * orderId + publicAccessToken.
                                 */
                                .requestMatchers(
                                        "/api/payments/**"
                                )
                                .permitAll()

                                // =========================
                                // RESTANTE = ADMIN
                                // =========================

                                /*
                                 * Qualquer endpoint não listado
                                 * acima exige ROLE_ADMIN.
                                 *
                                 * Continua protegendo:
                                 *
                                 * PUT /api/store/profile
                                 * PUT /api/store
                                 * PATCH /api/store/open
                                 * administração do cardápio
                                 * relatórios
                                 * caixa
                                 * cupons
                                 * configurações
                                 * pedidos administrativos
                                 */
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
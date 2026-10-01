package com.pizzasystem.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CustomerRegisterRequest {

    @NotBlank(message = "Nome é obrigatório.")
    @Size(max = 120, message = "Nome muito longo.")
    private String name;

    @NotBlank(message = "E-mail é obrigatório.")
    @Email(message = "E-mail inválido.")
    @Size(max = 255, message = "E-mail inválido.")
    private String email;

    @Size(max = 40, message = "Telefone inválido.")
    private String phone;

    @NotBlank(message = "Senha é obrigatória.")
    @Size(
            min = 8,
            max = 72,
            message = "A senha deve ter entre 8 e 72 caracteres."
    )
    private String password;

    public CustomerRegisterRequest() {
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}

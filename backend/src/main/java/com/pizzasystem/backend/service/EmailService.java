package com.pizzasystem.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String from;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${app.mail.from}") String from
    ) {
        this.mailSender = mailSender;
        this.from = from;
    }

    public void sendVerificationCode(
            String email,
            String customerName,
            String code
    ) {
        try {
            MimeMessage message =
                    mailSender.createMimeMessage();

            MimeMessageHelper helper =
                    new MimeMessageHelper(
                            message,
                            true,
                            "UTF-8"
                    );

            helper.setFrom(
                    from,
                    "PizzaSystem"
            );

            helper.setTo(email);

            helper.setSubject(
                    "Seu código de verificação - PizzaSystem"
            );

            String safeName =
                    customerName == null
                            || customerName.isBlank()
                            ? "Olá"
                            : "Olá, " + escapeHtml(customerName);

            String html = """
                    <!DOCTYPE html>
                    <html lang="pt-BR">
                    <head>
                        <meta charset="UTF-8">
                    </head>

                    <body style="
                        margin:0;
                        padding:0;
                        background:#f5f5f5;
                        font-family:Arial, Helvetica, sans-serif;
                        color:#18181b;
                    ">

                        <table
                            width="100%%"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            style="
                                background:#f5f5f5;
                                padding:32px 16px;
                            "
                        >
                            <tr>
                                <td align="center">

                                    <table
                                        width="100%%"
                                        cellspacing="0"
                                        cellpadding="0"
                                        border="0"
                                        style="
                                            max-width:560px;
                                            background:#ffffff;
                                            border-radius:18px;
                                            overflow:hidden;
                                            border:1px solid #e4e4e7;
                                        "
                                    >

                                        <tr>
                                            <td style="
                                                background:#18181b;
                                                padding:28px 32px;
                                                text-align:center;
                                            ">
                                                <div style="
                                                    color:#ffffff;
                                                    font-size:24px;
                                                    font-weight:700;
                                                ">
                                                    PizzaSystem
                                                </div>

                                                <div style="
                                                    color:#a1a1aa;
                                                    font-size:13px;
                                                    margin-top:6px;
                                                ">
                                                    Verificação de e-mail
                                                </div>
                                            </td>
                                        </tr>

                                        <tr>
                                            <td style="
                                                padding:36px 32px;
                                            ">

                                                <p style="
                                                    margin:0 0 16px;
                                                    font-size:18px;
                                                    font-weight:600;
                                                ">
                                                    %s
                                                </p>

                                                <p style="
                                                    margin:0;
                                                    color:#52525b;
                                                    font-size:15px;
                                                    line-height:1.6;
                                                ">
                                                    Use o código abaixo para confirmar
                                                    seu endereço de e-mail no PizzaSystem.
                                                </p>

                                                <div style="
                                                    margin:30px 0;
                                                    background:#f4f4f5;
                                                    border-radius:14px;
                                                    padding:24px;
                                                    text-align:center;
                                                ">

                                                    <div style="
                                                        font-size:12px;
                                                        color:#71717a;
                                                        text-transform:uppercase;
                                                        letter-spacing:1px;
                                                        margin-bottom:10px;
                                                    ">
                                                        Seu código
                                                    </div>

                                                    <div style="
                                                        font-size:36px;
                                                        font-weight:700;
                                                        letter-spacing:8px;
                                                        color:#18181b;
                                                    ">
                                                        %s
                                                    </div>

                                                </div>

                                                <p style="
                                                    margin:0;
                                                    color:#52525b;
                                                    font-size:14px;
                                                    line-height:1.6;
                                                ">
                                                    Esse código expira em
                                                    <strong>15 minutos</strong>.
                                                </p>

                                                <p style="
                                                    margin:20px 0 0;
                                                    color:#71717a;
                                                    font-size:13px;
                                                    line-height:1.6;
                                                ">
                                                    Se você não solicitou esta verificação,
                                                    pode ignorar este e-mail.
                                                </p>

                                            </td>
                                        </tr>

                                        <tr>
                                            <td style="
                                                border-top:1px solid #e4e4e7;
                                                padding:20px 32px;
                                                text-align:center;
                                                color:#a1a1aa;
                                                font-size:12px;
                                            ">
                                                PizzaSystem
                                            </td>
                                        </tr>

                                    </table>

                                </td>
                            </tr>
                        </table>

                    </body>
                    </html>
                    """.formatted(
                    safeName,
                    code
            );

            helper.setText(
                    html,
                    true
            );

            mailSender.send(message);

            System.out.println(
                    "[EMAIL] Código de verificação enviado para: "
                            + maskEmail(email)
            );

        } catch (MessagingException e) {

            System.err.println(
                    "[EMAIL] ERRO AO PREPARAR EMAIL"
            );

            e.printStackTrace();

            throw new IllegalStateException(
                    "Não foi possível preparar o e-mail de verificação.",
                    e
            );

        } catch (MailException e) {

            System.err.println(
                    "[EMAIL] ERRO SMTP / SPRING MAIL"
            );

            e.printStackTrace();

            throw new IllegalStateException(
                    "Não foi possível enviar o e-mail de verificação.",
                    e
            );

        } catch (Exception e) {

            System.err.println(
                    "[EMAIL] ERRO INESPERADO"
            );

            e.printStackTrace();

            throw new IllegalStateException(
                    "Não foi possível enviar o e-mail de verificação.",
                    e
            );
        }
    }

    public void sendPasswordResetCode(
            String email,
            String customerName,
            String code
    ) {
        try {
            MimeMessage message =
                    mailSender.createMimeMessage();

            MimeMessageHelper helper =
                    new MimeMessageHelper(
                            message,
                            true,
                            "UTF-8"
                    );

            helper.setFrom(
                    from,
                    "PizzaSystem"
            );

            helper.setTo(email);

            helper.setSubject(
                    "Recuperação de senha - PizzaSystem"
            );

            String safeName =
                    customerName == null
                            || customerName.isBlank()
                            ? "Olá"
                            : "Olá, " + escapeHtml(customerName);

            String html = """
                    <!DOCTYPE html>
                    <html lang="pt-BR">
                    <head>
                        <meta charset="UTF-8">
                    </head>

                    <body style="
                        margin:0;
                        padding:0;
                        background:#f5f5f5;
                        font-family:Arial, Helvetica, sans-serif;
                        color:#18181b;
                    ">

                        <table
                            width="100%%"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            style="
                                background:#f5f5f5;
                                padding:32px 16px;
                            "
                        >
                            <tr>
                                <td align="center">

                                    <table
                                        width="100%%"
                                        cellspacing="0"
                                        cellpadding="0"
                                        border="0"
                                        style="
                                            max-width:560px;
                                            background:#ffffff;
                                            border-radius:18px;
                                            overflow:hidden;
                                            border:1px solid #e4e4e7;
                                        "
                                    >

                                        <tr>
                                            <td style="
                                                background:#18181b;
                                                padding:28px 32px;
                                                text-align:center;
                                            ">
                                                <div style="
                                                    color:#ffffff;
                                                    font-size:24px;
                                                    font-weight:700;
                                                ">
                                                    PizzaSystem
                                                </div>

                                                <div style="
                                                    color:#a1a1aa;
                                                    font-size:13px;
                                                    margin-top:6px;
                                                ">
                                                    Recuperação de senha
                                                </div>
                                            </td>
                                        </tr>

                                        <tr>
                                            <td style="
                                                padding:36px 32px;
                                            ">

                                                <p style="
                                                    margin:0 0 16px;
                                                    font-size:18px;
                                                    font-weight:600;
                                                ">
                                                    %s
                                                </p>

                                                <p style="
                                                    margin:0;
                                                    color:#52525b;
                                                    font-size:15px;
                                                    line-height:1.6;
                                                ">
                                                    Recebemos uma solicitação para redefinir
                                                    a senha da sua conta no PizzaSystem.
                                                </p>

                                                <div style="
                                                    margin:30px 0;
                                                    background:#f4f4f5;
                                                    border-radius:14px;
                                                    padding:24px;
                                                    text-align:center;
                                                ">

                                                    <div style="
                                                        font-size:12px;
                                                        color:#71717a;
                                                        text-transform:uppercase;
                                                        letter-spacing:1px;
                                                        margin-bottom:10px;
                                                    ">
                                                        Código de recuperação
                                                    </div>

                                                    <div style="
                                                        font-size:36px;
                                                        font-weight:700;
                                                        letter-spacing:8px;
                                                        color:#18181b;
                                                    ">
                                                        %s
                                                    </div>

                                                </div>

                                                <p style="
                                                    margin:0;
                                                    color:#52525b;
                                                    font-size:14px;
                                                    line-height:1.6;
                                                ">
                                                    Esse código expira em
                                                    <strong>15 minutos</strong>.
                                                </p>

                                                <p style="
                                                    margin:20px 0 0;
                                                    color:#71717a;
                                                    font-size:13px;
                                                    line-height:1.6;
                                                ">
                                                    Se você não solicitou a recuperação
                                                    da sua senha, ignore este e-mail.
                                                    Sua senha atual continuará funcionando normalmente.
                                                </p>

                                            </td>
                                        </tr>

                                        <tr>
                                            <td style="
                                                border-top:1px solid #e4e4e7;
                                                padding:20px 32px;
                                                text-align:center;
                                                color:#a1a1aa;
                                                font-size:12px;
                                            ">
                                                PizzaSystem
                                            </td>
                                        </tr>

                                    </table>

                                </td>
                            </tr>
                        </table>

                    </body>
                    </html>
                    """.formatted(
                    safeName,
                    code
            );

            helper.setText(
                    html,
                    true
            );

            mailSender.send(message);

            System.out.println(
                    "[EMAIL] Código de recuperação enviado para: "
                            + maskEmail(email)
            );

        } catch (MessagingException e) {

            System.err.println(
                    "[EMAIL] ERRO AO PREPARAR EMAIL DE RECUPERAÇÃO"
            );

            e.printStackTrace();

            throw new IllegalStateException(
                    "Não foi possível preparar o e-mail de recuperação.",
                    e
            );

        } catch (MailException e) {

            System.err.println(
                    "[EMAIL] ERRO SMTP / SPRING MAIL - RECUPERAÇÃO"
            );

            e.printStackTrace();

            throw new IllegalStateException(
                    "Não foi possível enviar o e-mail de recuperação.",
                    e
            );

        } catch (Exception e) {

            System.err.println(
                    "[EMAIL] ERRO INESPERADO - RECUPERAÇÃO"
            );

            e.printStackTrace();

            throw new IllegalStateException(
                    "Não foi possível enviar o e-mail de recuperação.",
                    e
            );
        }
    }

    private String escapeHtml(
            String value
    ) {
        if (value == null) {
            return "";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String maskEmail(
            String email
    ) {
        if (email == null
                || email.isBlank()
                || !email.contains("@")) {
            return "***";
        }

        String[] parts =
                email.split("@", 2);

        String local =
                parts[0];

        String domain =
                parts[1];

        if (local.length() <= 2) {
            return "***@" + domain;
        }

        return local.substring(0, 2)
                + "***@"
                + domain;
    }
}
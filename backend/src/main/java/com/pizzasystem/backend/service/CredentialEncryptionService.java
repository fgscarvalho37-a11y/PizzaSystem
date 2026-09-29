package com.pizzasystem.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class CredentialEncryptionService {

    private static final String PREFIX =
            "v1:";

    private static final int IV_LENGTH =
            12;

    private static final int TAG_LENGTH_BITS =
            128;

    private final SecureRandom secureRandom =
            new SecureRandom();

    @Value(
            "${PIZZASYSTEM_CREDENTIAL_ENCRYPTION_KEY:}"
    )
    private String encodedKey;

    public String encrypt(
            String plainText
    ) {

        if (
                plainText == null ||
                plainText.isBlank()
        ) {
            return null;
        }

        try {
            byte[] key =
                    getKey();

            byte[] iv =
                    new byte[
                            IV_LENGTH
                    ];

            secureRandom.nextBytes(
                    iv
            );

            Cipher cipher =
                    Cipher.getInstance(
                            "AES/GCM/NoPadding"
                    );

            cipher.init(
                    Cipher.ENCRYPT_MODE,
                    new SecretKeySpec(
                            key,
                            "AES"
                    ),
                    new GCMParameterSpec(
                            TAG_LENGTH_BITS,
                            iv
                    )
            );

            byte[] encrypted =
                    cipher.doFinal(
                            plainText
                                    .getBytes(
                                            StandardCharsets.UTF_8
                                    )
                    );

            byte[] combined =
                    new byte[
                            iv.length +
                            encrypted.length
                    ];

            System.arraycopy(
                    iv,
                    0,
                    combined,
                    0,
                    iv.length
            );

            System.arraycopy(
                    encrypted,
                    0,
                    combined,
                    iv.length,
                    encrypted.length
            );

            return PREFIX
                    + Base64
                    .getEncoder()
                    .encodeToString(
                            combined
                    );

        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Não foi possível proteger a credencial.",
                    exception
            );
        }
    }

    public String decrypt(
            String encryptedValue
    ) {

        if (
                encryptedValue == null ||
                encryptedValue.isBlank()
        ) {
            return null;
        }

        if (
                !encryptedValue.startsWith(
                        PREFIX
                )
        ) {
            throw new IllegalStateException(
                    "Formato de credencial protegida inválido."
            );
        }

        try {
            byte[] key =
                    getKey();

            byte[] combined =
                    Base64
                            .getDecoder()
                            .decode(
                                    encryptedValue
                                            .substring(
                                                    PREFIX.length()
                                            )
                            );

            if (
                    combined.length <=
                    IV_LENGTH
            ) {
                throw new IllegalStateException(
                        "Credencial protegida inválida."
                );
            }

            byte[] iv =
                    java.util.Arrays.copyOfRange(
                            combined,
                            0,
                            IV_LENGTH
                    );

            byte[] encrypted =
                    java.util.Arrays.copyOfRange(
                            combined,
                            IV_LENGTH,
                            combined.length
                    );

            Cipher cipher =
                    Cipher.getInstance(
                            "AES/GCM/NoPadding"
                    );

            cipher.init(
                    Cipher.DECRYPT_MODE,
                    new SecretKeySpec(
                            key,
                            "AES"
                    ),
                    new GCMParameterSpec(
                            TAG_LENGTH_BITS,
                            iv
                    )
            );

            return new String(
                    cipher.doFinal(
                            encrypted
                    ),
                    StandardCharsets.UTF_8
            );

        } catch (
                IllegalStateException exception
        ) {
            throw exception;

        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Não foi possível ler a credencial protegida.",
                    exception
            );
        }
    }

    private byte[] getKey() {

        if (
                encodedKey == null ||
                encodedKey.isBlank()
        ) {
            throw new IllegalStateException(
                    "PIZZASYSTEM_CREDENTIAL_ENCRYPTION_KEY não configurada."
            );
        }

        byte[] key;

        try {
            key =
                    Base64
                            .getDecoder()
                            .decode(
                                    encodedKey
                                            .trim()
                            );

        } catch (
                IllegalArgumentException exception
        ) {
            throw new IllegalStateException(
                    "PIZZASYSTEM_CREDENTIAL_ENCRYPTION_KEY inválida.",
                    exception
            );
        }

        if (
                key.length != 32
        ) {
            throw new IllegalStateException(
                    "PIZZASYSTEM_CREDENTIAL_ENCRYPTION_KEY deve ter 32 bytes em Base64."
            );
        }

        return key;
    }
}

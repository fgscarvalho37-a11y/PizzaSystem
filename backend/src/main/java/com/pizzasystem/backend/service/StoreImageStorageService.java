package com.pizzasystem.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.Set;
import java.util.UUID;

@Service
public class StoreImageStorageService {

    private static final long MAX_FILE_SIZE =
            5L * 1024L * 1024L;

    private static final Set<String> ALLOWED_CONTENT_TYPES =
            Set.of(
                    MediaType.IMAGE_JPEG_VALUE,
                    MediaType.IMAGE_PNG_VALUE,
                    "image/webp"
            );

    private final String supabaseUrl;
    private final String serviceRoleKey;
    private final String bucket;
    private final Path localUploadRoot;

    private final HttpClient httpClient =
            HttpClient.newBuilder()
                    .connectTimeout(
                            Duration.ofSeconds(
                                    15
                            )
                    )
                    .build();

    public StoreImageStorageService(
            @Value("${supabase.url:}")
            String supabaseUrl,
            @Value("${supabase.service-role-key:}")
            String serviceRoleKey,
            @Value("${pizzasystem.storage.bucket:pizzasystem-assets}")
            String bucket,
            @Value("${pizzasystem.upload-dir:uploads}")
            String localUploadDirectory
    ) {

        this.supabaseUrl =
                normalizeBaseUrl(
                        supabaseUrl
                );

        this.serviceRoleKey =
                serviceRoleKey == null
                        ? ""
                        : serviceRoleKey.trim();

        this.bucket =
                bucket == null ||
                bucket.isBlank()
                        ? "pizzasystem-assets"
                        : bucket.trim();

        this.localUploadRoot =
                Paths.get(
                        localUploadDirectory
                )
                        .toAbsolutePath()
                        .normalize();
    }

    public String saveImage(
            Long storeId,
            MultipartFile file,
            String prefix
    ) throws IOException {

        if (storeId == null) {
            throw new IllegalArgumentException(
                    "Loja inválida."
            );
        }

        validateImage(
                file
        );

        String extension =
                extensionFor(
                        file.getContentType()
                );

        String fileName =
                prefix
                        + "-"
                        + UUID.randomUUID()
                        + "."
                        + extension;

        if (supabaseConfigured()) {
            return saveToSupabase(
                    storeId,
                    file,
                    fileName
            );
        }

        return saveLocally(
                storeId,
                file,
                fileName
        );
    }

    public void deleteOldImage(
            Long storeId,
            String oldUrl,
            String newUrl
    ) throws IOException {

        if (
                storeId == null ||
                oldUrl == null ||
                oldUrl.isBlank() ||
                oldUrl.equals(
                        newUrl
                )
        ) {
            return;
        }

        if (
                supabaseConfigured() &&
                oldUrl.startsWith(
                        publicBucketPrefix()
                )
        ) {
            deleteFromSupabase(
                    oldUrl.substring(
                            publicBucketPrefix()
                                    .length()
                    )
            );

            return;
        }

        deleteLocalImage(
                storeId,
                oldUrl
        );
    }

    private String saveToSupabase(
            Long storeId,
            MultipartFile file,
            String fileName
    ) throws IOException {

        String objectKey =
                "stores/"
                        + storeId
                        + "/"
                        + fileName;

        HttpRequest request =
                HttpRequest.newBuilder()
                        .uri(
                                URI.create(
                                        objectEndpoint(
                                                objectKey
                                        )
                                )
                        )
                        .timeout(
                                Duration.ofSeconds(
                                        30
                                )
                        )
                        .header(
                                "Authorization",
                                "Bearer "
                                        + serviceRoleKey
                        )
                        .header(
                                "apikey",
                                serviceRoleKey
                        )
                        .header(
                                "Content-Type",
                                file.getContentType()
                        )
                        .header(
                                "x-upsert",
                                "false"
                        )
                        .POST(
                                HttpRequest
                                        .BodyPublishers
                                        .ofByteArray(
                                                file.getBytes()
                                        )
                        )
                        .build();

        try {
            HttpResponse<String> response =
                    httpClient.send(
                            request,
                            HttpResponse
                                    .BodyHandlers
                                    .ofString()
                    );

            if (
                    response.statusCode() < 200 ||
                    response.statusCode() >= 300
            ) {
                throw new IOException(
                        "Falha ao armazenar imagem no Supabase. HTTP "
                                + response.statusCode()
                );
            }

            return publicBucketPrefix()
                    + objectKey;

        } catch (InterruptedException exception) {
            Thread.currentThread()
                    .interrupt();

            throw new IOException(
                    "Upload interrompido.",
                    exception
            );
        }
    }

    private String saveLocally(
            Long storeId,
            MultipartFile file,
            String fileName
    ) throws IOException {

        Path storeDirectory =
                getLocalStoreDirectory(
                        storeId
                );

        Files.createDirectories(
                storeDirectory
        );

        Path destination =
                storeDirectory
                        .resolve(
                                fileName
                        )
                        .normalize();

        if (!destination.startsWith(
                storeDirectory
        )) {
            throw new IllegalArgumentException(
                    "Destino de arquivo inválido."
            );
        }

        try (
                var inputStream =
                        file.getInputStream()
        ) {
            Files.copy(
                    inputStream,
                    destination,
                    StandardCopyOption
                            .REPLACE_EXISTING
            );
        }

        return "/uploads/stores/"
                + storeId
                + "/"
                + fileName;
    }

    private void deleteFromSupabase(
            String objectKey
    ) throws IOException {

        if (
                objectKey == null ||
                objectKey.isBlank()
        ) {
            return;
        }

        HttpRequest request =
                HttpRequest.newBuilder()
                        .uri(
                                URI.create(
                                        objectEndpoint(
                                                objectKey
                                        )
                                )
                        )
                        .timeout(
                                Duration.ofSeconds(
                                        20
                                )
                        )
                        .header(
                                "Authorization",
                                "Bearer "
                                        + serviceRoleKey
                        )
                        .header(
                                "apikey",
                                serviceRoleKey
                        )
                        .DELETE()
                        .build();

        try {
            HttpResponse<String> response =
                    httpClient.send(
                            request,
                            HttpResponse
                                    .BodyHandlers
                                    .ofString()
                    );

            if (
                    response.statusCode() != 404 &&
                    (
                            response.statusCode() < 200 ||
                            response.statusCode() >= 300
                    )
            ) {
                throw new IOException(
                        "Falha ao remover imagem antiga do Supabase. HTTP "
                                + response.statusCode()
                );
            }

        } catch (InterruptedException exception) {
            Thread.currentThread()
                    .interrupt();

            throw new IOException(
                    "Remoção interrompida.",
                    exception
            );
        }
    }

    private void deleteLocalImage(
            Long storeId,
            String oldUrl
    ) throws IOException {

        String expectedPrefix =
                "/uploads/stores/"
                        + storeId
                        + "/";

        if (!oldUrl.startsWith(
                expectedPrefix
        )) {
            return;
        }

        String fileName =
                oldUrl.substring(
                        expectedPrefix.length()
                );

        if (
                fileName.isBlank() ||
                fileName.contains("/") ||
                fileName.contains("\\") ||
                fileName.contains("..")
        ) {
            return;
        }

        Path storeDirectory =
                getLocalStoreDirectory(
                        storeId
                );

        Path oldFile =
                storeDirectory
                        .resolve(
                                fileName
                        )
                        .normalize();

        if (!oldFile.startsWith(
                storeDirectory
        )) {
            return;
        }

        Files.deleteIfExists(
                oldFile
        );
    }

    private Path getLocalStoreDirectory(
            Long storeId
    ) {

        Path storeDirectory =
                localUploadRoot
                        .resolve(
                                "stores"
                        )
                        .resolve(
                                String.valueOf(
                                        storeId
                                )
                        )
                        .normalize();

        if (!storeDirectory.startsWith(
                localUploadRoot
        )) {
            throw new IllegalArgumentException(
                    "Diretório de upload inválido."
            );
        }

        return storeDirectory;
    }

    private void validateImage(
            MultipartFile file
    ) {

        if (
                file == null ||
                file.isEmpty()
        ) {
            throw new IllegalArgumentException(
                    "Selecione uma imagem."
            );
        }

        if (
                file.getSize() >
                MAX_FILE_SIZE
        ) {
            throw new IllegalArgumentException(
                    "A imagem deve ter no máximo 5 MB."
            );
        }

        String contentType =
                file.getContentType();

        if (
                contentType == null ||
                !ALLOWED_CONTENT_TYPES.contains(
                        contentType
                )
        ) {
            throw new IllegalArgumentException(
                    "Formato inválido. Use JPG, PNG ou WebP."
            );
        }
    }

    private String extensionFor(
            String contentType
    ) {

        if (
                MediaType.IMAGE_PNG_VALUE
                        .equals(
                                contentType
                        )
        ) {
            return "png";
        }

        if (
                "image/webp"
                        .equals(
                                contentType
                        )
        ) {
            return "webp";
        }

        return "jpg";
    }

    private boolean supabaseConfigured() {
        return !supabaseUrl.isBlank()
                && !serviceRoleKey.isBlank();
    }

    private String objectEndpoint(
            String objectKey
    ) {
        return supabaseUrl
                + "/storage/v1/object/"
                + bucket
                + "/"
                + objectKey;
    }

    private String publicBucketPrefix() {
        return supabaseUrl
                + "/storage/v1/object/public/"
                + bucket
                + "/";
    }

    private String normalizeBaseUrl(
            String value
    ) {

        if (
                value == null ||
                value.isBlank()
        ) {
            return "";
        }

        String normalized =
                value.trim();

        while (
                normalized.endsWith("/")
        ) {
            normalized =
                    normalized.substring(
                            0,
                            normalized.length() - 1
                    );
        }

        return normalized;
    }
}

package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Store;
import com.pizzasystem.backend.service.CurrentStoreService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/store/images")
public class StoreImageController {

    private static final long MAX_FILE_SIZE =
            5L * 1024L * 1024L;

    private static final Set<String> ALLOWED_CONTENT_TYPES =
            Set.of(
                    MediaType.IMAGE_JPEG_VALUE,
                    MediaType.IMAGE_PNG_VALUE,
                    "image/webp"
            );

    private final CurrentStoreService currentStoreService;

    private final Path uploadRoot;

    public StoreImageController(
            CurrentStoreService currentStoreService,
            @Value("${pizzasystem.upload-dir:uploads}")
            String uploadDirectory
    ) {
        this.currentStoreService =
                currentStoreService;

        this.uploadRoot =
                Paths.get(uploadDirectory)
                        .toAbsolutePath()
                        .normalize();
    }

    // =========================
    // LOGO
    // =========================

    @PostMapping(
            value = "/logo",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @Transactional
    public Map<String, Object> uploadLogo(
            @RequestParam("file")
            MultipartFile file
    ) throws IOException {

        Store store =
                currentStoreService
                        .getCurrentStore();

        String oldUrl =
                store.getLogoUrl();

        String imageUrl =
                saveImage(
                        store.getId(),
                        file,
                        "logo"
                );

        store.setLogoUrl(
                imageUrl
        );

        deleteOldImage(
                oldUrl,
                imageUrl
        );

        return Map.of(
                "success", true,
                "url", imageUrl,
                "message",
                "Logo atualizada com sucesso."
        );
    }

    // =========================
    // CAPA
    // =========================

    @PostMapping(
            value = "/cover",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @Transactional
    public Map<String, Object> uploadCover(
            @RequestParam("file")
            MultipartFile file
    ) throws IOException {

        Store store =
                currentStoreService
                        .getCurrentStore();

        String oldUrl =
                store.getCoverImageUrl();

        String imageUrl =
                saveImage(
                        store.getId(),
                        file,
                        "cover"
                );

        store.setCoverImageUrl(
                imageUrl
        );

        deleteOldImage(
                oldUrl,
                imageUrl
        );

        return Map.of(
                "success", true,
                "url", imageUrl,
                "message",
                "Imagem de capa atualizada com sucesso."
        );
    }

    // =========================
    // REMOVER LOGO
    // =========================

    @DeleteMapping("/logo")
    @Transactional
    public Map<String, Object> deleteLogo()
            throws IOException {

        Store store =
                currentStoreService
                        .getCurrentStore();

        String oldUrl =
                store.getLogoUrl();

        store.setLogoUrl(
                null
        );

        deleteOldImage(
                oldUrl,
                null
        );

        return Map.of(
                "success", true,
                "message",
                "Logo removida com sucesso."
        );
    }

    // =========================
    // REMOVER CAPA
    // =========================

    @DeleteMapping("/cover")
    @Transactional
    public Map<String, Object> deleteCover()
            throws IOException {

        Store store =
                currentStoreService
                        .getCurrentStore();

        String oldUrl =
                store.getCoverImageUrl();

        store.setCoverImageUrl(
                null
        );

        deleteOldImage(
                oldUrl,
                null
        );

        return Map.of(
                "success", true,
                "message",
                "Imagem de capa removida com sucesso."
        );
    }

    // =========================
    // SALVAR IMAGEM
    // =========================

    private String saveImage(
            Long storeId,
            MultipartFile file,
            String prefix
    ) throws IOException {

        validateImage(
                file
        );

        String extension =
                extensionFor(
                        file.getContentType()
                );

        Path storeDirectory =
                uploadRoot
                        .resolve("stores")
                        .resolve(
                                String.valueOf(
                                        storeId
                                )
                        )
                        .normalize();

        if (!storeDirectory.startsWith(
                uploadRoot
        )) {
            throw new IllegalArgumentException(
                    "Diretório de upload inválido."
            );
        }

        Files.createDirectories(
                storeDirectory
        );

        String fileName =
                prefix
                        + "-"
                        + UUID.randomUUID()
                        + "."
                        + extension;

        Path destination =
                storeDirectory
                        .resolve(fileName)
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

    // =========================
    // VALIDAR IMAGEM
    // =========================

    private void validateImage(
            MultipartFile file
    ) {

        if (file == null
                || file.isEmpty()) {

            throw new IllegalArgumentException(
                    "Selecione uma imagem."
            );
        }

        if (file.getSize()
                > MAX_FILE_SIZE) {

            throw new IllegalArgumentException(
                    "A imagem deve ter no máximo 5 MB."
            );
        }

        String contentType =
                file.getContentType();

        if (contentType == null
                || !ALLOWED_CONTENT_TYPES
                .contains(contentType)) {

            throw new IllegalArgumentException(
                    "Formato inválido. Use JPG, PNG ou WebP."
            );
        }
    }

    // =========================
    // EXTENSÃO
    // =========================

    private String extensionFor(
            String contentType
    ) {

        if (MediaType.IMAGE_PNG_VALUE
                .equals(contentType)) {

            return "png";
        }

        if ("image/webp"
                .equals(contentType)) {

            return "webp";
        }

        return "jpg";
    }

    // =========================
    // APAGAR IMAGEM ANTIGA
    // =========================

    private void deleteOldImage(
            String oldUrl,
            String newUrl
    ) throws IOException {

        if (oldUrl == null
                || oldUrl.isBlank()) {

            return;
        }

        if (oldUrl.equals(
                newUrl
        )) {

            return;
        }

        if (!oldUrl.startsWith(
                "/uploads/"
        )) {

            return;
        }

        String relativePath =
                oldUrl.substring(
                        "/uploads/"
                                .length()
                );

        Path oldFile =
                uploadRoot
                        .resolve(
                                relativePath
                        )
                        .normalize();

        if (!oldFile.startsWith(
                uploadRoot
        )) {

            return;
        }

        Files.deleteIfExists(
                oldFile
        );
    }
}
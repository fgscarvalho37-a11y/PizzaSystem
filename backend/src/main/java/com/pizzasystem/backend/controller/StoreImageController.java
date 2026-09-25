package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Store;
import com.pizzasystem.backend.repository.StoreRepository;
import com.pizzasystem.backend.service.CurrentStoreService;
import com.pizzasystem.backend.service.StoreImageStorageService;

import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/store/images")
public class StoreImageController {

    private final CurrentStoreService
            currentStoreService;

    private final StoreImageStorageService
            imageStorageService;

    private final StoreRepository
            storeRepository;

    public StoreImageController(
            CurrentStoreService currentStoreService,
            StoreImageStorageService imageStorageService,
            StoreRepository storeRepository
    ) {
        this.currentStoreService =
                currentStoreService;

        this.imageStorageService =
                imageStorageService;

        this.storeRepository =
                storeRepository;
    }

    @GetMapping("/status")
    public Map<String, Object> storageStatus() {

        boolean persistent =
                imageStorageService
                        .isPersistentStorageConfigured();

        return Map.of(
                "persistent",
                persistent,
                "provider",
                imageStorageService
                        .storageProvider(),
                "bucket",
                "pizzasystem-assets"
        );
    }

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
                imageStorageService
                        .saveImage(
                                store.getId(),
                                file,
                                "logo"
                        );

        store.setLogoUrl(
                imageUrl
        );

        storeRepository.saveAndFlush(
                store
        );

        try {
            imageStorageService
                    .deleteOldImage(
                            store.getId(),
                            oldUrl,
                            imageUrl
                    );

        } catch (IOException ignored) {
            // A nova imagem já foi persistida.
            // Falha ao limpar a antiga não pode desfazer o upload.
        }

        return Map.of(
                "success", true,
                "url", imageUrl,
                "message", "Logo atualizada com sucesso."
        );
    }

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
                imageStorageService
                        .saveImage(
                                store.getId(),
                                file,
                                "cover"
                        );

        store.setCoverImageUrl(
                imageUrl
        );

        storeRepository.saveAndFlush(
                store
        );

        try {
            imageStorageService
                    .deleteOldImage(
                            store.getId(),
                            oldUrl,
                            imageUrl
                    );

        } catch (IOException ignored) {
            // A nova imagem já foi persistida.
            // Falha ao limpar a antiga não pode desfazer o upload.
        }

        return Map.of(
                "success", true,
                "url", imageUrl,
                "message", "Imagem de capa atualizada com sucesso."
        );
    }

    @PostMapping(
            value = "/product",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @Transactional(readOnly = true)
    public Map<String, Object> uploadProductImage(
            @RequestParam("file")
            MultipartFile file
    ) throws IOException {

        Store store =
                currentStoreService
                        .getCurrentStore();

        String imageUrl =
                imageStorageService
                        .saveImage(
                                store.getId(),
                                file,
                                "product"
                        );

        return Map.of(
                "success", true,
                "url", imageUrl,
                "message", "Imagem do produto enviada com sucesso."
        );
    }

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

        storeRepository.saveAndFlush(
                store
        );

        try {
            imageStorageService
                    .deleteOldImage(
                            store.getId(),
                            oldUrl,
                            null
                    );

        } catch (IOException ignored) {
            // A remoção no banco já foi concluída.
        }

        return Map.of(
                "success", true,
                "message", "Logo removida com sucesso."
        );
    }

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

        storeRepository.saveAndFlush(
                store
        );

        try {
            imageStorageService
                    .deleteOldImage(
                            store.getId(),
                            oldUrl,
                            null
                    );

        } catch (IOException ignored) {
            // A remoção no banco já foi concluída.
        }

        return Map.of(
                "success", true,
                "message", "Imagem de capa removida com sucesso."
        );
    }
}

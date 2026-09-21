package com.pizzasystem.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebResourceConfig
        implements WebMvcConfigurer {

    private final String uploadDirectory;

    public WebResourceConfig(
            @Value("${pizzasystem.upload-dir:uploads}")
            String uploadDirectory
    ) {
        this.uploadDirectory =
                uploadDirectory;
    }

    @Override
    public void addResourceHandlers(
            ResourceHandlerRegistry registry
    ) {

        Path uploadPath =
                Paths.get(
                                uploadDirectory
                        )
                        .toAbsolutePath()
                        .normalize();

        String resourceLocation =
                uploadPath
                        .toUri()
                        .toString();

        registry
                .addResourceHandler(
                        "/uploads/**"
                )
                .addResourceLocations(
                        resourceLocation
                );
    }
}
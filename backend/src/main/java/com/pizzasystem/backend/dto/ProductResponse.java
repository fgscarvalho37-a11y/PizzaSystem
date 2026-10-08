package com.pizzasystem.backend.dto;

import com.pizzasystem.backend.entity.Addon;
import com.pizzasystem.backend.entity.AddonGroup;
import com.pizzasystem.backend.entity.Category;
import com.pizzasystem.backend.entity.Product;

import java.math.BigDecimal;
import java.util.List;

public record ProductResponse(
        Long id,
        String name,
        String description,
        String imageUrl,
        BigDecimal price,
        boolean available,
        boolean allowCrust,
        CategoryResponse category,
        List<AddonGroupResponse> addonGroups
) {

    public static ProductResponse from(
            Product product
    ) {
        Category category =
                product.getCategory();

        List<AddonGroupResponse> groups =
                product.getAddonGroups() == null
                        ? List.of()
                        : product.getAddonGroups()
                                .stream()
                                .map(
                                        AddonGroupResponse::from
                                )
                                .toList();

        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getImageUrl(),
                product.getPrice(),
                product.isAvailable(),
                product.isAllowCrust(),
                category == null
                        ? null
                        : new CategoryResponse(
                                category.getId(),
                                category.getName()
                        ),
                groups
        );
    }

    public record CategoryResponse(
            Long id,
            String name
    ) {
    }

    public record AddonGroupResponse(
            Long id,
            String name,
            String description,
            boolean required,
            int minSelections,
            int maxSelections,
            boolean active,
            int sortOrder,
            List<AddonResponse> addons
    ) {

        public static AddonGroupResponse from(
                AddonGroup group
        ) {
            List<AddonResponse> addons =
                    group.getAddons() == null
                            ? List.of()
                            : group.getAddons()
                                    .stream()
                                    .map(
                                            AddonResponse::from
                                    )
                                    .toList();

            return new AddonGroupResponse(
                    group.getId(),
                    group.getName(),
                    group.getDescription(),
                    group.isRequired(),
                    group.getMinSelections(),
                    group.getMaxSelections(),
                    group.isActive(),
                    group.getSortOrder(),
                    addons
            );
        }
    }

    public record AddonResponse(
            Long id,
            String name,
            String description,
            BigDecimal price,
            boolean active,
            int sortOrder
    ) {

        public static AddonResponse from(
                Addon addon
        ) {
            return new AddonResponse(
                    addon.getId(),
                    addon.getName(),
                    addon.getDescription(),
                    addon.getPrice(),
                    addon.isActive(),
                    addon.getSortOrder()
            );
        }
    }
}

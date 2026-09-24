package com.pizzasystem.backend.config;

import com.pizzasystem.backend.entity.AdminUser;
import com.pizzasystem.backend.entity.BusinessHours;
import com.pizzasystem.backend.entity.Category;
import com.pizzasystem.backend.entity.Coupon;
import com.pizzasystem.backend.entity.Crust;
import com.pizzasystem.backend.entity.DeliveryArea;
import com.pizzasystem.backend.entity.Order;
import com.pizzasystem.backend.entity.Product;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.repository.AdminUserRepository;
import com.pizzasystem.backend.repository.BusinessHoursRepository;
import com.pizzasystem.backend.repository.CategoryRepository;
import com.pizzasystem.backend.repository.CouponRepository;
import com.pizzasystem.backend.repository.CrustRepository;
import com.pizzasystem.backend.repository.DeliveryAreaRepository;
import com.pizzasystem.backend.repository.OrderRepository;
import com.pizzasystem.backend.repository.ProductRepository;
import com.pizzasystem.backend.repository.StoreRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@ConditionalOnProperty(
        name = "pizzasystem.legacy-migration.enabled",
        havingValue = "true"
)
public class StoreDataMigrationConfig {

    private final StoreRepository
            storeRepository;

    private final CategoryRepository
            categoryRepository;

    private final ProductRepository
            productRepository;

    private final AdminUserRepository
            adminUserRepository;

    private final CrustRepository
            crustRepository;

    private final BusinessHoursRepository
            businessHoursRepository;

    private final OrderRepository
            orderRepository;

    private final DeliveryAreaRepository
            deliveryAreaRepository;

    private final CouponRepository
            couponRepository;

    public StoreDataMigrationConfig(
            StoreRepository storeRepository,
            CategoryRepository categoryRepository,
            ProductRepository productRepository,
            AdminUserRepository adminUserRepository,
            CrustRepository crustRepository,
            BusinessHoursRepository businessHoursRepository,
            OrderRepository orderRepository,
            DeliveryAreaRepository deliveryAreaRepository,
            CouponRepository couponRepository
    ) {

        this.storeRepository =
                storeRepository;

        this.categoryRepository =
                categoryRepository;

        this.productRepository =
                productRepository;

        this.adminUserRepository =
                adminUserRepository;

        this.crustRepository =
                crustRepository;

        this.businessHoursRepository =
                businessHoursRepository;

        this.orderRepository =
                orderRepository;

        this.deliveryAreaRepository =
                deliveryAreaRepository;

        this.couponRepository =
                couponRepository;
    }

    @Bean
    public CommandLineRunner migrateExistingDataToStore() {

        return args ->
                migrate();
    }

    public void migrate() {

        Store store =
                storeRepository
                        .findFirstByOrderByIdAsc()
                        .orElseThrow(() ->
                                new IllegalStateException(
                                        "Nenhuma loja cadastrada para migrar os dados."
                                )
                        );

        // =========================
        // CATEGORIAS
        // =========================

        List<Category> categories =
                categoryRepository.findAll();

        int migratedCategories =
                0;

        for (Category category : categories) {

            if (category.getStore() == null) {

                category.setStore(
                        store
                );

                categoryRepository.save(
                        category
                );

                migratedCategories++;
            }
        }

        // =========================
        // PRODUTOS
        // =========================

        List<Product> products =
                productRepository.findAll();

        int migratedProducts =
                0;

        for (Product product : products) {

            if (product.getStore() == null) {

                Store productStore =
                        product.getCategory() != null
                                && product.getCategory().getStore() != null
                                ? product.getCategory().getStore()
                                : store;

                product.setStore(
                        productStore
                );

                productRepository.save(
                        product
                );

                migratedProducts++;
            }
        }

        // =========================
        // ADMINISTRADORES
        // =========================

        List<AdminUser> admins =
                adminUserRepository.findAll();

        int migratedAdmins =
                0;

        for (AdminUser admin : admins) {

            if (admin.getStore() == null) {

                admin.setStore(
                        store
                );

                adminUserRepository.save(
                        admin
                );

                migratedAdmins++;
            }
        }

        // =========================
        // BORDAS
        // =========================

        List<Crust> crusts =
                crustRepository.findAll();

        int migratedCrusts =
                0;

        for (Crust crust : crusts) {

            if (crust.getStore() == null) {

                crust.setStore(
                        store
                );

                crustRepository.save(
                        crust
                );

                migratedCrusts++;
            }
        }

        // =========================
        // HORÁRIOS
        // =========================

        List<BusinessHours> businessHours =
                businessHoursRepository.findAll();

        int migratedBusinessHours =
                0;

        for (BusinessHours hours : businessHours) {

            if (hours.getStore() == null) {

                hours.setStore(
                        store
                );

                businessHoursRepository.save(
                        hours
                );

                migratedBusinessHours++;
            }
        }

        // =========================
        // PEDIDOS
        // =========================

        List<Order> orders =
                orderRepository.findAll();

        int migratedOrders =
                0;

        for (Order order : orders) {

            if (order.getStore() == null) {

                order.setStore(
                        store
                );

                orderRepository.save(
                        order
                );

                migratedOrders++;
            }
        }

        // =========================
        // ÁREAS DE ENTREGA
        // =========================

        List<DeliveryArea> deliveryAreas =
                deliveryAreaRepository.findAll();

        int migratedDeliveryAreas =
                0;

        for (DeliveryArea deliveryArea
                : deliveryAreas) {

            if (deliveryArea.getStore() == null) {

                deliveryArea.setStore(
                        store
                );

                deliveryAreaRepository.save(
                        deliveryArea
                );

                migratedDeliveryAreas++;
            }
        }

        // =========================
        // CUPONS
        // =========================

        List<Coupon> coupons =
                couponRepository.findAll();

        int migratedCoupons =
                0;

        for (Coupon coupon : coupons) {

            if (coupon.getStore() == null) {

                coupon.setStore(
                        store
                );

                couponRepository.save(
                        coupon
                );

                migratedCoupons++;
            }
        }

        // =========================
        // RESULTADO
        // =========================

        System.out.println(
                "Migração SaaS concluída."
        );

        System.out.println(
                "Store: "
                        + store.getId()
                        + " - "
                        + store.getName()
        );

        System.out.println(
                "Categorias migradas: "
                        + migratedCategories
        );

        System.out.println(
                "Produtos migrados: "
                        + migratedProducts
        );

        System.out.println(
                "Administradores migrados: "
                        + migratedAdmins
        );

        System.out.println(
                "Bordas migradas: "
                        + migratedCrusts
        );

        System.out.println(
                "Horários migrados: "
                        + migratedBusinessHours
        );

        System.out.println(
                "Pedidos migrados: "
                        + migratedOrders
        );

        System.out.println(
                "Áreas de entrega migradas: "
                        + migratedDeliveryAreas
        );

        System.out.println(
                "Cupons migrados: "
                        + migratedCoupons
        );
    }
}
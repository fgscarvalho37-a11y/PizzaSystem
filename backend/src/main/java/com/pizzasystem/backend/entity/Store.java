package com.pizzasystem.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "stores",
        indexes = {
                @Index(
                        name = "idx_store_slug",
                        columnList = "slug"
                )
        }
)
public class Store {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    // =========================
    // IDENTIFICAÇÃO
    // =========================

    @Column(
            nullable = false,
            length = 120
    )
    private String name;

    /*
     * Identificador público da pizzaria.
     *
     * Exemplo:
     *
     * pizzaria-do-joao
     *
     * Futuramente:
     * pizzasystem.com/pizzaria-do-joao
     */
    @Column(
            nullable = false,
            unique = true,
            length = 80
    )
    private String slug;

    // =========================
    // IDENTIDADE VISUAL
    // =========================

    private String logoUrl;

    private String coverImageUrl;

    @Column(length = 20)
    private String primaryColor;

    @Column(length = 20)
    private String secondaryColor;

    // =========================
    // CONTEÚDO DO CARDÁPIO
    // =========================

    /*
     * Texto principal que aparece
     * no topo do cardápio.
     */
    @Column(length = 180)
    private String headline;

    /*
     * Faixa/mensagem animada.
     *
     * Exemplo:
     * "Entrega grátis acima de R$ 80"
     */
    @Column(length = 250)
    private String marqueeMessage;

    @Column(nullable = false)
    private boolean marqueeEnabled =
            true;

    // =========================
    // CONTATO
    // =========================

    private String whatsapp;

    private String phone;

    private String email;

    // =========================
    // OPERAÇÃO
    // =========================

    @Column(nullable = false)
    private boolean open =
            false;

    private Integer dailyOrderLimit =
            30;

    // =========================
    // FIDELIDADE
    // =========================

    /*
     * Cada pizzaria decide se quer
     * participar do sistema de fidelidade.
     */
    @Column(nullable = false)
    private boolean loyaltyEnabled =
            false;

    /*
     * Quantidade de selos necessários
     * para ganhar a recompensa.
     *
     * Exemplo: 10 compras = 1 recompensa.
     */
    private Integer loyaltyStampGoal =
            10;

    @Column(length = 180)
    private String loyaltyRewardDescription;

    // =========================
    // SAAS / ASSINATURA
    // =========================

    @Column(nullable = false)
    private boolean active =
            true;

    @Column(nullable = false)
    private String plan =
            "STARTER";

    /*
     * Futuramente podemos usar:
     *
     * TRIAL
     * ACTIVE
     * PAST_DUE
     * CANCELLED
     * SUSPENDED
     */
    @Column(nullable = false)
    private String subscriptionStatus =
            "TRIAL";

    private LocalDateTime trialEndsAt;

    // =========================
    // DATAS
    // =========================

    @Column(nullable = false)
    private LocalDateTime createdAt =
            LocalDateTime.now();

    private LocalDateTime updatedAt;

    public Store() {
    }

    @PreUpdate
    private void updateTimestamp() {
        updatedAt =
                LocalDateTime.now();
    }

    // =========================
    // GETTERS / SETTERS
    // =========================

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(
            String name
    ) {
        this.name =
                name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(
            String slug
    ) {
        this.slug =
                slug;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(
            String logoUrl
    ) {
        this.logoUrl =
                logoUrl;
    }

    public String getCoverImageUrl() {
        return coverImageUrl;
    }

    public void setCoverImageUrl(
            String coverImageUrl
    ) {
        this.coverImageUrl =
                coverImageUrl;
    }

    public String getPrimaryColor() {
        return primaryColor;
    }

    public void setPrimaryColor(
            String primaryColor
    ) {
        this.primaryColor =
                primaryColor;
    }

    public String getSecondaryColor() {
        return secondaryColor;
    }

    public void setSecondaryColor(
            String secondaryColor
    ) {
        this.secondaryColor =
                secondaryColor;
    }

    public String getHeadline() {
        return headline;
    }

    public void setHeadline(
            String headline
    ) {
        this.headline =
                headline;
    }

    public String getMarqueeMessage() {
        return marqueeMessage;
    }

    public void setMarqueeMessage(
            String marqueeMessage
    ) {
        this.marqueeMessage =
                marqueeMessage;
    }

    public boolean isMarqueeEnabled() {
        return marqueeEnabled;
    }

    public void setMarqueeEnabled(
            boolean marqueeEnabled
    ) {
        this.marqueeEnabled =
                marqueeEnabled;
    }

    public String getWhatsapp() {
        return whatsapp;
    }

    public void setWhatsapp(
            String whatsapp
    ) {
        this.whatsapp =
                whatsapp;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(
            String phone
    ) {
        this.phone =
                phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(
            String email
    ) {
        this.email =
                email;
    }

    public boolean isOpen() {
        return open;
    }

    public void setOpen(
            boolean open
    ) {
        this.open =
                open;
    }

    public Integer getDailyOrderLimit() {
        return dailyOrderLimit;
    }

    public void setDailyOrderLimit(
            Integer dailyOrderLimit
    ) {
        this.dailyOrderLimit =
                dailyOrderLimit;
    }

    public boolean isLoyaltyEnabled() {
        return loyaltyEnabled;
    }

    public void setLoyaltyEnabled(
            boolean loyaltyEnabled
    ) {
        this.loyaltyEnabled =
                loyaltyEnabled;
    }

    public Integer getLoyaltyStampGoal() {
        return loyaltyStampGoal;
    }

    public void setLoyaltyStampGoal(
            Integer loyaltyStampGoal
    ) {
        this.loyaltyStampGoal =
                loyaltyStampGoal;
    }

    public String getLoyaltyRewardDescription() {
        return loyaltyRewardDescription;
    }

    public void setLoyaltyRewardDescription(
            String loyaltyRewardDescription
    ) {
        this.loyaltyRewardDescription =
                loyaltyRewardDescription;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(
            boolean active
    ) {
        this.active =
                active;
    }

    public String getPlan() {
        return plan;
    }

    public void setPlan(
            String plan
    ) {
        this.plan =
                plan;
    }

    public String getSubscriptionStatus() {
        return subscriptionStatus;
    }

    public void setSubscriptionStatus(
            String subscriptionStatus
    ) {
        this.subscriptionStatus =
                subscriptionStatus;
    }

    public LocalDateTime getTrialEndsAt() {
        return trialEndsAt;
    }

    public void setTrialEndsAt(
            LocalDateTime trialEndsAt
    ) {
        this.trialEndsAt =
                trialEndsAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
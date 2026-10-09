"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import AdminHeader from "@/components/AdminHeader";
import { useLanguage } from "@/i18n/LanguageProvider";
import { adminFetch } from "@/lib/adminFetch";
import { formatStoreMoney, getStoreCurrencySymbol } from "@/lib/storeIntl";

const API_URL = "";

type StoreSettings = {
  id: number;
  storeName: string;
  open: boolean;
  whatsapp: string | null;
  dailyOrderLimit: number;
};

type StoreStatus = {
  storeName: string;
  manualOpen: boolean;
  open: boolean;
  message: string;
  ordersToday: number;
  dailyOrderLimit: number;
};

type MercadoPagoStatus = {
  connected: boolean;
  mercadoPagoUserId?: string | null;
  connectedAt?: string | null;
  tokenExpiresAt?: string | null;
};

type StoreProfile = {
  id: number;
  name: string;
  slug: string;

  logoUrl: string | null;
  coverImageUrl: string | null;

  primaryColor: string | null;
  secondaryColor: string | null;

  headline: string | null;

  marqueeMessage: string | null;
  marqueeEnabled: boolean;

  heroTitleLine1: string | null;
  heroTitleLine2: string | null;
  heroTitleLine3: string | null;
  heroDescription: string | null;
  heroPrimaryButtonText: string | null;
  heroSecondaryButtonText: string | null;
  heroBadgeText: string | null;
  heroOpenStatusText: string | null;
  heroClosedStatusText: string | null;

  menuTitle: string | null;
  menuSubtitle: string | null;
  menuSearchPlaceholder: string | null;
  menuEmptyTitle: string | null;
  menuEmptyDescription: string | null;

  footerTagline: string | null;

  whatsapp: string | null;
  phone: string | null;
  email: string | null;

  loyaltyEnabled: boolean;
  loyaltyStampGoal: number | null;
  loyaltyRewardDescription: string | null;

  loyaltyEarningType:
    | "PER_ORDER"
    | "PER_AMOUNT"
    | null;

  loyaltyPointsPerOrder: number | null;

  loyaltyAmountStep: number | null;

  loyaltyPointsPerAmountStep:
    number | null;

  loyaltyMinimumOrderValue:
    number | null;
};

type ProfileForm = {
  name: string;

  primaryColor: string;
  secondaryColor: string;

  headline: string;

  marqueeMessage: string;
  marqueeEnabled: boolean;

  heroTitleLine1: string;
  heroTitleLine2: string;
  heroTitleLine3: string;
  heroDescription: string;
  heroPrimaryButtonText: string;
  heroSecondaryButtonText: string;
  heroBadgeText: string;
  heroOpenStatusText: string;
  heroClosedStatusText: string;

  menuTitle: string;
  menuSubtitle: string;
  menuSearchPlaceholder: string;
  menuEmptyTitle: string;
  menuEmptyDescription: string;

  footerTagline: string;

  whatsapp: string;
  phone: string;
  email: string;

  loyaltyEnabled: boolean;

  loyaltyStampGoal: number;

  loyaltyRewardDescription: string;

  loyaltyEarningType:
    | "PER_ORDER"
    | "PER_AMOUNT";

  loyaltyPointsPerOrder: number;

  loyaltyAmountStep: number;

  loyaltyPointsPerAmountStep:
    number;

  loyaltyMinimumOrderValue:
    number | null;
};

const DEFAULT_PRIMARY = "#E63946";
const DEFAULT_SECONDARY = "#F4C95D";

function Toggle({
  checked,
  disabled = false,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3 text-left transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
    >
      <div>
        <p className="text-sm font-bold text-foreground">
          {label}
        </p>

        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>

      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked
            ? "bg-primary"
            : "bg-muted-foreground/25"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

function FieldLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
      {children}
    </label>
  );
}

export default function ConfiguracoesPage() {
  const { text, locale } = useLanguage();
  const localizedStatus = (value: string) => {
    if (!locale.startsWith("en")) return value;
    const translated: Record<string, string> = {
      "Loja temporariamente indisponível": "Store temporarily unavailable",
      "Pedidos fechados manualmente": "Orders manually disabled",
      "Fora do horário de funcionamento": "Outside business hours",
      "Limite diário de pedidos atingido": "Daily order limit reached",
      "Recebendo pedidos": "Accepting orders",
    };
    return translated[value] ?? value;
  };

  const [settings, setSettings] =
    useState<StoreSettings | null>(null);

  const [status, setStatus] =
    useState<StoreStatus | null>(null);

  const [profile, setProfile] =
    useState<StoreProfile | null>(null);

  const [storeName, setStoreName] =
    useState("");

  const [whatsapp, setWhatsapp] =
    useState("");

  const [
    dailyOrderLimit,
    setDailyOrderLimit,
  ] = useState(30);

  const [
    profileForm,
    setProfileForm,
  ] = useState<ProfileForm>({
    name: "",
    primaryColor:
      DEFAULT_PRIMARY,
    secondaryColor:
      DEFAULT_SECONDARY,
    headline: "",
    marqueeMessage: "",
    marqueeEnabled: true,

    heroTitleLine1: "ESCOLHA.",
    heroTitleLine2: "PEÇA.",
    heroTitleLine3: "APROVEITE.",
    heroDescription:
      "Escolha seus favoritos, monte seu pedido e acompanhe tudo pelo site.",
    heroPrimaryButtonText: "Ver cardápio",
    heroSecondaryButtonText: "Ver meu pedido",
    heroBadgeText: "CARDÁPIO ONLINE",
    heroOpenStatusText: "ABERTO",
    heroClosedStatusText: "FECHADO",

    menuTitle: "O cardápio",
    menuSubtitle: "Escolha o seu",
    menuSearchPlaceholder: "Buscar no cardápio",
    menuEmptyTitle: "Nenhum produto encontrado",
    menuEmptyDescription:
      "Tente buscar por outro termo ou escolha outra categoria.",

    footerTagline: "Pedidos online",

    whatsapp: "",
    phone: "",
    email: "",
    loyaltyEnabled: false,
    loyaltyStampGoal: 10,
    loyaltyRewardDescription: "",
    loyaltyEarningType:
      "PER_ORDER",
    loyaltyPointsPerOrder: 1,
    loyaltyAmountStep: 20,
    loyaltyPointsPerAmountStep: 1,
    loyaltyMinimumOrderValue:
      null,
  });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    savingProfile,
    setSavingProfile,
  ] = useState(false);

  const [
    changingStatus,
    setChangingStatus,
  ] = useState(false);

  const [mercadoPagoStatus, setMercadoPagoStatus] =
    useState<MercadoPagoStatus | null>(null);

  const [mercadoPagoLoading, setMercadoPagoLoading] =
    useState(true);

  const [mercadoPagoActionLoading, setMercadoPagoActionLoading] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  function fillProfileForm(
    data: StoreProfile
  ) {
    setProfileForm({
      name:
        data.name ?? "",

      primaryColor:
        data.primaryColor ??
        DEFAULT_PRIMARY,

      secondaryColor:
        data.secondaryColor ??
        DEFAULT_SECONDARY,

      headline:
        data.headline ?? "",

      marqueeMessage:
        data.marqueeMessage ?? "",

      marqueeEnabled:
        data.marqueeEnabled,

      heroTitleLine1:
        data.heroTitleLine1 ?? "ESCOLHA.",
      heroTitleLine2:
        data.heroTitleLine2 ?? "PEÇA.",
      heroTitleLine3:
        data.heroTitleLine3 ?? "APROVEITE.",
      heroDescription:
        data.heroDescription ??
        "Escolha seus favoritos, monte seu pedido e acompanhe tudo pelo site.",
      heroPrimaryButtonText:
        data.heroPrimaryButtonText ?? "Ver cardápio",
      heroSecondaryButtonText:
        data.heroSecondaryButtonText ?? "Ver meu pedido",
      heroBadgeText:
        data.heroBadgeText ?? "CARDÁPIO ONLINE",
      heroOpenStatusText:
        data.heroOpenStatusText ?? "ABERTO",
      heroClosedStatusText:
        data.heroClosedStatusText ?? "FECHADO",

      menuTitle:
        data.menuTitle ?? "O cardápio",
      menuSubtitle:
        data.menuSubtitle ?? "Escolha o seu",
      menuSearchPlaceholder:
        data.menuSearchPlaceholder ?? "Buscar no cardápio",
      menuEmptyTitle:
        data.menuEmptyTitle ?? "Nenhum produto encontrado",
      menuEmptyDescription:
        data.menuEmptyDescription ??
        "Tente buscar por outro termo ou escolha outra categoria.",

      footerTagline:
        data.footerTagline ?? "Pedidos online",

      whatsapp:
        data.whatsapp ?? "",

      phone:
        data.phone ?? "",

      email:
        data.email ?? "",

      loyaltyEnabled:
        data.loyaltyEnabled,

      loyaltyStampGoal:
        data.loyaltyStampGoal ?? 10,

      loyaltyRewardDescription:
        data.loyaltyRewardDescription ??
        "",

      loyaltyEarningType:
        data.loyaltyEarningType ??
        "PER_ORDER",

      loyaltyPointsPerOrder:
        data.loyaltyPointsPerOrder ??
        1,

      loyaltyAmountStep:
        data.loyaltyAmountStep ?? 20,

      loyaltyPointsPerAmountStep:
        data.loyaltyPointsPerAmountStep ??
        1,

      loyaltyMinimumOrderValue:
        data.loyaltyMinimumOrderValue ??
        null,
    });
  }

  async function loadMercadoPagoStatus() {
    try {
      setMercadoPagoLoading(true);
      const response = await adminFetch(
        `${API_URL}/api/admin/mercadopago/status`,
        { cache: "no-store" }
      );
      if (!response.ok) {
        throw new Error(text("Não foi possível consultar o Mercado Pago.", "Could not check Mercado Pago."));
      }
      const data: MercadoPagoStatus = await response.json();
      setMercadoPagoStatus(data);
    } catch {
      setMercadoPagoStatus(null);
    } finally {
      setMercadoPagoLoading(false);
    }
  }

  async function connectMercadoPago() {
    try {
      setMercadoPagoActionLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await adminFetch(
        `${API_URL}/api/admin/mercadopago/connect`,
        { method: "POST" }
      );

      if (!response.ok) {
        let message = text("Não foi possível iniciar a conexão com o Mercado Pago.", "Could not start Mercado Pago connection.");
        try {
          const data = await response.json();
          if (typeof data?.message === "string" && data.message) {
            message = data.message;
          }
        } catch {
          // mantém mensagem padrão
        }
        throw new Error(message);
      }

      const data: { authorizationUrl?: string } = await response.json();
      if (!data.authorizationUrl) {
        throw new Error(text("O Mercado Pago não retornou a URL de autorização.", "Mercado Pago did not return an authorization URL."));
      }

      window.location.assign(data.authorizationUrl);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : text("Não foi possível iniciar a conexão com o Mercado Pago.", "Could not start Mercado Pago connection.")
      );
      setMercadoPagoActionLoading(false);
    }
  }

  async function disconnectMercadoPago() {
    if (!window.confirm("Deseja desconectar a conta do Mercado Pago desta loja?")) {
      return;
    }

    try {
      setMercadoPagoActionLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await adminFetch(
        `${API_URL}/api/admin/mercadopago/disconnect`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error(text("Não foi possível desconectar o Mercado Pago.", "Could not disconnect Mercado Pago."));
      }

      await loadMercadoPagoStatus();
      setSuccessMessage(text("Mercado Pago desconectado.", "Mercado Pago disconnected."));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : text("Não foi possível desconectar o Mercado Pago.", "Could not disconnect Mercado Pago.")
      );
    } finally {
      setMercadoPagoActionLoading(false);
    }
  }

  async function loadData() {
    try {
      setErrorMessage("");

      const [
        settingsResponse,
        statusResponse,
        profileResponse,
      ] = await Promise.all([
        adminFetch(
          `${API_URL}/api/store`,
          {
            cache: "no-store",
          }
        ),

        adminFetch(
          `${API_URL}/api/store/status`,
          {
            cache: "no-store",
          }
        ),

        adminFetch(
          `${API_URL}/api/store/profile`,
          {
            cache: "no-store",
          }
        ),
      ]);

      if (!settingsResponse.ok) {
        throw new Error(
          "Erro ao carregar configurações."
        );
      }

      if (!statusResponse.ok) {
        throw new Error(
          "Erro ao carregar status."
        );
      }

      if (!profileResponse.ok) {
        throw new Error(
          "Erro ao carregar perfil da loja."
        );
      }

      const settingsData: StoreSettings =
        await settingsResponse.json();

      const statusData: StoreStatus =
        await statusResponse.json();

      const profileData: StoreProfile =
        await profileResponse.json();

      setSettings(settingsData);
      setStatus(statusData);
      setProfile(profileData);

      setStoreName(
        settingsData.storeName ?? ""
      );

      setWhatsapp(
        settingsData.whatsapp ?? ""
      );

      setDailyOrderLimit(
        settingsData.dailyOrderLimit ?? 30
      );

      fillProfileForm(profileData);
    } catch {
      setErrorMessage(
        text("Não foi possível carregar as configurações.", "Could not load settings.")
      );
    } finally {
      setLoading(false);
    }
  }

  async function refreshStatus() {
    try {
      const response =
        await adminFetch(
          `${API_URL}/api/store/status`,
          {
            cache: "no-store",
          }
        );

      if (!response.ok) {
        return;
      }

      const data: StoreStatus =
        await response.json();

      setStatus(data);
    } catch {
      // mantém o último estado
    }
  }

  useEffect(() => {
    loadData();
    loadMercadoPagoStatus();

    const params = new URLSearchParams(window.location.search);
    const mercadoPagoResult = params.get("mercadopago");

    if (mercadoPagoResult === "connected") {
      setSuccessMessage(text("Mercado Pago conectado com sucesso.", "Mercado Pago connected successfully."));
      window.history.replaceState({}, "", window.location.pathname);
    } else if (mercadoPagoResult === "error") {
      setErrorMessage(text("Não foi possível concluir a conexão com o Mercado Pago.", "Could not complete Mercado Pago connection."));
      window.history.replaceState({}, "", window.location.pathname);
    }

    const interval =
      setInterval(() => {
        refreshStatus();
      }, 10000);

    return () =>
      clearInterval(interval);
  }, []);

  async function changeStoreStatus() {
    if (!settings) {
      return;
    }

    try {
      setChangingStatus(true);
      setErrorMessage("");
      setSuccessMessage("");

      const newStatus =
        !settings.open;

      const response =
        await adminFetch(
          `${API_URL}/api/store/open?open=${newStatus}`,
          {
            method: "PATCH",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Erro ao alterar funcionamento."
        );
      }

      const updatedSettings:
        StoreSettings =
        await response.json();

      setSettings(updatedSettings);

      await refreshStatus();

      setSuccessMessage(
        newStatus
          ? text("Recebimento manual de pedidos ativado.", "Manual order intake enabled.")
          : "Recebimento de pedidos fechado manualmente."
      );
    } catch {
      setErrorMessage(
        text("Não foi possível alterar o funcionamento.", "Could not change store availability.")
      );
    } finally {
      setChangingStatus(false);
    }
  }

  async function saveSettings(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!settings) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    if (!storeName.trim()) {
      setErrorMessage(
        "Informe o nome da pizzaria."
      );

      return;
    }

    if (dailyOrderLimit < 0) {
      setErrorMessage(
        "O limite diário não pode ser negativo."
      );

      return;
    }

    try {
      setSaving(true);

      const response =
        await adminFetch(
          `${API_URL}/api/store`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              id: 1,
              storeName:
                storeName.trim(),
              whatsapp:
                whatsapp.trim(),
              open: settings.open,
              dailyOrderLimit,
            }),
          }
        );

      if (!response.ok) {
        throw new Error(
          "Erro ao salvar configurações."
        );
      }

      const updatedSettings:
        StoreSettings =
        await response.json();

      setSettings(updatedSettings);

      setProfileForm(
        (current) => ({
          ...current,

          name:
            updatedSettings.storeName ??
            current.name,

          whatsapp:
            updatedSettings.whatsapp ??
            "",
        })
      );

      await refreshStatus();

      setSuccessMessage(
        text("Configurações operacionais salvas.", "Operation settings saved.")
      );
    } catch {
      setErrorMessage(
        text("Não foi possível salvar as configurações.", "Could not save settings.")
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!profileForm.name.trim()) {
      setErrorMessage(
        "Informe o nome da pizzaria."
      );

      return;
    }

    if (
      profileForm.loyaltyEnabled &&
      profileForm.loyaltyStampGoal < 2
    ) {
      setErrorMessage(
        "A meta de fidelidade deve ter pelo menos 2 selos."
      );

      return;
    }

    if (
      profileForm.loyaltyEnabled &&
      profileForm.loyaltyEarningType ===
        "PER_ORDER" &&
      profileForm.loyaltyPointsPerOrder < 1
    ) {
      setErrorMessage(
        "A quantidade de selos por pedido deve ser pelo menos 1."
      );

      return;
    }

    if (
      profileForm.loyaltyEnabled &&
      profileForm.loyaltyEarningType ===
        "PER_AMOUNT" &&
      profileForm.loyaltyAmountStep <= 0
    ) {
      setErrorMessage(
        "O valor da faixa de fidelidade deve ser maior que zero."
      );

      return;
    }

    if (
      profileForm.loyaltyEnabled &&
      profileForm.loyaltyEarningType ===
        "PER_AMOUNT" &&
      profileForm.loyaltyPointsPerAmountStep < 1
    ) {
      setErrorMessage(
        "A quantidade de selos por faixa deve ser pelo menos 1."
      );

      return;
    }

    if (
      profileForm.loyaltyMinimumOrderValue !==
        null &&
      profileForm.loyaltyMinimumOrderValue < 0
    ) {
      setErrorMessage(
        "O valor mínimo do pedido não pode ser negativo."
      );

      return;
    }

    try {
      setSavingProfile(true);

      const response =
        await adminFetch(
          `${API_URL}/api/store/profile`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name:
                profileForm.name.trim(),

              logoUrl:
                profile?.logoUrl ?? null,

              coverImageUrl:
                profile?.coverImageUrl ??
                null,

              primaryColor:
                profileForm.primaryColor,

              secondaryColor:
                profileForm.secondaryColor,

              headline:
                profileForm.headline.trim(),

              marqueeMessage:
                profileForm.marqueeMessage.trim(),

              marqueeEnabled:
                profileForm.marqueeEnabled,

              heroTitleLine1:
                profileForm.heroTitleLine1.trim(),
              heroTitleLine2:
                profileForm.heroTitleLine2.trim(),
              heroTitleLine3:
                profileForm.heroTitleLine3.trim(),
              heroDescription:
                profileForm.heroDescription.trim(),
              heroPrimaryButtonText:
                profileForm.heroPrimaryButtonText.trim(),
              heroSecondaryButtonText:
                profileForm.heroSecondaryButtonText.trim(),
              heroBadgeText:
                profileForm.heroBadgeText.trim(),
              heroOpenStatusText:
                profileForm.heroOpenStatusText.trim(),
              heroClosedStatusText:
                profileForm.heroClosedStatusText.trim(),

              menuTitle:
                profileForm.menuTitle.trim(),
              menuSubtitle:
                profileForm.menuSubtitle.trim(),
              menuSearchPlaceholder:
                profileForm.menuSearchPlaceholder.trim(),
              menuEmptyTitle:
                profileForm.menuEmptyTitle.trim(),
              menuEmptyDescription:
                profileForm.menuEmptyDescription.trim(),

              footerTagline:
                profileForm.footerTagline.trim(),

              whatsapp:
                profileForm.whatsapp.trim(),

              phone:
                profileForm.phone.trim(),

              email:
                profileForm.email.trim(),

              loyaltyEnabled:
                profileForm.loyaltyEnabled,

              loyaltyStampGoal:
                profileForm.loyaltyStampGoal,

              loyaltyRewardDescription:
                profileForm.loyaltyRewardDescription.trim(),

              loyaltyEarningType:
                profileForm.loyaltyEarningType,

              loyaltyPointsPerOrder:
                profileForm.loyaltyPointsPerOrder,

              loyaltyAmountStep:
                profileForm.loyaltyAmountStep,

              loyaltyPointsPerAmountStep:
                profileForm.loyaltyPointsPerAmountStep,

              loyaltyMinimumOrderValue:
                profileForm.loyaltyMinimumOrderValue,
            }),
          }
        );

      if (!response.ok) {
        let message =
          text("Não foi possível salvar as configurações.", "Could not save settings.");

        try {
          const data =
            await response.json();

          if (
            typeof data?.message ===
              "string" &&
            data.message
          ) {
            message = data.message;
          }
        } catch {
          // mantém mensagem padrão
        }

        throw new Error(message);
      }

      const updatedProfile:
        StoreProfile =
        await response.json();

      setProfile(updatedProfile);

      fillProfileForm(
        updatedProfile
      );

      setStoreName(
        updatedProfile.name
      );

      setWhatsapp(
        updatedProfile.whatsapp ?? ""
      );

      setSettings(
        (current) =>
          current
            ? {
                ...current,

                storeName:
                  updatedProfile.name,

                whatsapp:
                  updatedProfile.whatsapp,
              }
            : current
      );

      setSuccessMessage(
        "Configurações da loja salvas com sucesso."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : text("Não foi possível salvar as configurações.", "Could not save settings.")
      );
    } finally {
      setSavingProfile(false);
    }
  }

  const limitEnabled =
    status !== null &&
    status.dailyOrderLimit > 0;

  const limitReached =
    limitEnabled &&
    status !== null &&
    status.ordersToday >=
      status.dailyOrderLimit;

  const remainingOrders =
    status
      ? Math.max(
          status.dailyOrderLimit -
            status.ordersToday,
          0
        )
      : 0;

  const percentage =
    status &&
    status.dailyOrderLimit > 0
      ? Math.min(
          (status.ordersToday /
            status.dailyOrderLimit) *
            100,
          100
        )
      : 0;

  // A prévia dos selos da fidelidade usa a cor principal já salva no perfil.
  // Esse valor precisa continuar existindo mesmo com a personalização visual
  // removida desta tela.
  const previewPrimary =
    profileForm.primaryColor || DEFAULT_PRIMARY;

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <AdminHeader />

        <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[24px] border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {text("Carregando configurações...", "Loading settings...")}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!settings || !status) {
    return (
      <main className="min-h-screen bg-background">
        <AdminHeader />

        <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[24px] border border-red-200 bg-red-50 p-6">
            <p className="font-semibold text-red-700">
              {text("Atenção", "Attention")}
            </p>

            <p className="mt-1 text-sm text-red-600">
              {errorMessage ||
                text("Não foi possível carregar as configurações.", "Could not load settings.")}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <AdminHeader />

      <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 lg:px-8">

        <div className="mb-6 border-b border-border pb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            {text("Administração", "Administration")}
          </p>

          <h2 className="mt-2 font-display text-4xl uppercase leading-none tracking-tight text-foreground">
            {text("Configurações da pizzaria", "Pizzeria settings")}
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            {text("Controle o funcionamento, limites, informações de contato e programa de fidelidade.", "Manage business hours, limits, contact details, and the loyalty program.")}
          </p>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                {text("Entregas", "Delivery")}
              </p>

              <h2 className="mt-1 text-lg font-bold text-foreground">
                {text("Taxa por distância", "Distance-based delivery fee")}
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                {text("Configure endereço da pizzaria, valor por km, distância máxima e frete grátis.", "Set the restaurant address, cost per km, maximum range, and free delivery.")}
              </p>
            </div>

            <Link
              href="/admin/entregas"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-bold text-foreground transition hover:bg-muted"
            >
              {text("Configurar entrega", "Configure delivery")}
            </Link>

          </div>
        </section>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-700">
              {text("Atenção", "Attention")}
            </p>

            <p className="mt-1 text-sm text-red-600">
              {errorMessage}
            </p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="font-semibold text-emerald-700">
              {text("Tudo certo", "All set")}
            </p>

            <p className="mt-1 text-sm text-emerald-700">
              {successMessage}
            </p>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">

          <section className="rounded-[22px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              {text("Controle manual", "Manual control")}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${
                  settings.open
                    ? "bg-emerald-500"
                    : "bg-red-500"
                }`}
              />

              <h3
                className={`text-xl font-bold ${
                  settings.open
                    ? "text-emerald-700"
                    : "text-red-600"
                }`}
              >
                {settings.open
                  ? text("Aberto pelo admin", "Opened by admin")
                  : text("Fechado pelo admin", "Closed by admin")}
              </h3>
            </div>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {text("Bloqueia ou libera novos pedidos manualmente, independente do horário configurado.", "Manually enable or disable new orders, regardless of opening hours.")}
            </p>

            <div className="mt-6">
              <Toggle
                checked={settings.open}
                disabled={changingStatus}
                onChange={changeStoreStatus}
                label={
                  changingStatus
                    ? text("Atualizando...", "Updating...")
                    : settings.open
                      ? text("Recebimento liberado", "Order intake enabled")
                      : text("Recebimento bloqueado", "Order intake disabled")
                }
                description={text("Controle geral de novos pedidos", "General control for new orders")}
              />
            </div>
          </section>

          <section className="rounded-[22px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              {text("Status real", "Live status")}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${
                  status.open
                    ? "bg-emerald-500"
                    : "bg-red-500"
                }`}
              />

              <h3
                className={`text-xl font-bold ${
                  status.open
                    ? "text-emerald-700"
                    : "text-red-600"
                }`}
              >
                {status.open
                  ? text("Recebendo pedidos", "Accepting orders")
                  : text("Pedidos fechados", "Orders closed")}
              </h3>
            </div>

            <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">
              {localizedStatus(status.message)}
            </p>

            <div className="mt-5 space-y-3 rounded-xl border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  {text("Controle manual", "Manual control")}
                </span>

                <strong
                  className={
                    status.manualOpen
                      ? "text-emerald-700"
                      : "text-red-700"
                  }
                >
                  {status.manualOpen
                    ? text("Aberto", "Open")
                    : text("Fechado", "Closed")}
                </strong>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  {text("Novos pedidos", "New orders")}
                </span>

                <strong
                  className={
                    status.open
                      ? "text-emerald-700"
                      : "text-red-700"
                  }
                >
                  {status.open
                    ? text("Liberados", "Enabled")
                    : text("Bloqueados", "Blocked")}
                </strong>
              </div>
            </div>
          </section>

          <section className="rounded-[22px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              {text("Pedidos aprovados hoje", "Orders approved today")}
            </p>

            <h3
              className={`mt-3 text-4xl font-bold ${
                limitReached
                  ? "text-red-600"
                  : "text-foreground"
              }`}
            >
              {status.ordersToday}

              {limitEnabled && (
                <span className="text-xl font-semibold text-muted-foreground">
                  {" "}
                  / {status.dailyOrderLimit}
                </span>
              )}
            </h3>

            {limitEnabled ? (
              <>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all ${
                      limitReached
                        ? "bg-red-600"
                        : "bg-primary"
                    }`}
                    style={{
                      width:
                        `${percentage}%`,
                    }}
                  />
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  {limitReached
                    ? text("Limite diário atingido. Novos pedidos estão bloqueados.", "Daily limit reached. New orders are blocked.")
                    : `${remainingOrders} ${
                        remainingOrders === 1
                          ? text("pedido disponível", "order available")
                          : text("pedidos disponíveis", "orders available")
                      } hoje.`}
                </p>
              </>
            ) : (
              <div className="mt-5 rounded-xl bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-700">
                  {text("Sem limite diário", "No daily limit")}
                </p>

                <p className="mt-1 text-xs text-emerald-700">
                  {text("A quantidade de pedidos não está limitada.", "There is no daily order limit.")}
                </p>
              </div>
            )}
          </section>
        </div>

        <form
          onSubmit={saveSettings}
          className="mt-6 rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              {text("Operação", "Operations")}
            </p>

            <h3 className="mt-1 font-display text-2xl uppercase tracking-tight text-foreground">
              {text("Dados gerais", "General settings")}
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              {text("Configurações usadas pela operação e controle diário.", "Settings for daily restaurant operations.")}
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            <div>
              <FieldLabel>
                {text("Nome da pizzaria", "Restaurant name")}
              </FieldLabel>

              <input
                required
                value={storeName}
                onChange={(event) =>
                  setStoreName(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder={text("Nome da pizzaria", "Restaurant name")}
              />
            </div>

            <div>
              <FieldLabel>
                {text("Limite diário de pedidos", "Daily order limit")}
              </FieldLabel>

              <input
                type="number"
                min="0"
                value={dailyOrderLimit}
                onChange={(event) =>
                  setDailyOrderLimit(
                    Number(
                      event.target.value
                    )
                  )
                }
                className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
              />

              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {text("Somente pedidos aprovados entram na contagem. Use 0 para deixar sem limite.", "Only approved orders count. Enter 0 for no limit.")}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-sm disabled:pointer-events-none disabled:opacity-50"
            >
              {saving
                ? text("Salvando...", "Saving...")
                : text("Salvar operação", "Save operations")}
            </button>
          </div>
        </form>

        <section className="mt-6 rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                {text("Pagamentos", "Payments")}
              </p>
              <h3 className="mt-1 font-display text-2xl uppercase tracking-tight text-foreground">
                Mercado Pago
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {text("Conecte a conta Mercado Pago da loja para receber os pagamentos dos clientes diretamente na conta do estabelecimento.", "Connect the restaurant's Mercado Pago account so customers pay the restaurant directly.")}
              </p>
            </div>

            <div className="shrink-0">
              {mercadoPagoLoading ? (
                <span className="inline-flex h-9 items-center rounded-full border border-border bg-background px-4 text-xs font-bold text-muted-foreground">
                  {text("Verificando...", "Checking...")}
                </span>
              ) : mercadoPagoStatus?.connected ? (
                <span className="inline-flex h-9 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-xs font-bold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {text("Conectado", "Connected")}
                </span>
              ) : (
                <span className="inline-flex h-9 items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 text-xs font-bold text-amber-700">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  {text("Não conectado", "Not connected")}
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-background p-4">
            {mercadoPagoStatus?.connected ? (
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">Conta Mercado Pago vinculada</p>
                  {mercadoPagoStatus.mercadoPagoUserId && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {text("Identificação da conta:", "Account ID:")} {mercadoPagoStatus.mercadoPagoUserId}
                    </p>
                  )}
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {text("Os dados de acesso da conta ficam protegidos no backend e não são exibidos no painel.", "Account credentials are secured in the backend and aren't displayed here.")}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={mercadoPagoActionLoading}
                  onClick={disconnectMercadoPago}
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:pointer-events-none disabled:opacity-50"
                >
                  {mercadoPagoActionLoading ? text("Desconectando...", "Disconnecting...") : text("Desconectar", "Disconnect")}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">Nenhuma conta vinculada</p>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
                    {text("O proprietário autoriza o PizzaSystem na própria conta Mercado Pago. Nenhuma senha ou Access Token é solicitado neste painel.", "The owner connects their own Mercado Pago account. No password or access token is requested here.")}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={mercadoPagoLoading || mercadoPagoActionLoading}
                  onClick={connectMercadoPago}
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-sm disabled:pointer-events-none disabled:opacity-50"
                >
                  {mercadoPagoActionLoading ? text("Conectando...", "Connecting...") : text("Conectar Mercado Pago", "Connect Mercado Pago")}
                </button>
              </div>
            )}
          </div>

          {!mercadoPagoLoading && !mercadoPagoStatus?.connected && (
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              {text("A conexão OAuth será habilitada assim que as credenciais de produção da aplicação estiverem configuradas.", "OAuth connection will be available once the production app credentials are configured.")}
            </p>
          )}
        </section>

        <form
          onSubmit={saveProfile}
          className="mt-6"
        >
          <div className="space-y-6">

            <section className="rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                {text("Contato", "Contact")}
              </p>

              <h3 className="mt-1 font-display text-2xl uppercase tracking-tight text-foreground">
                {text("Contato da loja", "Restaurant contact")}
              </h3>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {text("Dados de contato utilizados no atendimento e nas informações públicas da loja.", "Contact details used for customer service and public restaurant information.")}
              </p>

              <div className="mt-6 grid gap-5 md:grid-cols-2">

                <div>
                  <FieldLabel>
                    WhatsApp
                  </FieldLabel>

                  <input
                    value={
                      profileForm.whatsapp
                    }
                    onChange={(event) =>
                      setProfileForm(
                        (current) => ({
                          ...current,
                          whatsapp:
                            event.target.value,
                        })
                      )
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    placeholder="(19) 99999-9999"
                  />
                </div>

                <div>
                  <FieldLabel>
                    {text("Telefone", "Phone")}
                  </FieldLabel>

                  <input
                    value={
                      profileForm.phone
                    }
                    onChange={(event) =>
                      setProfileForm(
                        (current) => ({
                          ...current,
                          phone:
                            event.target.value,
                        })
                      )
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    placeholder="(19) 3333-3333"
                  />
                </div>

                <div className="md:col-span-2">
                  <FieldLabel>
                    {text("E-mail", "Email")}
                  </FieldLabel>

                  <input
                    type="email"
                    value={
                      profileForm.email
                    }
                    onChange={(event) =>
                      setProfileForm(
                        (current) => ({
                          ...current,
                          email:
                            event.target.value,
                        })
                      )
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    placeholder="contato@pizzaria.com.br"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                {text("Fidelidade", "Loyalty")}
              </p>

              <h3 className="mt-1 font-display text-2xl uppercase tracking-tight text-foreground">
                {text("Clube de clientes", "Customer loyalty club")}
              </h3>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {text("O cliente continuará podendo comprar sem cadastro. O clube é opcional para quem quiser acumular selos.", "Customers can order without registering. Joining the stamp club is optional.")}
              </p>

              <div className="mt-6 space-y-5">

                <Toggle
                  checked={
                    profileForm.loyaltyEnabled
                  }
                  onChange={() =>
                    setProfileForm(
                      (current) => ({
                        ...current,
                        loyaltyEnabled:
                          !current.loyaltyEnabled,
                      })
                    )
                  }
                  label={
                    profileForm.loyaltyEnabled
                      ? text("Programa ativado", "Program enabled")
                      : text("Programa desativado", "Program disabled")
                  }
                  description={text("Permitir que clientes participem do programa de fidelidade", "Let customers join the loyalty program")}
                />

                {profileForm.loyaltyEnabled && (
                  <>
                    <div className="rounded-2xl border border-border bg-background p-4">

                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {text("Como o cliente ganha selos?", "How do customers earn stamps?")}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {text("Escolha a regra usada para calcular os selos de cada pedido aprovado.", "Choose how stamps are awarded for approved orders.")}
                        </p>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">

                        <button
                          type="button"
                          onClick={() =>
                            setProfileForm(
                              (current) => ({
                                ...current,
                                loyaltyEarningType:
                                  "PER_ORDER",
                              })
                            )
                          }
                          className={`rounded-xl border p-4 text-left transition ${
                            profileForm.loyaltyEarningType ===
                            "PER_ORDER"
                              ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                              : "border-border bg-card hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-start gap-3">

                            <span
                              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                                profileForm.loyaltyEarningType ===
                                "PER_ORDER"
                                  ? "border-primary"
                                  : "border-muted-foreground/40"
                              }`}
                            >
                              {profileForm.loyaltyEarningType ===
                                "PER_ORDER" && (
                                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                              )}
                            </span>

                            <div>
                              <p className="text-sm font-bold">
                                {text("1 selo por pedido", "1 stamp per order")}
                              </p>

                              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                {text("O cliente recebe uma quantidade fixa de selos em cada pedido aprovado.", "Customers earn a fixed number of stamps for each approved order.")}
                              </p>
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setProfileForm(
                              (current) => ({
                                ...current,
                                loyaltyEarningType:
                                  "PER_AMOUNT",
                              })
                            )
                          }
                          className={`rounded-xl border p-4 text-left transition ${
                            profileForm.loyaltyEarningType ===
                            "PER_AMOUNT"
                              ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                              : "border-border bg-card hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-start gap-3">

                            <span
                              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                                profileForm.loyaltyEarningType ===
                                "PER_AMOUNT"
                                  ? "border-primary"
                                  : "border-muted-foreground/40"
                              }`}
                            >
                              {profileForm.loyaltyEarningType ===
                                "PER_AMOUNT" && (
                                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                              )}
                            </span>

                            <div>
                              <p className="text-sm font-bold">
                                {text("Selos por valor gasto", "Stamps per amount spent")}
                              </p>

                              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                {text("O cliente ganha selos conforme o valor do pedido.", "Customers earn stamps based on their order total.")}
                              </p>
                            </div>
                          </div>
                        </button>
                      </div>

                      {profileForm.loyaltyEarningType ===
                      "PER_ORDER" ? (
                        <div className="mt-4">
                          <FieldLabel>
                            {text("Selos por pedido", "Stamps per order")}
                          </FieldLabel>

                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={
                              profileForm.loyaltyPointsPerOrder
                            }
                            onChange={(event) =>
                              setProfileForm(
                                (current) => ({
                                  ...current,
                                  loyaltyPointsPerOrder:
                                    Number(
                                      event.target.value
                                    ),
                                })
                              )
                            }
                            className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                          />

                          <p className="mt-2 text-xs leading-5 text-muted-foreground">
                            {text("Exemplo: 1 selo por pedido aprovado.", "Example: 1 stamp per approved order.")}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 grid gap-4 md:grid-cols-2">

                          <div>
                            <FieldLabel>
                              {text("A cada valor de", "For every amount of")}
                            </FieldLabel>

                            <div className="relative">
                              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                                {getStoreCurrencySymbol()}
                              </span>

                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={
                                  profileForm.loyaltyAmountStep
                                }
                                onChange={(event) =>
                                  setProfileForm(
                                    (current) => ({
                                      ...current,
                                      loyaltyAmountStep:
                                        Number(
                                          event.target.value
                                        ),
                                    })
                                  )
                                }
                                className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                              />
                            </div>

                            <p className="mt-2 text-xs leading-5 text-muted-foreground">
                              Exemplo: a cada {formatStoreMoney(20)} em compras.
                            </p>
                          </div>

                          <div>
                            <FieldLabel>
                              {text("Selos ganhos", "Stamps earned")}
                            </FieldLabel>

                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={
                                profileForm.loyaltyPointsPerAmountStep
                              }
                              onChange={(event) =>
                                setProfileForm(
                                  (current) => ({
                                    ...current,
                                    loyaltyPointsPerAmountStep:
                                      Number(
                                        event.target.value
                                      ),
                                  })
                                )
                              }
                              className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                            />

                            <p className="mt-2 text-xs leading-5 text-muted-foreground">
                              Exemplo: 1 selo a cada {formatStoreMoney(20)}.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4">
                        <FieldLabel>
                          {text("Valor mínimo do pedido", "Minimum order amount")}
                        </FieldLabel>

                        <div className="relative">
                          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                            {getStoreCurrencySymbol()}
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              profileForm.loyaltyMinimumOrderValue ??
                              ""
                            }
                            onChange={(event) =>
                              setProfileForm(
                                (current) => ({
                                  ...current,
                                  loyaltyMinimumOrderValue:
                                    event.target.value ===
                                    ""
                                      ? null
                                      : Number(
                                          event.target.value
                                        ),
                                })
                              )
                            }
                            className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                            placeholder="0,00"
                          />
                        </div>

                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          {text("Deixe em branco para permitir selos em qualquer valor de pedido.", "Leave blank to award stamps on orders of any value.")}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">

                      <div>
                        <FieldLabel>
                          {text("Meta de selos", "Stamp goal")}
                        </FieldLabel>

                        <input
                          type="number"
                          min="2"
                          max="100"
                          value={
                            profileForm.loyaltyStampGoal
                          }
                          onChange={(event) =>
                            setProfileForm(
                              (current) => ({
                                ...current,
                                loyaltyStampGoal:
                                  Number(
                                    event.target.value
                                  ),
                              })
                            )
                          }
                          className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                        />

                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          {text("Quantos selos o cliente precisa completar para liberar a recompensa.", "The number of stamps required to unlock a reward.")}
                        </p>
                      </div>

                      <div>
                        <FieldLabel>
                          {text("Recompensa", "Reward")}
                        </FieldLabel>

                        <input
                          value={
                            profileForm.loyaltyRewardDescription
                          }
                          onChange={(event) =>
                            setProfileForm(
                              (current) => ({
                                ...current,
                                loyaltyRewardDescription:
                                  event.target.value,
                              })
                            )
                          }
                          maxLength={180}
                          className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                          placeholder={text("Ganhe uma pizza grátis", "Get a free pizza")}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-4">

                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        {text("Prévia dos selos", "Stamp preview")}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {Array.from({
                          length:
                            Math.min(
                              Math.max(
                                profileForm.loyaltyStampGoal,
                                1
                              ),
                              20
                            ),
                        }).map(
                          (_, index) => (
                            <span
                              key={index}
                              className="grid h-8 w-8 place-items-center rounded-full border text-[10px] font-bold"
                              style={{
                                borderColor:
                                  previewPrimary,

                                backgroundColor:
                                  index < 4
                                    ? previewPrimary
                                    : "transparent",

                                color:
                                  index < 4
                                    ? "#ffffff"
                                    : previewPrimary,
                              }}
                            >
                              {index + 1}
                            </span>
                          )
                        )}
                      </div>

                      {profileForm.loyaltyStampGoal >
                        20 && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {text("Prévia limitada aos primeiros 20 selos.", "Preview is limited to the first 20 stamps.")}
                        </p>
                      )}

                      <div className="mt-4 rounded-xl bg-muted/40 p-3">

                        <p className="text-xs font-semibold text-foreground">
                          {text("Regra atual", "Current rule")}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {profileForm.loyaltyEarningType ===
                          "PER_ORDER"
                            ? `${profileForm.loyaltyPointsPerOrder} ${
                                profileForm.loyaltyPointsPerOrder ===
                                1
                                  ? "selo"
                                  : "selos"
                              } por pedido aprovado`
                            : `${profileForm.loyaltyPointsPerAmountStep} ${
                                profileForm.loyaltyPointsPerAmountStep ===
                                1
                                  ? "selo"
                                  : "selos"
                              } a cada ${formatStoreMoney(
                                profileForm.loyaltyAmountStep
                              )}`}
                        </p>

                        {profileForm.loyaltyMinimumOrderValue !==
                          null && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {text("Pedido mínimo para participar:", "Minimum order to qualify:")}{" "}
                            {formatStoreMoney(
                              profileForm.loyaltyMinimumOrderValue
                            )}
                          </p>
                        )}

                        <p className="mt-1 text-xs font-semibold text-primary">
                          {text("Recompensa:", "Reward:")}{" "}
                          {profileForm.loyaltyRewardDescription ||
                            "Defina uma recompensa"}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-7 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
              >
                {savingProfile
                  ? "Salvando..."
                  : text("Salvar contato e fidelidade", "Save contact and loyalty")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
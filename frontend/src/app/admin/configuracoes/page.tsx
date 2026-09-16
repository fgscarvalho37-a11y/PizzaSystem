"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminHeader from "@/components/AdminHeader";
import { adminFetch } from "@/lib/adminFetch";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080";

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
        "Não foi possível carregar as configurações."
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
          ? "Recebimento manual de pedidos ativado."
          : "Recebimento de pedidos fechado manualmente."
      );
    } catch {
      setErrorMessage(
        "Não foi possível alterar o funcionamento."
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
        "Configurações operacionais salvas."
      );
    } catch {
      setErrorMessage(
        "Não foi possível salvar as configurações."
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
          "Não foi possível salvar as configurações.";

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
          : "Não foi possível salvar as configurações."
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

  const previewPrimary =
    profileForm.primaryColor ||
    DEFAULT_PRIMARY;

  const previewSecondary =
    profileForm.secondaryColor ||
    DEFAULT_SECONDARY;

  const previewInitial =
    useMemo(() => {
      const name =
        profileForm.name.trim();

      return name
        ? name
            .charAt(0)
            .toUpperCase()
        : "P";
    }, [profileForm.name]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <AdminHeader />

        <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[24px] border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Carregando configurações...
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
              Atenção
            </p>

            <p className="mt-1 text-sm text-red-600">
              {errorMessage ||
                "Não foi possível carregar as configurações."}
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
            Administração
          </p>

          <h2 className="mt-2 font-display text-4xl uppercase leading-none tracking-tight text-foreground">
            Configurações da pizzaria
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Controle a operação, identidade visual, comunicação e programa de fidelidade.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-700">
              Atenção
            </p>

            <p className="mt-1 text-sm text-red-600">
              {errorMessage}
            </p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="font-semibold text-emerald-700">
              Tudo certo
            </p>

            <p className="mt-1 text-sm text-emerald-700">
              {successMessage}
            </p>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">

          <section className="rounded-[22px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Controle manual
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
                  ? "Aberto pelo admin"
                  : "Fechado pelo admin"}
              </h3>
            </div>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Bloqueia ou libera novos pedidos manualmente, independente do horário configurado.
            </p>

            <div className="mt-6">
              <Toggle
                checked={settings.open}
                disabled={changingStatus}
                onChange={changeStoreStatus}
                label={
                  changingStatus
                    ? "Atualizando..."
                    : settings.open
                      ? "Recebimento liberado"
                      : "Recebimento bloqueado"
                }
                description="Controle geral de novos pedidos"
              />
            </div>
          </section>

          <section className="rounded-[22px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Status real
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
                  ? "Recebendo pedidos"
                  : "Pedidos fechados"}
              </h3>
            </div>

            <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">
              {status.message}
            </p>

            <div className="mt-5 space-y-3 rounded-xl border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Controle manual
                </span>

                <strong
                  className={
                    status.manualOpen
                      ? "text-emerald-700"
                      : "text-red-700"
                  }
                >
                  {status.manualOpen
                    ? "Aberto"
                    : "Fechado"}
                </strong>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  Novos pedidos
                </span>

                <strong
                  className={
                    status.open
                      ? "text-emerald-700"
                      : "text-red-700"
                  }
                >
                  {status.open
                    ? "Liberados"
                    : "Bloqueados"}
                </strong>
              </div>
            </div>
          </section>

          <section className="rounded-[22px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Pedidos aprovados hoje
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
                    ? "Limite diário atingido. Novos pedidos estão bloqueados."
                    : `${remainingOrders} ${
                        remainingOrders === 1
                          ? "pedido disponível"
                          : "pedidos disponíveis"
                      } hoje.`}
                </p>
              </>
            ) : (
              <div className="mt-5 rounded-xl bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-700">
                  Sem limite diário
                </p>

                <p className="mt-1 text-xs text-emerald-700">
                  A quantidade de pedidos não está limitada.
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
              Operação
            </p>

            <h3 className="mt-1 font-display text-2xl uppercase tracking-tight text-foreground">
              Dados gerais
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Configurações usadas pela operação e controle diário.
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            <div>
              <FieldLabel>
                Nome da pizzaria
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
                placeholder="Nome da pizzaria"
              />
            </div>

            <div>
              <FieldLabel>
                WhatsApp
              </FieldLabel>

              <input
                value={whatsapp}
                onChange={(event) =>
                  setWhatsapp(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="(19) 99999-9999"
              />

              <p className="mt-2 text-xs text-muted-foreground">
                Número utilizado para contato da pizzaria.
              </p>
            </div>

            <div>
              <FieldLabel>
                Limite diário de pedidos
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
                Somente pedidos aprovados entram na contagem. Use 0 para deixar sem limite.
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
                ? "Salvando..."
                : "Salvar operação"}
            </button>
          </div>
        </form>

        <form
          onSubmit={saveProfile}
          className="mt-6"
        >
          <div className="space-y-6">

            <section className="rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Identidade
              </p>

              <h3 className="mt-1 font-display text-2xl uppercase tracking-tight text-foreground">
                Identidade da loja
              </h3>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Informações básicas usadas no cardápio público.
              </p>

              <div className="mt-6 grid gap-5 md:grid-cols-2">

                <div className="md:col-span-2">
                  <FieldLabel>
                    Nome exibido
                  </FieldLabel>

                  <input
                    required
                    value={
                      profileForm.name
                    }
                    onChange={(event) =>
                      setProfileForm(
                        (current) => ({
                          ...current,
                          name:
                            event.target.value,
                        })
                      )
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    placeholder="Nome da pizzaria"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Cor principal
                  </FieldLabel>

                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={
                        profileForm.primaryColor
                      }
                      onChange={(event) =>
                        setProfileForm(
                          (current) => ({
                            ...current,
                            primaryColor:
                              event.target.value,
                          })
                        )
                      }
                      className="h-11 w-14 cursor-pointer rounded-xl border border-input bg-background p-1"
                    />

                    <input
                      value={
                        profileForm.primaryColor
                      }
                      onChange={(event) =>
                        setProfileForm(
                          (current) => ({
                            ...current,
                            primaryColor:
                              event.target.value,
                          })
                        )
                      }
                      maxLength={7}
                      className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-background px-3.5 text-sm font-mono outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel>
                    Cor secundária
                  </FieldLabel>

                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={
                        profileForm.secondaryColor
                      }
                      onChange={(event) =>
                        setProfileForm(
                          (current) => ({
                            ...current,
                            secondaryColor:
                              event.target.value,
                          })
                        )
                      }
                      className="h-11 w-14 cursor-pointer rounded-xl border border-input bg-background p-1"
                    />

                    <input
                      value={
                        profileForm.secondaryColor
                      }
                      onChange={(event) =>
                        setProfileForm(
                          (current) => ({
                            ...current,
                            secondaryColor:
                              event.target.value,
                          })
                        )
                      }
                      maxLength={7}
                      className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-background px-3.5 text-sm font-mono outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <FieldLabel>
                    Frase principal
                  </FieldLabel>

                  <input
                    value={
                      profileForm.headline
                    }
                    onChange={(event) =>
                      setProfileForm(
                        (current) => ({
                          ...current,
                          headline:
                            event.target.value,
                        })
                      )
                    }
                    maxLength={180}
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    placeholder="Pizza feita do nosso jeito, do forno até você."
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Comunicação
              </p>

              <h3 className="mt-1 font-display text-2xl uppercase tracking-tight text-foreground">
                Faixa do cardápio
              </h3>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Controle a mensagem exibida na parte pública do cardápio.
              </p>

              <div className="mt-6 space-y-5">

                <Toggle
                  checked={
                    profileForm.marqueeEnabled
                  }
                  onChange={() =>
                    setProfileForm(
                      (current) => ({
                        ...current,
                        marqueeEnabled:
                          !current.marqueeEnabled,
                      })
                    )
                  }
                  label={
                    profileForm.marqueeEnabled
                      ? "Mensagem ativada"
                      : "Mensagem desativada"
                  }
                  description="Exibir a faixa promocional no cardápio"
                />

                <div>
                  <FieldLabel>
                    Mensagem
                  </FieldLabel>

                  <input
                    value={
                      profileForm.marqueeMessage
                    }
                    onChange={(event) =>
                      setProfileForm(
                        (current) => ({
                          ...current,
                          marqueeMessage:
                            event.target.value,
                        })
                      )
                    }
                    maxLength={250}
                    disabled={
                      !profileForm.marqueeEnabled
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Entrega grátis acima de R$ 80"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Contato
              </p>

              <h3 className="mt-1 font-display text-2xl uppercase tracking-tight text-foreground">
                Informações públicas
              </h3>

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
                    Telefone
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
                    E-mail
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
                Fidelidade
              </p>

              <h3 className="mt-1 font-display text-2xl uppercase tracking-tight text-foreground">
                Clube de clientes
              </h3>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                O cliente continuará podendo comprar sem cadastro. O clube é opcional para quem quiser acumular selos.
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
                      ? "Programa ativado"
                      : "Programa desativado"
                  }
                  description="Permitir que clientes participem do programa de fidelidade"
                />

                {profileForm.loyaltyEnabled && (
                  <>
                    <div className="rounded-2xl border border-border bg-background p-4">

                      <div>
                        <p className="text-sm font-bold text-foreground">
                          Como o cliente ganha selos?
                        </p>

                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Escolha a regra usada para calcular os selos de cada pedido aprovado.
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
                                1 selo por pedido
                              </p>

                              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                O cliente recebe uma quantidade fixa de selos em cada pedido aprovado.
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
                                Selos por valor gasto
                              </p>

                              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                O cliente ganha selos conforme o valor do pedido.
                              </p>
                            </div>
                          </div>
                        </button>
                      </div>

                      {profileForm.loyaltyEarningType ===
                      "PER_ORDER" ? (
                        <div className="mt-4">
                          <FieldLabel>
                            Selos por pedido
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
                            Exemplo: 1 selo por pedido aprovado.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 grid gap-4 md:grid-cols-2">

                          <div>
                            <FieldLabel>
                              A cada valor de
                            </FieldLabel>

                            <div className="relative">
                              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                                R$
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
                              Exemplo: a cada R$ 20 em compras.
                            </p>
                          </div>

                          <div>
                            <FieldLabel>
                              Selos ganhos
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
                              Exemplo: 1 selo a cada R$ 20.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4">
                        <FieldLabel>
                          Valor mínimo do pedido
                        </FieldLabel>

                        <div className="relative">
                          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                            R$
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
                          Deixe em branco para permitir selos em qualquer valor de pedido.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">

                      <div>
                        <FieldLabel>
                          Meta de selos
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
                          Quantos selos o cliente precisa completar para liberar a recompensa.
                        </p>
                      </div>

                      <div>
                        <FieldLabel>
                          Recompensa
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
                          placeholder="Ganhe uma pizza grátis"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-4">

                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        Prévia dos selos
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
                          Prévia limitada aos primeiros 20 selos.
                        </p>
                      )}

                      <div className="mt-4 rounded-xl bg-muted/40 p-3">

                        <p className="text-xs font-semibold text-foreground">
                          Regra atual
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
                              } a cada R$ ${profileForm.loyaltyAmountStep
                                .toFixed(2)
                                .replace(
                                  ".",
                                  ","
                                )}`}
                        </p>

                        {profileForm.loyaltyMinimumOrderValue !==
                          null && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Pedido mínimo para participar: R${" "}
                            {profileForm.loyaltyMinimumOrderValue
                              .toFixed(2)
                              .replace(
                                ".",
                                ","
                              )}
                          </p>
                        )}

                        <p className="mt-1 text-xs font-semibold text-primary">
                          Recompensa:{" "}
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
                  : "Salvar configurações"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
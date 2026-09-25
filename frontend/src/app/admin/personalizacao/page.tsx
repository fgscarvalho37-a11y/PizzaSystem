"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminHeader from "@/components/AdminHeader";
import { adminFetch } from "@/lib/adminFetch";

const API_URL = "";

const DEFAULT_PRIMARY = "#E63946";
const DEFAULT_SECONDARY = "#F4C95D";


const DEFAULT_PERSONALIZATION = {
  primaryColor: DEFAULT_PRIMARY,
  secondaryColor: DEFAULT_SECONDARY,
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
  menuEmptyTitle: "Nenhum item encontrado",
  menuEmptyDescription: "Tente outra categoria ou altere sua busca.",
  footerTagline: "Pedidos online",
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
  loyaltyEarningType: "PER_ORDER" | "PER_AMOUNT" | null;
  loyaltyPointsPerOrder: number | null;
  loyaltyAmountStep: number | null;
  loyaltyPointsPerAmountStep: number | null;
  loyaltyMinimumOrderValue: number | null;
};

type StorageStatus = {
  persistent: boolean;
  provider: string;
  bucket: string;
};

type PersonalizationForm = {
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
};

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

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3 text-left transition hover:bg-muted"
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
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

export default function PersonalizacaoPage() {
  const [profile, setProfile] =
    useState<StoreProfile | null>(null);

  const [form, setForm] =
    useState<PersonalizationForm>({
      name: "",
      primaryColor: DEFAULT_PRIMARY,
      secondaryColor: DEFAULT_SECONDARY,
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
      menuSearchPlaceholder:
        "Buscar no cardápio",
      menuEmptyTitle:
        "Nenhum produto encontrado",
      menuEmptyDescription:
        "Tente buscar por outro termo ou escolha outra categoria.",

      footerTagline: "Pedidos online",
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploadingLogo, setUploadingLogo] =
    useState(false);

  const [uploadingCover, setUploadingCover] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [
    storageStatus,
    setStorageStatus,
  ] =
    useState<StorageStatus | null>(
      null
    );

  const previewPrimary =
    form.primaryColor || DEFAULT_PRIMARY;

  const previewSecondary =
    form.secondaryColor || DEFAULT_SECONDARY;

  const previewInitial =
    useMemo(() => {
      const name = form.name.trim();

      return name
        ? name.charAt(0).toUpperCase()
        : "P";
    }, [form.name]);

  function fillForm(data: StoreProfile) {
    setForm({
      name: data.name ?? "",
      primaryColor:
        data.primaryColor ?? DEFAULT_PRIMARY,
      secondaryColor:
        data.secondaryColor ??
        DEFAULT_SECONDARY,
      headline: data.headline ?? "",
      marqueeMessage:
        data.marqueeMessage ?? "",
      marqueeEnabled:
        data.marqueeEnabled ?? true,

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
        data.heroPrimaryButtonText ??
        "Ver cardápio",
      heroSecondaryButtonText:
        data.heroSecondaryButtonText ??
        "Ver meu pedido",
      heroBadgeText:
        data.heroBadgeText ??
        "CARDÁPIO ONLINE",
      heroOpenStatusText:
        data.heroOpenStatusText ?? "ABERTO",
      heroClosedStatusText:
        data.heroClosedStatusText ??
        "FECHADO",

      menuTitle:
        data.menuTitle ?? "O cardápio",
      menuSubtitle:
        data.menuSubtitle ?? "Escolha o seu",
      menuSearchPlaceholder:
        data.menuSearchPlaceholder ??
        "Buscar no cardápio",
      menuEmptyTitle:
        data.menuEmptyTitle ??
        "Nenhum produto encontrado",
      menuEmptyDescription:
        data.menuEmptyDescription ??
        "Tente buscar por outro termo ou escolha outra categoria.",

      footerTagline:
        data.footerTagline ??
        "Pedidos online",
    });
  }

  async function loadProfile() {
    try {
      setErrorMessage("");

      const [
        response,
        storageResponse,
      ] =
        await Promise.all([
          adminFetch(
            `${API_URL}/api/store/profile`,
            {
              cache: "no-store",
            }
          ),
          adminFetch(
            `${API_URL}/api/store/images/status`,
            {
              cache: "no-store",
            }
          ),
        ]);

      if (!response.ok) {
        throw new Error(
          "Não foi possível carregar a personalização."
        );
      }

      const data: StoreProfile =
        await response.json();

      setProfile(data);
      fillForm(data);

      if (
        storageResponse.ok
      ) {
        const storage:
          StorageStatus =
          await storageResponse.json();

        setStorageStatus(
          storage
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a personalização."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  function imageUrl(
    value: string | null | undefined
  ) {
    if (!value) {
      return "";
    }

    if (
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("data:")
    ) {
      return value;
    }

    return `${API_URL}${
      value.startsWith("/") ? "" : "/"
    }${value}`;
  }

  function validateImage(file: File) {
    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(file.type)
    ) {
      throw new Error(
        "Use uma imagem JPG, PNG ou WebP."
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error(
        "A imagem deve ter no máximo 5 MB."
      );
    }
  }

  async function uploadImage(
    kind: "logo" | "cover",
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    const setUploading =
      kind === "logo"
        ? setUploadingLogo
        : setUploadingCover;

    try {
      validateImage(file);

      setUploading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const body = new FormData();
      body.append("file", file);

      const response =
        await adminFetch(
          `${API_URL}/api/store/images/${kind}`,
          {
            method: "POST",
            body,
          }
        );

      if (!response.ok) {
        let message =
          "Não foi possível enviar a imagem.";

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
          // mantém a mensagem padrão
        }

        throw new Error(message);
      }

      const data: {
        success: boolean;
        url: string;
        message?: string;
      } = await response.json();

      setProfile((current) =>
        current
          ? {
              ...current,
              ...(kind === "logo"
                ? { logoUrl: data.url }
                : {
                    coverImageUrl:
                      data.url,
                  }),
            }
          : current
      );

      setSuccessMessage(
        data.message ??
          "Imagem atualizada com sucesso."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a imagem."
      );
    } finally {
      setUploading(false);
    }
  }

  async function removeImage(
    kind: "logo" | "cover"
  ) {
    const setUploading =
      kind === "logo"
        ? setUploadingLogo
        : setUploadingCover;

    try {
      setUploading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response =
        await adminFetch(
          `${API_URL}/api/store/images/${kind}`,
          {
            method: "DELETE",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Não foi possível remover a imagem."
        );
      }

      setProfile((current) =>
        current
          ? {
              ...current,
              ...(kind === "logo"
                ? { logoUrl: null }
                : {
                    coverImageUrl: null,
                  }),
            }
          : current
      );

      setSuccessMessage(
        kind === "logo"
          ? "Logo removida com sucesso."
          : "Imagem de capa removida com sucesso."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível remover a imagem."
      );
    } finally {
      setUploading(false);
    }
  }

  function resetColorsToDefault() {
    setErrorMessage("");
    setSuccessMessage(
      "Cores padrão restauradas na prévia. Clique em Salvar personalização para confirmar."
    );

    setForm((current) => ({
      ...current,
      primaryColor: DEFAULT_PRIMARY,
      secondaryColor: DEFAULT_SECONDARY,
    }));
  }

  async function save(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!form.name.trim()) {
      setErrorMessage(
        "Informe o nome exibido da loja."
      );
      return;
    }

    if (
      !/^#[0-9a-fA-F]{6}$/.test(
        form.primaryColor
      ) ||
      !/^#[0-9a-fA-F]{6}$/.test(
        form.secondaryColor
      )
    ) {
      setErrorMessage(
        "As cores precisam estar no formato hexadecimal, como #E63946."
      );
      return;
    }

    if (!profile) {
      return;
    }

    try {
      setSaving(true);

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
              name: form.name.trim(),

              logoUrl:
                profile.logoUrl ?? null,
              coverImageUrl:
                profile.coverImageUrl ?? null,

              primaryColor:
                form.primaryColor,
              secondaryColor:
                form.secondaryColor,

              headline:
                form.headline.trim(),

              marqueeMessage:
                form.marqueeMessage.trim(),
              marqueeEnabled:
                form.marqueeEnabled,

              heroTitleLine1:
                form.heroTitleLine1.trim(),
              heroTitleLine2:
                form.heroTitleLine2.trim(),
              heroTitleLine3:
                form.heroTitleLine3.trim(),
              heroDescription:
                form.heroDescription.trim(),
              heroPrimaryButtonText:
                form.heroPrimaryButtonText.trim(),
              heroSecondaryButtonText:
                form.heroSecondaryButtonText.trim(),
              heroBadgeText:
                form.heroBadgeText.trim(),
              heroOpenStatusText:
                form.heroOpenStatusText.trim(),
              heroClosedStatusText:
                form.heroClosedStatusText.trim(),

              menuTitle:
                form.menuTitle.trim(),
              menuSubtitle:
                form.menuSubtitle.trim(),
              menuSearchPlaceholder:
                form.menuSearchPlaceholder.trim(),
              menuEmptyTitle:
                form.menuEmptyTitle.trim(),
              menuEmptyDescription:
                form.menuEmptyDescription.trim(),

              footerTagline:
                form.footerTagline.trim(),

              // preserva configurações que pertencem
              // às outras telas do admin
              whatsapp:
                profile.whatsapp ?? "",
              phone:
                profile.phone ?? "",
              email:
                profile.email ?? "",

              loyaltyEnabled:
                profile.loyaltyEnabled,
              loyaltyStampGoal:
                profile.loyaltyStampGoal,
              loyaltyRewardDescription:
                profile.loyaltyRewardDescription,
              loyaltyEarningType:
                profile.loyaltyEarningType,
              loyaltyPointsPerOrder:
                profile.loyaltyPointsPerOrder,
              loyaltyAmountStep:
                profile.loyaltyAmountStep,
              loyaltyPointsPerAmountStep:
                profile.loyaltyPointsPerAmountStep,
              loyaltyMinimumOrderValue:
                profile.loyaltyMinimumOrderValue,
            }),
          }
        );

      if (!response.ok) {
        let message =
          "Não foi possível salvar a personalização.";

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
          // mantém a mensagem padrão
        }

        throw new Error(message);
      }

      const updated: StoreProfile =
        await response.json();

      setProfile(updated);
      fillForm(updated);

      setSuccessMessage(
        "Personalização salva com sucesso."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a personalização."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <AdminHeader />

        <div className="mx-auto max-w-[1380px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[24px] border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Carregando personalização...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-background">
        <AdminHeader />

        <div className="mx-auto max-w-[1380px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[24px] border border-red-200 bg-red-50 p-6">
            <p className="font-semibold text-red-700">
              Não foi possível carregar a loja
            </p>

            <p className="mt-1 text-sm text-red-600">
              {errorMessage}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <AdminHeader />

      <div className="mx-auto max-w-[1380px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-6 border-b border-border pb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Aparência
          </p>

          <div className="mt-2 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="font-display text-4xl uppercase leading-none tracking-tight text-foreground">
                Personalização
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                Controle a identidade visual e os textos do cardápio público.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resetColorsToDefault}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-bold text-foreground transition hover:bg-muted"
              >
                Restaurar cores
              </button>

              <a
                href={`/cardapio/${encodeURIComponent(
                  profile.slug
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-bold text-foreground transition hover:bg-muted"
              >
                Abrir cardápio
              </a>
            </div>
          </div>
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

        {storageStatus && (
          <div
            className={[
              "mb-6 rounded-xl border p-4",
              storageStatus.persistent
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-200 bg-amber-50",
            ].join(
              " "
            )}
          >
            <p
              className={[
                "font-semibold",
                storageStatus.persistent
                  ? "text-emerald-700"
                  : "text-amber-800",
              ].join(
                " "
              )}
            >
              {storageStatus.persistent
                ? "Imagens com armazenamento persistente"
                : "Atenção ao armazenamento das imagens"}
            </p>

            <p
              className={[
                "mt-1 text-sm leading-6",
                storageStatus.persistent
                  ? "text-emerald-700"
                  : "text-amber-700",
              ].join(
                " "
              )}
            >
              {storageStatus.persistent
                ? `Uploads salvos no ${storageStatus.provider}. Logo, capa e fotos continuam disponíveis após reinícios.`
                : "O backend está usando armazenamento local temporário. Configure o Supabase Storage no ambiente de produção antes de depender de uploads permanentes."}
            </p>
          </div>
        )}

        <form
          onSubmit={save}
          className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]"
        >
          <div className="space-y-6">
            <section className="rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Marca
              </p>

              <h2 className="mt-1 font-display text-2xl uppercase tracking-tight text-foreground">
                Identidade visual
              </h2>

              <div className="mt-6">
                <FieldLabel>
                  Nome exibido no cardápio
                </FieldLabel>

                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <FieldLabel>Logo</FieldLabel>

                  <div className="mt-2 flex h-44 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30 p-5">
                    {profile.logoUrl ? (
                      <img
                        src={imageUrl(
                          profile.logoUrl
                        )}
                        alt="Logo da loja"
                        className="max-h-32 max-w-full object-contain"
                      />
                    ) : (
                      <div
                        className="grid h-24 w-24 place-items-center rounded-2xl text-4xl font-black text-white"
                        style={{
                          backgroundColor:
                            previewPrimary,
                        }}
                      >
                        {previewInitial}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground transition hover:opacity-90">
                      {uploadingLogo
                        ? "Enviando..."
                        : profile.logoUrl
                          ? "Trocar logo"
                          : "Enviar logo"}

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        disabled={uploadingLogo}
                        className="hidden"
                        onChange={(event) =>
                          void uploadImage(
                            "logo",
                            event
                          )
                        }
                      />
                    </label>

                    {profile.logoUrl && (
                      <button
                        type="button"
                        disabled={uploadingLogo}
                        onClick={() =>
                          void removeImage(
                            "logo"
                          )
                        }
                        className="h-10 rounded-xl border border-red-200 px-4 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    JPG, PNG ou WebP. Até 5 MB.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <FieldLabel>
                    Imagem de capa
                  </FieldLabel>

                  <div className="mt-2 flex h-44 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30">
                    {profile.coverImageUrl ? (
                      <img
                        src={imageUrl(
                          profile.coverImageUrl
                        )}
                        alt="Capa da loja"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center px-6 text-center text-xs font-semibold text-muted-foreground"
                        style={{
                          background: `linear-gradient(135deg, ${previewPrimary}22, ${previewSecondary}55)`,
                        }}
                      >
                        Nenhuma capa enviada
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground transition hover:opacity-90">
                      {uploadingCover
                        ? "Enviando..."
                        : profile.coverImageUrl
                          ? "Trocar capa"
                          : "Enviar capa"}

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        disabled={uploadingCover}
                        className="hidden"
                        onChange={(event) =>
                          void uploadImage(
                            "cover",
                            event
                          )
                        }
                      />
                    </label>

                    {profile.coverImageUrl && (
                      <button
                        type="button"
                        disabled={uploadingCover}
                        onClick={() =>
                          void removeImage(
                            "cover"
                          )
                        }
                        className="h-10 rounded-xl border border-red-200 px-4 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Prefira uma imagem horizontal.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <FieldLabel>
                    Cor principal
                  </FieldLabel>

                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          primaryColor:
                            event.target.value,
                        }))
                      }
                      className="h-11 w-14 cursor-pointer rounded-xl border border-input bg-background p-1"
                    />

                    <input
                      value={form.primaryColor}
                      maxLength={7}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          primaryColor:
                            event.target.value,
                        }))
                      }
                      className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-background px-3.5 font-mono text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
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
                      value={form.secondaryColor}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          secondaryColor:
                            event.target.value,
                        }))
                      }
                      className="h-11 w-14 cursor-pointer rounded-xl border border-input bg-background p-1"
                    />

                    <input
                      value={
                        form.secondaryColor
                      }
                      maxLength={7}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          secondaryColor:
                            event.target.value,
                        }))
                      }
                      className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-background px-3.5 font-mono text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Destaque
              </p>

              <h2 className="mt-1 font-display text-2xl uppercase tracking-tight text-foreground">
                Hero
              </h2>

              <div className="mt-6 grid gap-5 md:grid-cols-3">
                <div>
                  <FieldLabel>
                    Título — linha 1
                  </FieldLabel>
                  <input
                    value={form.heroTitleLine1}
                    maxLength={180}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        heroTitleLine1:
                          event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Título — linha 2
                  </FieldLabel>
                  <input
                    value={form.heroTitleLine2}
                    maxLength={180}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        heroTitleLine2:
                          event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Título — linha 3
                  </FieldLabel>
                  <input
                    value={form.heroTitleLine3}
                    maxLength={180}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        heroTitleLine3:
                          event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div className="md:col-span-3">
                  <FieldLabel>
                    Descrição
                  </FieldLabel>
                  <textarea
                    value={form.heroDescription}
                    maxLength={500}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        heroDescription:
                          event.target.value,
                      }))
                    }
                    className="min-h-24 w-full resize-y rounded-xl border border-input bg-background px-3.5 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div>
                  <FieldLabel>Badge</FieldLabel>
                  <input
                    value={form.heroBadgeText}
                    maxLength={120}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        heroBadgeText:
                          event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Texto quando aberto
                  </FieldLabel>
                  <input
                    value={
                      form.heroOpenStatusText
                    }
                    maxLength={80}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        heroOpenStatusText:
                          event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Texto quando fechado
                  </FieldLabel>
                  <input
                    value={
                      form.heroClosedStatusText
                    }
                    maxLength={80}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        heroClosedStatusText:
                          event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Botão principal
                  </FieldLabel>
                  <input
                    value={
                      form.heroPrimaryButtonText
                    }
                    maxLength={80}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        heroPrimaryButtonText:
                          event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Botão secundário
                  </FieldLabel>
                  <input
                    value={
                      form.heroSecondaryButtonText
                    }
                    maxLength={80}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        heroSecondaryButtonText:
                          event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div className="md:col-span-3">
                  <FieldLabel>
                    Frase complementar
                  </FieldLabel>
                  <input
                    value={form.headline}
                    maxLength={180}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        headline:
                          event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    placeholder="Pizza feita do nosso jeito, do forno até você."
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Menu
              </p>

              <h2 className="mt-1 font-display text-2xl uppercase tracking-tight text-foreground">
                Textos do cardápio
              </h2>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <FieldLabel>
                    Título
                  </FieldLabel>
                  <input
                    value={form.menuTitle}
                    maxLength={180}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        menuTitle:
                          event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Subtítulo
                  </FieldLabel>
                  <input
                    value={form.menuSubtitle}
                    maxLength={250}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        menuSubtitle:
                          event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div className="md:col-span-2">
                  <FieldLabel>
                    Texto da busca
                  </FieldLabel>
                  <input
                    value={
                      form.menuSearchPlaceholder
                    }
                    maxLength={180}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        menuSearchPlaceholder:
                          event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Sem resultados — título
                  </FieldLabel>
                  <input
                    value={
                      form.menuEmptyTitle
                    }
                    maxLength={180}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        menuEmptyTitle:
                          event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Sem resultados — descrição
                  </FieldLabel>
                  <input
                    value={
                      form.menuEmptyDescription
                    }
                    maxLength={300}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        menuEmptyDescription:
                          event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Comunicação
              </p>

              <h2 className="mt-1 font-display text-2xl uppercase tracking-tight text-foreground">
                Faixa promocional
              </h2>

              <div className="mt-6 space-y-5">
                <Toggle
                  checked={
                    form.marqueeEnabled
                  }
                  onChange={() =>
                    setForm((current) => ({
                      ...current,
                      marqueeEnabled:
                        !current.marqueeEnabled,
                    }))
                  }
                  label={
                    form.marqueeEnabled
                      ? "Faixa ativada"
                      : "Faixa desativada"
                  }
                  description="Exibir uma mensagem promocional no cardápio."
                />

                <div>
                  <FieldLabel>
                    Mensagem
                  </FieldLabel>

                  <input
                    value={
                      form.marqueeMessage
                    }
                    disabled={
                      !form.marqueeEnabled
                    }
                    maxLength={250}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        marqueeMessage:
                          event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Entrega grátis acima de R$ 80"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Rodapé
              </p>

              <h2 className="mt-1 font-display text-2xl uppercase tracking-tight text-foreground">
                Texto final
              </h2>

              <div className="mt-6">
                <FieldLabel>
                  Frase do rodapé
                </FieldLabel>

                <input
                  value={form.footerTagline}
                  maxLength={250}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      footerTagline:
                        event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </section>

            <div className="flex justify-end pb-8">
              <button
                type="submit"
                disabled={
                  saving ||
                  uploadingLogo ||
                  uploadingCover
                }
                className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-7 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
              >
                {saving
                  ? "Salvando..."
                  : "Salvar personalização"}
              </button>
            </div>
          </div>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <div className="overflow-hidden rounded-[26px] border border-border bg-background shadow-[0_18px_50px_rgba(0,0,0,0.08)]">
              <div className="border-b border-border bg-card px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Prévia fiel
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  Mesmo visual do cardápio público
                </p>
              </div>

              <div
                className="text-foreground"
                style={{
                  "--primary": previewPrimary,
                  "--secondary": previewSecondary,
                } as React.CSSProperties}
              >
                <div className="border-b border-border bg-background">
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      {profile.logoUrl ? (
                        <span className="flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-1">
                          <img
                            src={imageUrl(profile.logoUrl)}
                            alt=""
                            className="h-full w-full object-contain"
                          />
                        </span>
                      ) : (
                        <span
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg font-black text-white"
                          style={{ backgroundColor: previewPrimary }}
                        >
                          {previewInitial}
                        </span>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-lg font-black leading-none">
                          {form.name || "PizzaSystem"}
                          <span style={{ color: previewPrimary }}>.</span>
                        </p>
                        <p className="mt-1 truncate text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                          {form.footerTagline || "Pedidos online"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-full bg-foreground px-3 py-2 text-[9px] font-bold text-background">
                      Pedido · 0
                    </div>
                  </div>

                  <div className="flex gap-1.5 overflow-hidden border-t border-border px-4 py-2">
                    <span className="rounded-full bg-foreground px-3 py-1.5 text-[9px] font-bold text-background">
                      Todos
                    </span>
                    <span className="rounded-full border border-border px-3 py-1.5 text-[9px] font-semibold">
                      Pizzas
                    </span>
                    <span className="rounded-full border border-border px-3 py-1.5 text-[9px] font-semibold">
                      Bebidas
                    </span>
                  </div>
                </div>

                {form.marqueeEnabled && form.marqueeMessage && (
                  <div
                    className="px-3 py-2 text-center text-[8px] font-black uppercase tracking-[0.1em]"
                    style={{
                      backgroundColor: previewSecondary,
                      color: "#111",
                    }}
                  >
                    {form.marqueeMessage}
                  </div>
                )}

                <div className="px-4 py-5">
                  <div className="grid grid-cols-2 items-center gap-3">
                    <div>
                      <div
                        className="inline-flex rounded-full px-2 py-1 text-[8px] font-bold uppercase"
                        style={{
                          backgroundColor: `${previewPrimary}18`,
                          color: previewPrimary,
                        }}
                      >
                        ● {form.heroOpenStatusText || "ABERTO"}
                      </div>

                      <p className="mt-3 text-[27px] font-black uppercase leading-[0.83] tracking-tight">
                        {form.heroTitleLine1 || "ESCOLHA."}
                        <br />
                        {form.heroTitleLine2 || "PEÇA."}
                        <br />
                        <span style={{ color: previewPrimary }}>
                          {form.heroTitleLine3 || "APROVEITE."}
                        </span>
                      </p>

                      <p className="mt-3 line-clamp-3 text-[9px] leading-4 text-muted-foreground">
                        {form.heroDescription}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span
                          className="rounded-full px-3 py-2 text-[8px] font-black text-white"
                          style={{ backgroundColor: previewPrimary }}
                        >
                          {form.heroPrimaryButtonText || "Ver cardápio"} →
                        </span>
                        <span className="rounded-full border border-foreground px-3 py-2 text-[8px] font-bold">
                          {form.heroSecondaryButtonText || "Ver meu pedido"}
                        </span>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-muted">
                        {profile.coverImageUrl ? (
                          <img
                            src={imageUrl(profile.coverImageUrl)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <img
                            src="/pizzasystem/hero.jpg"
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>

                      <span
                        className="absolute -left-2 top-2 rounded-full px-2 py-1 text-[7px] font-black"
                        style={{
                          backgroundColor: previewSecondary,
                          color: "#111",
                        }}
                      >
                        {form.heroBadgeText || "CARDÁPIO ONLINE"}
                      </span>

                      <span className="absolute -bottom-2 right-2 rounded-full bg-foreground px-2.5 py-1 text-[8px] font-black text-background">
                        {form.heroOpenStatusText || "ABERTO"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-7 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        {form.menuTitle || "O cardápio"}
                      </p>
                      <p className="mt-0.5 text-xl font-black">
                        {form.menuSubtitle || "Escolha o seu"}
                      </p>
                    </div>
                    <div className="w-36 rounded-full border border-border bg-white px-3 py-2 text-[8px] text-muted-foreground">
                      🔍 {form.menuSearchPlaceholder || "Buscar no cardápio"}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {["Pizza da casa", "Pizza especial"].map((name, index) => (
                      <div
                        key={name}
                        className="overflow-hidden rounded-2xl border border-border bg-card"
                      >
                        <div
                          className="aspect-[4/3]"
                          style={{
                            background: `linear-gradient(135deg, ${previewSecondary}66, ${previewPrimary}22)`,
                          }}
                        />
                        <div className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[10px] font-black">{name}</p>
                            <p
                              className="text-[10px] font-black"
                              style={{ color: previewPrimary }}
                            >
                              R$ {index === 0 ? "45" : "52"}
                            </p>
                          </div>
                          <p className="mt-1 text-[7px] leading-3 text-muted-foreground">
                            Descrição do produto no cardápio.
                          </p>
                          <div className="mt-2 rounded-full bg-foreground py-1.5 text-center text-[7px] font-bold text-background">
                            Ver opções
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 border-t border-border pt-4">
                    <p className="text-lg font-black">
                      {form.name || "PizzaSystem"}
                      <span style={{ color: previewPrimary }}>.</span>
                    </p>
                    <p className="mt-1 text-[8px] uppercase tracking-[0.15em] text-muted-foreground">
                      {form.footerTagline || "Pedidos online"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}

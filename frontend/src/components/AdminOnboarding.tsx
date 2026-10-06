"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import GuideFeatureIcon from "@/components/GuideFeatureIcon";
import { adminFetch } from "@/lib/adminFetch";
import {
  STORE_COUNTRIES,
} from "@/i18n/countries";
import {
  useLanguage,
} from "@/i18n/LanguageProvider";

type AdminOnboardingProps = {
  open: boolean;
  onClose: () => void;
};

type StoreSettings = {
  id: number;
  storeName: string;
  open: boolean;
  whatsapp: string | null;
  dailyOrderLimit: number;
  countryCode: string;
  defaultLocale: string;
  currencyCode: string;
};

type Step = {
  eyebrow: {
    pt: string;
    en: string;
  };
  title: {
    pt: string;
    en: string;
  };
  description: {
    pt: string;
    en: string;
  };
  tips: Array<{
    pt: string;
    en: string;
  }>;
  href: string;
  action: {
    pt: string;
    en: string;
  };
  icon:
    | "dashboard"
    | "menu"
    | "store"
    | "kitchen"
    | "delivery"
    | "payment"
    | "reports"
    | "palette";
};

const steps: Step[] = [
  {
    eyebrow: {
      pt: "Comece por aqui",
      en: "Start here",
    },
    title: {
      pt: "Seu painel central",
      en: "Your central dashboard",
    },
    description: {
      pt: "O painel reúne os atalhos e os números principais da operação.",
      en: "The dashboard brings together your main shortcuts and operating numbers.",
    },
    tips: [
      {
        pt: "Veja pedidos e atividade do dia.",
        en: "See today's orders and activity.",
      },
      {
        pt: "Use os atalhos para chegar rápido em cada área.",
        en: "Use shortcuts to reach each area quickly.",
      },
      {
        pt: "O menu lateral concentra toda a administração.",
        en: "The side menu contains the full administration area.",
      },
    ],
    href: "/admin",
    action: {
      pt: "Abrir painel",
      en: "Open dashboard",
    },
    icon: "dashboard",
  },
  {
    eyebrow: {
      pt: "Monte sua operação",
      en: "Build your operation",
    },
    title: {
      pt: "Cardápio, categorias e adicionais",
      en: "Menu, categories and add-ons",
    },
    description: {
      pt: "Cadastre produtos, organize categorias, configure adicionais e bordas e deixe o cardápio pronto para venda.",
      en: "Add products, organize categories, configure add-ons and crusts, and get your menu ready to sell.",
    },
    tips: [
      {
        pt: "Crie as categorias antes de cadastrar muitos produtos.",
        en: "Create categories before adding many products.",
      },
      {
        pt: "Fotos e descrições ajudam o cliente a escolher.",
        en: "Photos and descriptions help customers choose.",
      },
      {
        pt: "Adicionais e bordas podem complementar o valor do pedido.",
        en: "Add-ons and crusts can increase order value.",
      },
    ],
    href: "/admin/cardapio",
    action: {
      pt: "Gerenciar cardápio",
      en: "Manage menu",
    },
    icon: "menu",
  },
  {
    eyebrow: {
      pt: "Venda online",
      en: "Sell online",
    },
    title: {
      pt: "Abra sua loja pública",
      en: "Open your public store",
    },
    description: {
      pt: "Escolha o endereço público da loja e compartilhe o cardápio com seus clientes.",
      en: "Choose your store's public address and share the menu with customers.",
    },
    tips: [
      {
        pt: "Você pode usar o endereço hospedado pela Orbitta.",
        en: "You can use the address hosted by Orbitta.",
      },
      {
        pt: "O botão Abrir loja mostra exatamente o que o cliente verá.",
        en: "The Open store button shows exactly what customers will see.",
      },
      {
        pt: "Seu endereço pode ficar no formato sua-loja.orbitta.space.",
        en: "Your address can use the your-store.orbitta.space format.",
      },
    ],
    href: "/admin/loja",
    action: {
      pt: "Configurar loja",
      en: "Configure store",
    },
    icon: "store",
  },
  {
    eyebrow: {
      pt: "Operação",
      en: "Operations",
    },
    title: {
      pt: "Pedidos e cozinha",
      en: "Orders and kitchen",
    },
    description: {
      pt: "Os pedidos entram no painel e seguem o fluxo de preparo até ficarem prontos.",
      en: "Orders enter the dashboard and move through preparation until they are ready.",
    },
    tips: [
      {
        pt: "Pedidos mostra detalhes, pagamento e endereço.",
        en: "Orders shows details, payment and delivery address.",
      },
      {
        pt: "Cozinha organiza o fluxo por status.",
        en: "Kitchen organizes the workflow by status.",
      },
      {
        pt: "Você pode imprimir o pedido ou baixar o comprovante em PDF.",
        en: "You can print the order or download a PDF receipt.",
      },
    ],
    href: "/admin/pedidos",
    action: {
      pt: "Ver pedidos",
      en: "View orders",
    },
    icon: "kitchen",
  },
  {
    eyebrow: {
      pt: "Entrega",
      en: "Delivery",
    },
    title: {
      pt: "Configure a taxa de entrega",
      en: "Configure delivery pricing",
    },
    description: {
      pt: "Defina o endereço da pizzaria, preços por distância e até onde sua loja entrega.",
      en: "Set the restaurant address, distance pricing and how far your store delivers.",
    },
    tips: [
      {
        pt: "O Mapbox calcula a distância real da rota.",
        en: "Mapbox calculates the real route distance.",
      },
      {
        pt: "Você pode usar taxa por km, faixas ou taxa fixa.",
        en: "You can use per-km pricing, distance tiers or fixed fees.",
      },
      {
        pt: "O endereço segue as regras do país escolhido.",
        en: "Address rules follow the selected country.",
      },
    ],
    href: "/admin/entregas",
    action: {
      pt: "Configurar entrega",
      en: "Configure delivery",
    },
    icon: "delivery",
  },
  {
    eyebrow: {
      pt: "Pagamentos",
      en: "Payments",
    },
    title: {
      pt: "Conecte os pagamentos",
      en: "Connect payments",
    },
    description: {
      pt: "Conecte os provedores disponíveis para o país da sua loja.",
      en: "Connect the payment providers available for your store's country.",
    },
    tips: [
      {
        pt: "Brasil pode usar Mercado Pago.",
        en: "Brazil can use Mercado Pago.",
      },
      {
        pt: "Lojas internacionais podem usar Stripe e PayPal.",
        en: "International stores can use Stripe and PayPal.",
      },
      {
        pt: "A moeda acompanha a configuração da loja.",
        en: "Currency follows the store configuration.",
      },
    ],
    href: "/admin/pagamentos",
    action: {
      pt: "Configurar pagamentos",
      en: "Configure payments",
    },
    icon: "payment",
  },
  {
    eyebrow: {
      pt: "Financeiro",
      en: "Finance",
    },
    title: {
      pt: "Caixa e relatórios",
      en: "Cash register and reports",
    },
    description: {
      pt: "Consulte o movimento do dia, feche o caixa e acompanhe os números da operação.",
      en: "Review today's activity, close the register and follow your operating numbers.",
    },
    tips: [
      {
        pt: "O caixa mostra faturamento, ticket médio e formas de pagamento.",
        en: "The register shows revenue, average ticket and payment methods.",
      },
      {
        pt: "Os valores usam a moeda configurada para a loja.",
        en: "Values use the currency configured for the store.",
      },
      {
        pt: "Você pode baixar relatórios em PDF.",
        en: "You can download reports as PDF files.",
      },
    ],
    href: "/admin/caixa",
    action: {
      pt: "Abrir caixa",
      en: "Open cash register",
    },
    icon: "reports",
  },
  {
    eyebrow: {
      pt: "Sua marca",
      en: "Your brand",
    },
    title: {
      pt: "Personalize a experiência",
      en: "Customize the experience",
    },
    description: {
      pt: "Ajuste nome, imagens, aparência, horários e outros detalhes da loja.",
      en: "Adjust the store name, images, appearance, opening hours and other details.",
    },
    tips: [
      {
        pt: "Envie logo e imagem de capa.",
        en: "Upload a logo and cover image.",
      },
      {
        pt: "Configure os horários reais de funcionamento.",
        en: "Configure your actual opening hours.",
      },
      {
        pt: "Revise o cardápio público antes de divulgar o link.",
        en: "Review the public menu before sharing the link.",
      },
    ],
    href: "/admin/personalizacao",
    action: {
      pt: "Personalizar",
      en: "Customize",
    },
    icon: "palette",
  },
];

export default function AdminOnboarding({
  open,
  onClose,
}: AdminOnboardingProps) {
  const {
    locale,
    text,
    setCountry,
  } =
    useLanguage();

  const isEnglish =
    locale.startsWith(
      "en"
    );

  const [
    index,
    setIndex,
  ] =
    useState(0);

  const [
    finishing,
    setFinishing,
  ] =
    useState(false);

  const [
    store,
    setStore,
  ] =
    useState<StoreSettings | null>(
      null
    );

  const [
    countrySaving,
    setCountrySaving,
  ] =
    useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let mounted = true;

    async function loadStore() {
      try {
        const response =
          await adminFetch(
            "/api/store",
            {
              cache:
                "no-store",
            }
          );

        if (!response.ok) {
          return;
        }

        const data:
          StoreSettings =
          await response.json();

        if (!mounted) {
          return;
        }

        setStore(
          data
        );

        if (
          data.countryCode
        ) {
          setCountry(
            data.countryCode
          );
        }
      } catch {
      }
    }

    void loadStore();

    return () => {
      mounted = false;
    };
  }, [
    open,
    setCountry,
  ]);

  const step =
    useMemo(
      () =>
        steps[index],
      [
        index,
      ]
    );

  if (!open) {
    return null;
  }

  const last =
    index ===
    steps.length - 1;

  async function changeCountry(
    nextCountry:
      string
  ) {
    const preset =
      STORE_COUNTRIES.find(
        (item) =>
          item.code ===
          nextCountry
      );

    if (!preset) {
      return;
    }

    setCountry(
      preset.code
    );

    if (!store) {
      return;
    }

    try {
      setCountrySaving(
        true
      );

      const response =
        await adminFetch(
          "/api/store",
          {
            method:
              "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                id:
                  store.id,
                storeName:
                  store.storeName,
                open:
                  store.open,
                whatsapp:
                  store.whatsapp,
                dailyOrderLimit:
                  store.dailyOrderLimit,
                countryCode:
                  preset.code,
                defaultLocale:
                  preset.locale,
                currencyCode:
                  preset.currency,
              }),
          }
        );

      if (response.ok) {
        setStore(
          await response.json()
        );
      }
    } finally {
      setCountrySaving(
        false
      );
    }
  }

  async function finish() {
    if (finishing) {
      return;
    }

    try {
      setFinishing(
        true
      );

      await adminFetch(
        "/api/auth/onboarding/complete",
        {
          method:
            "POST",
        }
      );

      onClose();
    } catch {
      onClose();
    } finally {
      setFinishing(
        false
      );
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-md sm:p-6">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[30px] border border-border bg-background shadow-2xl">
        <div className="border-b border-border px-5 py-4 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <span
                  className="text-lg"
                  aria-hidden="true"
                >
                  ✦
                </span>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  {text(
                    "Bem-vindo ao PizzaSystem",
                    "Welcome to PizzaSystem"
                  )}
                </p>

                <p className="text-sm font-semibold text-foreground">
                  {text(
                    "Configure seu país antes de começar",
                    "Choose your country before you start"
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={
                  store?.countryCode ??
                  "BR"
                }
                disabled={
                  countrySaving
                }
                onChange={(
                  event
                ) =>
                  void changeCountry(
                    event.target.value
                  )
                }
                className="h-10 rounded-xl border border-input bg-background px-3 text-sm font-bold text-foreground outline-none"
                aria-label={
                  text(
                    "País da operação",
                    "Operating country"
                  )
                }
              >
                {STORE_COUNTRIES.map(
                  (country) => (
                    <option
                      key={
                        country.code
                      }
                      value={
                        country.code
                      }
                    >
                      {isEnglish
                        ? country.en
                        : country.pt}
                    </option>
                  )
                )}
              </select>

              <button
                type="button"
                onClick={
                  finish
                }
                aria-label={
                  text(
                    "Pular introdução",
                    "Skip introduction"
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <span
                  className="text-xl leading-none"
                  aria-hidden="true"
                >
                  ×
                </span>
              </button>
            </div>
          </div>

          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {text(
              "O país define automaticamente idioma, moeda e regras de endereço. Você pode alterar isso depois em Internacionalização.",
              "Country automatically sets language, currency and address rules. You can change it later under Internationalization."
            )}
          </p>
        </div>

        <div className="overflow-y-auto">
          <div className="grid lg:grid-cols-[240px_1fr]">
            <aside className="border-b border-border bg-muted/25 p-4 lg:border-b-0 lg:border-r lg:p-5">
              <div className="grid grid-cols-4 gap-2 lg:grid-cols-1">
                {steps.map(
                  (
                    item,
                    stepIndex
                  ) => {
                    const active =
                      stepIndex ===
                      index;

                    return (
                      <button
                        key={
                          item.href
                        }
                        type="button"
                        onClick={() =>
                          setIndex(
                            stepIndex
                          )
                        }
                        className={[
                          "flex min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-left transition",
                          active
                            ? "border-primary/20 bg-primary/10 text-primary"
                            : "border-transparent text-muted-foreground hover:bg-background hover:text-foreground",
                        ].join(
                          " "
                        )}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background/80">
                          <GuideFeatureIcon
                            kind={
                              item.icon
                            }
                            className="h-4 w-4"
                          />
                        </div>

                        <span className="hidden min-w-0 lg:block">
                          <span className="block text-[10px] font-bold uppercase tracking-[0.12em] opacity-60">
                            {text(
                              "Passo",
                              "Step"
                            )}{" "}
                            {stepIndex +
                              1}
                          </span>

                          <span className="mt-0.5 block truncate text-xs font-bold">
                            {isEnglish
                              ? item.title.en
                              : item.title.pt}
                          </span>
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </aside>

            <section className="p-6 sm:p-8 lg:p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <GuideFeatureIcon
                  kind={
                    step.icon
                  }
                  className="h-7 w-7"
                />
              </div>

              <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                {isEnglish
                  ? step.eyebrow.en
                  : step.eyebrow.pt}
              </p>

              <h2 className="mt-2 max-w-2xl font-display text-4xl uppercase leading-none tracking-tight text-foreground sm:text-5xl">
                {isEnglish
                  ? step.title.en
                  : step.title.pt}
              </h2>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                {isEnglish
                  ? step.description.en
                  : step.description.pt}
              </p>

              <div className="mt-7 grid gap-3">
                {step.tips.map(
                  (
                    tip,
                    tipIndex
                  ) => (
                    <div
                      key={
                        tipIndex
                      }
                      className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
                    >
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <span className="text-xs font-bold">
                          ✓
                        </span>
                      </div>

                      <p className="text-sm leading-6 text-foreground/80">
                        {isEnglish
                          ? tip.en
                          : tip.pt}
                      </p>
                    </div>
                  )
                )}
              </div>

              <Link
                href={
                  step.href
                }
                onClick={
                  finish
                }
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-bold text-foreground transition hover:bg-muted"
              >
                {isEnglish
                  ? step.action.en
                  : step.action.pt}
                <span
                  aria-hidden="true"
                >
                  ↗
                </span>
              </Link>
            </section>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border bg-card/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="text-xs text-muted-foreground">
            {index + 1}{" "}
            {text(
              "de",
              "of"
            )}{" "}
            {steps.length}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={
                finish
              }
              disabled={
                finishing
              }
              className="h-10 rounded-xl px-4 text-sm font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              {text(
                "Pular",
                "Skip"
              )}
            </button>

            {index > 0 && (
              <button
                type="button"
                onClick={() =>
                  setIndex(
                    (
                      current
                    ) =>
                      current -
                      1
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-bold text-foreground transition hover:bg-muted"
              >
                <span
                  aria-hidden="true"
                >
                  ←
                </span>
                {text(
                  "Voltar",
                  "Back"
                )}
              </button>
            )}

            {last ? (
              <button
                type="button"
                onClick={
                  finish
                }
                disabled={
                  finishing
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                <span
                  aria-hidden="true"
                >
                  ✓
                </span>
                {finishing
                  ? text(
                      "Salvando...",
                      "Saving..."
                    )
                  : text(
                      "Concluir",
                      "Finish"
                    )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setIndex(
                    (
                      current
                    ) =>
                      current +
                      1
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
              >
                {text(
                  "Próximo",
                  "Next"
                )}
                <span
                  aria-hidden="true"
                >
                  →
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

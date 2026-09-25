"use client";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  useEffect,
  useState,
} from "react";

import {
  adminFetch,
  clearAdminCsrfToken,
} from "@/lib/adminFetch";

type IconProps = {
  className?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080";

/* =========================
   ÍCONES
========================= */

function DashboardIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function OrdersIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
    </svg>
  );
}

function KitchenIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 11h14" />
      <path d="M7 11a5 5 0 0 1 10 0" />
      <path d="M4 15h16" />
      <path d="M8 19h8" />
    </svg>
  );
}

function DeliveryIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 6h11v11H3Z" />
      <path d="M14 10h4l3 3v4h-7Z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}

function HistoryIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v6h6" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function ChartIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </svg>
  );
}

function CashIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M7 9H6v1" />
      <path d="M17 15h1v-1" />
    </svg>
  );
}

function CouponIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 7a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-3a2 2 0 0 0 0-4V7Z" />
      <path d="M9 9h.01" />
      <path d="M15 15h.01" />
      <path d="m9 15 6-6" />
    </svg>
  );
}

function LoyaltyIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3l2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.5-4.6 2.5.9-5.2-3.8-3.7 5.2-.8L12 3Z" />
      <path d="M8.5 19.5 12 18l3.5 1.5" />
    </svg>
  );
}

function MenuIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h10" />
    </svg>
  );
}

function CategoryIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="4" width="7" height="7" rx="1.5" />
      <rect x="14" y="4" width="7" height="7" rx="1.5" />
      <rect x="3" y="15" width="7" height="5" rx="1.5" />
      <rect x="14" y="15" width="7" height="5" rx="1.5" />
    </svg>
  );
}

function AddonIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}

function CrustIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function ClockIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function PersonalizationIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 0-4H12a1.5 1.5 0 0 1 0-3h2a7 7 0 0 0 7-7 4 4 0 0 0-4-4h-5Z" />
      <circle cx="7.5" cy="10" r=".8" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="6.5" r=".8" fill="currentColor" stroke="none" />
      <circle cx="14" cy="6" r=".8" fill="currentColor" stroke="none" />
      <circle cx="17" cy="9" r=".8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function GuideIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22V5.5Z" />
    </svg>
  );
}

function SettingsIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.09-1.1l2-1.55-2-3.46-2.47 1a7 7 0 0 0-1.9-1.1L14.2 3h-4.4l-.34 2.79a7 7 0 0 0-1.9 1.1l-2.47-1-2 3.46 2 1.55A7 7 0 0 0 5 12c0 .37.03.74.09 1.1l-2 1.55 2 3.46 2.47-1a7 7 0 0 0 1.9 1.1L9.8 21h4.4l.34-2.79a7 7 0 0 0 1.9-1.1l2.47 1 2-3.46-2-1.55A7 7 0 0 0 19 12Z" />
    </svg>
  );
}

function ExternalIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 5h5v5" />
      <path d="m19 5-8 8" />
      <path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

function MobileMenuIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function CloseIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function LogoutIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 5H5v14h5" />
      <path d="M14 8l4 4-4 4" />
      <path d="M18 12H9" />
    </svg>
  );
}

/* =========================
   NAVEGAÇÃO
========================= */

const sections = [
  {
    title: "Operação",
    items: [
      {
        label: "Painel",
        href: "/admin",
        icon: DashboardIcon,
      },
      {
        label: "Pedidos",
        href: "/admin/pedidos",
        icon: OrdersIcon,
      },
      {
        label: "Cozinha",
        href: "/admin/cozinha",
        icon: KitchenIcon,
      },
      {
        label: "Entregas",
        href: "/admin/entregas",
        icon: DeliveryIcon,
      },
    ],
  },
  {
    title: "Gestão",
    items: [
      {
        label: "Histórico",
        href: "/admin/historico",
        icon: HistoryIcon,
      },
      {
        label: "Relatórios",
        href: "/admin/relatorios",
        icon: ChartIcon,
      },
      {
        label: "Caixa",
        href: "/admin/caixa",
        icon: CashIcon,
      },
      {
        label: "Cupons",
        href: "/admin/cupons",
        icon: CouponIcon,
      },
      {
        label: "Fidelidade",
        href: "/admin/fidelidade",
        icon: LoyaltyIcon,
      },
    ],
  },
  {
    title: "Cardápio",
    items: [
      {
        label: "Produtos",
        href: "/admin/cardapio",
        icon: MenuIcon,
      },
      {
        label: "Categorias",
        href: "/admin/categorias",
        icon: CategoryIcon,
      },
      {
        label: "Adicionais",
        href: "/admin/adicionais",
        icon: AddonIcon,
      },
      {
        label: "Bordas",
        href: "/admin/bordas",
        icon: CrustIcon,
      },
    ],
  },
  {
    title: "Sistema",
    items: [
      {
        label: "Horários",
        href: "/admin/horarios",
        icon: ClockIcon,
      },
      {
        label: "Personalização",
        href: "/admin/personalizacao",
        icon: PersonalizationIcon,
      },
      {
        label: "Configurações",
        href: "/admin/configuracoes",
        icon: SettingsIcon,
      },
      {
        label: "Guia",
        href: "/admin/guia",
        icon: GuideIcon,
      },
    ],
  },
];

export default function AdminHeader() {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const [
    loggingOut,
    setLoggingOut,
  ] =
    useState(false);

  const [
    mobileOpen,
    setMobileOpen,
  ] =
    useState(false);

  const [
    storeSlug,
    setStoreSlug,
  ] =
    useState<
      string | null
    >(null);

  useEffect(() => {
    let cancelled =
      false;

    async function loadStoreSlug() {
      try {
        const response =
          await adminFetch(
            `${API_URL}/api/store/profile`,
            {
              cache:
                "no-store",
            }
          );

        if (!response.ok) {
          return;
        }

        const data:
          {
            slug?: string | null;
          } =
          await response.json();

        const slug =
          data.slug?.trim();

        if (
          !cancelled &&
          slug
        ) {
          setStoreSlug(
            slug
          );
        }

      } catch {
        // O painel continua funcionando mesmo se o perfil não carregar.
      }
    }

    loadStoreSlug();

    return () => {
      cancelled =
        true;
    };
  }, []);

  const publicMenuUrl =
    storeSlug
      ? `/cardapio/${encodeURIComponent(
          storeSlug
        )}`
      : "/";

  function closeMobileMenu() {
    setMobileOpen(
      false
    );
  }

  function isActive(
    href: string
  ) {
    if (
      href ===
      "/admin"
    ) {
      return (
        pathname ===
        "/admin"
      );
    }

    return pathname.startsWith(
      href
    );
  }

  async function handleLogout() {
    if (
      loggingOut
    ) {
      return;
    }

    try {
      setLoggingOut(
        true
      );

      const response =
        await adminFetch(
          `${API_URL}/api/auth/logout`,
          {
            method:
              "POST",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Falha ao encerrar sessão."
        );
      }

      clearAdminCsrfToken();

      router.replace(
        "/admin/login"
      );

      router.refresh();

    } catch (error) {
      console.error(
        "Erro ao sair:",
        error
      );

    } finally {
      setLoggingOut(
        false
      );
    }
  }

  return (
    <>

      {/* DESKTOP */}

      <aside
        className="
          group/sidebar
          fixed inset-y-0 left-0 z-50
          hidden w-20 flex-col
          overflow-hidden
          border-r border-border
          bg-background/98
          shadow-[8px_0_32px_rgba(0,0,0,0.04)]
          transition-[width] duration-300 ease-out
          lg:flex
          lg:hover:w-72
        "
      >

        <div className="flex h-20 shrink-0 items-center">

          <Link
            href="/admin"
            className="
              flex h-full w-full items-center
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-ring
            "
          >

            <div className="flex w-20 shrink-0 items-center justify-center">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_3px_0_0] shadow-primary/20">
                <span className="font-display text-xl leading-none">
                  P
                </span>
              </div>

            </div>

            <div
              className="
                min-w-0
                translate-x-2 opacity-0
                transition-all duration-200
                group-hover/sidebar:translate-x-0
                group-hover/sidebar:opacity-100
              "
            >

              <p className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                PizzaSystem
              </p>

              <p className="mt-0.5 whitespace-nowrap text-sm font-semibold text-foreground">
                Administração
              </p>

            </div>

          </Link>

        </div>

        <nav
          aria-label="Navegação administrativa"
          className="
            flex-1 overflow-y-auto
            overflow-x-hidden
            border-t border-border
            py-4
          "
        >

          <div className="space-y-5">

            {sections.map(
              (
                section
              ) => (

                <div
                  key={
                    section.title
                  }
                >

                  <div
                    className="
                      mb-2 ml-20 h-4
                      whitespace-nowrap
                      text-[10px] font-bold
                      uppercase tracking-[0.18em]
                      text-muted-foreground
                      opacity-0
                      transition-opacity
                      duration-200
                      group-hover/sidebar:opacity-100
                    "
                  >
                    {section.title}
                  </div>

                  <div className="space-y-1 px-3">

                    {section.items.map(
                      (
                        item
                      ) => {

                        const active =
                          isActive(
                            item.href
                          );

                        const Icon =
                          item.icon;

                        return (

                          <Link
                            key={
                              item.href
                            }
                            href={
                              item.href
                            }
                            title={
                              item.label
                            }
                            aria-current={
                              active
                                ? "page"
                                : undefined
                            }
                            className={[
                              "relative flex h-11 w-14 items-center overflow-hidden rounded-xl transition-all duration-300 group-hover/sidebar:w-full",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              active
                                ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/15"
                                : "text-muted-foreground hover:bg-card hover:text-foreground",
                            ].join(
                              " "
                            )}
                          >

                            <div className="flex w-14 shrink-0 items-center justify-center">
                              <Icon className="h-5 w-5 shrink-0" />
                            </div>

                            <span
                              className="
                                whitespace-nowrap
                                pr-4 text-sm font-semibold
                                opacity-0
                                transition-opacity duration-150
                                group-hover/sidebar:opacity-100
                              "
                            >
                              {item.label}
                            </span>

                            {active && (
                              <span
                                className="
                                  absolute left-0
                                  h-5 w-[3px]
                                  rounded-r-full
                                  bg-primary
                                "
                                aria-hidden="true"
                              />
                            )}

                          </Link>
                        );
                      }
                    )}

                  </div>

                </div>
              )
            )}

          </div>

        </nav>

        <div className="shrink-0 border-t border-border bg-card/30 py-3">

          <div className="space-y-1 px-3">

            <Link
              href={
                publicMenuUrl
              }
              target="_blank"
              rel="noreferrer"
              title="Ver cardápio"
              className="
                flex h-11 w-14
                items-center overflow-hidden
                rounded-xl
                text-muted-foreground
                transition-all duration-300
                hover:bg-card
                hover:text-foreground
                group-hover/sidebar:w-full
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-ring
              "
            >

              <div className="flex w-14 shrink-0 items-center justify-center">
                <ExternalIcon className="h-5 w-5 shrink-0" />
              </div>

              <span
                className="
                  whitespace-nowrap
                  pr-4 text-sm font-semibold
                  opacity-0
                  transition-opacity duration-150
                  group-hover/sidebar:opacity-100
                "
              >
                Ver cardápio
              </span>

            </Link>

            <button
              type="button"
              onClick={
                handleLogout
              }
              disabled={
                loggingOut
              }
              title="Sair"
              className="
                flex h-11 w-14
                items-center overflow-hidden
                rounded-xl
                text-muted-foreground
                transition-all duration-300
                hover:bg-destructive/10
                hover:text-destructive
                group-hover/sidebar:w-full
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-ring
                disabled:pointer-events-none
                disabled:opacity-50
              "
            >

              <div className="flex w-14 shrink-0 items-center justify-center">

                {loggingOut ? (

                  <div
                    className="
                      h-5 w-5
                      animate-spin
                      rounded-full
                      border-2
                      border-current
                      border-t-transparent
                    "
                    aria-hidden="true"
                  />

                ) : (

                  <LogoutIcon className="h-5 w-5 shrink-0" />

                )}

              </div>

              <span
                className="
                  whitespace-nowrap
                  pr-4 text-sm font-semibold
                  opacity-0
                  transition-opacity duration-150
                  group-hover/sidebar:opacity-100
                "
              >
                {loggingOut
                  ? "Saindo..."
                  : "Sair"}
              </span>

            </button>

          </div>

        </div>

      </aside>

      {/* MOBILE */}

      <header
        className="
          sticky top-0 z-40
          flex h-16 items-center
          justify-between
          border-b border-border
          bg-background/90 px-4
          backdrop-blur-xl
          lg:hidden
        "
      >

        <Link
          href="/admin"
          className="flex items-center gap-3"
          onClick={
            closeMobileMenu
          }
        >

          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_3px_0_0] shadow-primary/20">
            <span className="font-display text-lg">
              P
            </span>
          </div>

          <div>

            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
              PizzaSystem
            </p>

            <p className="text-sm font-semibold text-foreground">
              Administração
            </p>

          </div>

        </Link>

        <button
          type="button"
          onClick={() =>
            setMobileOpen(
              (
                current
              ) =>
                !current
            )
          }
          aria-label={
            mobileOpen
              ? "Fechar menu"
              : "Abrir menu"
          }
          aria-expanded={
            mobileOpen
          }
          className="
            flex h-10 w-10 items-center justify-center
            rounded-xl border border-border bg-card
            text-foreground transition
            hover:bg-muted
            focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-ring
          "
        >

          {mobileOpen ? (
            <CloseIcon className="h-5 w-5" />
          ) : (
            <MobileMenuIcon className="h-5 w-5" />
          )}

        </button>

      </header>

      {mobileOpen && (

        <div className="fixed inset-0 z-50 lg:hidden">

          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
            onClick={
              closeMobileMenu
            }
          />

          <aside
            className="
              absolute inset-y-0 left-0
              flex w-[min(90vw,360px)] flex-col
              border-r border-border bg-background
              shadow-2xl
            "
          >

            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">

              <Link
                href="/admin"
                onClick={
                  closeMobileMenu
                }
                className="flex items-center gap-3"
              >

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_3px_0_0] shadow-primary/20">
                  <span className="font-display text-lg">
                    P
                  </span>
                </div>

                <div>

                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
                    PizzaSystem
                  </p>

                  <p className="text-sm font-semibold text-foreground">
                    Administração
                  </p>

                </div>

              </Link>

              <button
                type="button"
                onClick={
                  closeMobileMenu
                }
                aria-label="Fechar menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <CloseIcon className="h-5 w-5" />
              </button>

            </div>

            <nav
              aria-label="Navegação administrativa móvel"
              className="flex-1 overflow-y-auto px-3 py-4"
            >

              <div className="space-y-5">

                {sections.map(
                  (
                    section
                  ) => (

                    <div
                      key={
                        section.title
                      }
                    >

                      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        {section.title}
                      </p>

                      <div className="space-y-1">

                        {section.items.map(
                          (
                            item
                          ) => {

                            const active =
                              isActive(
                                item.href
                              );

                            const Icon =
                              item.icon;

                            return (

                              <Link
                                key={
                                  item.href
                                }
                                href={
                                  item.href
                                }
                                onClick={
                                  closeMobileMenu
                                }
                                aria-current={
                                  active
                                    ? "page"
                                    : undefined
                                }
                                className={[
                                  "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition",
                                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                  active
                                    ? "bg-primary/10 text-primary ring-1 ring-primary/15"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                ].join(
                                  " "
                                )}
                              >

                                <Icon className="h-5 w-5 shrink-0" />

                                <span>
                                  {item.label}
                                </span>

                              </Link>
                            );
                          }
                        )}

                      </div>

                    </div>
                  )
                )}

              </div>

            </nav>

            <div className="shrink-0 border-t border-border bg-card/30 p-3">

              <Link
                href={
                  publicMenuUrl
                }
                target="_blank"
                rel="noreferrer"
                onClick={
                  closeMobileMenu
                }
                className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >

                <ExternalIcon className="h-5 w-5" />

                Ver cardápio

              </Link>

              <button
                type="button"
                onClick={
                  handleLogout
                }
                disabled={
                  loggingOut
                }
                className="mt-1 flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
              >

                {loggingOut ? (

                  <span
                    className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                  />

                ) : (

                  <LogoutIcon className="h-5 w-5" />

                )}

                <span>
                  {loggingOut
                    ? "Saindo..."
                    : "Sair"}
                </span>

              </button>

            </div>

          </aside>

        </div>
      )}

    </>
  );
}

"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminHeader from "@/components/AdminHeader";
import { adminFetch } from "@/lib/adminFetch";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080";

type IconProps = {
  className?: string;
};

type StoreProfile = {
  name?: string | null;
  slug?: string | null;
};

type StoreStatus = {
  storeName?: string;
  manualOpen?: boolean;
  open?: boolean;
  message?: string;
  ordersToday?: number;
  dailyOrderLimit?: number;
};

type Order = {
  id: number;
  status?: string | null;
  total?: number | string | null;
  totalAmount?: number | string | null;
  finalTotal?: number | string | null;
  paymentStatus?: string | null;
  createdAt?: string | null;
};

type AdminCard = {
  title: string;
  description: string;
  route: string;
  icon: (
    props: IconProps
  ) => React.ReactNode;
  featured?: boolean;
};

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
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2"
      />
      <circle
        cx="12"
        cy="12"
        r="2.5"
      />
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
      <path d="M12 21s-7-4.35-9.33-8.25C.8 9.63 2.1 5.5 5.75 4.4 8 3.72 10.05 4.55 12 6.5c1.95-1.95 4-2.78 6.25-2.1 3.65 1.1 4.95 5.23 3.08 8.35C19 16.65 12 21 12 21Z" />
      <path d="M9 11h6" />
      <path d="M12 8v6" />
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
      <rect
        x="3"
        y="4"
        width="7"
        height="7"
        rx="1.5"
      />
      <rect
        x="14"
        y="4"
        width="7"
        height="7"
        rx="1.5"
      />
      <rect
        x="3"
        y="15"
        width="7"
        height="5"
        rx="1.5"
      />
      <rect
        x="14"
        y="15"
        width="7"
        height="5"
        rx="1.5"
      />
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
      <circle
        cx="12"
        cy="12"
        r="8"
      />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
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
      <circle
        cx="12"
        cy="12"
        r="9"
      />
      <path d="M12 7v5l3 2" />
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
      <circle
        cx="12"
        cy="12"
        r="3"
      />
      <path d="M19 12a7 7 0 0 0-.09-1.1l2-1.55-2-3.46-2.47 1a7 7 0 0 0-1.9-1.1L14.2 3h-4.4l-.34 2.79a7 7 0 0 0-1.9 1.1l-2.47-1-2 3.46 2 1.55A7 7 0 0 0 5 12c0 .37.03.74.09 1.1l-2 1.55 2 3.46 2.47-1a7 7 0 0 0 1.9 1.1L9.8 21h4.4l.34-2.79a7 7 0 0 0 1.9-1.1l2.47 1 2-3.46-2-1.55A7 7 0 0 0 19 12Z" />
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
      <path d="M12 3a9 9 0 1 0 0 18h1.5a2.5 2.5 0 0 0 0-5H12a1.5 1.5 0 0 1 0-3h3a6 6 0 0 0 0-12h-3Z" />
      <circle
        cx="7.5"
        cy="10"
        r=".8"
        fill="currentColor"
        stroke="none"
      />
      <circle
        cx="9.5"
        cy="6.5"
        r=".8"
        fill="currentColor"
        stroke="none"
      />
      <circle
        cx="14"
        cy="6"
        r=".8"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

function ArrowIcon({
  className = "h-4 w-4",
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
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  );
}

const operationCards:
  AdminCard[] = [
    {
      title:
        "Pedidos",
      description:
        "Acompanhe pedidos, pagamentos e clientes.",
      route:
        "/admin/pedidos",
      icon:
        OrdersIcon,
      featured:
        true,
    },
    {
      title:
        "Cozinha",
      description:
        "Gerencie os pedidos em preparo.",
      route:
        "/admin/cozinha",
      icon:
        KitchenIcon,
    },
    {
      title:
        "Entregas",
      description:
        "Organize pedidos prontos e entregas.",
      route:
        "/admin/entregas",
      icon:
        DeliveryIcon,
    },
  ];

const managementCards:
  AdminCard[] = [
    {
      title:
        "Histórico",
      description:
        "Consulte pedidos finalizados e cancelados.",
      route:
        "/admin/historico",
      icon:
        HistoryIcon,
    },
    {
      title:
        "Relatórios",
      description:
        "Veja faturamento e desempenho.",
      route:
        "/admin/relatorios",
      icon:
        ChartIcon,
    },
    {
      title:
        "Caixa",
      description:
        "Acompanhe valores e pagamentos.",
      route:
        "/admin/caixa",
      icon:
        CashIcon,
    },
    {
      title:
        "Cupons",
      description:
        "Gerencie descontos e promoções.",
      route:
        "/admin/cupons",
      icon:
        CouponIcon,
    },
    {
      title:
        "Fidelidade",
      description:
        "Gerencie pontos e recompensas.",
      route:
        "/admin/fidelidade",
      icon:
        LoyaltyIcon,
    },
  ];

const catalogCards:
  AdminCard[] = [
    {
      title:
        "Produtos",
      description:
        "Edite produtos, preços e disponibilidade.",
      route:
        "/admin/cardapio",
      icon:
        MenuIcon,
    },
    {
      title:
        "Categorias",
      description:
        "Organize a estrutura do cardápio.",
      route:
        "/admin/categorias",
      icon:
        CategoryIcon,
    },
    {
      title:
        "Adicionais",
      description:
        "Configure grupos, opções, preços e vínculos com produtos.",
      route:
        "/admin/adicionais",
      icon:
        AddonIcon,
    },
    {
      title:
        "Horários",
      description:
        "Configure quando a loja recebe pedidos.",
      route:
        "/admin/horarios",
      icon:
        ClockIcon,
    },
    {
      title:
        "Personalização",
      description:
        "Altere logo, capa, cores e visual do cardápio.",
      route:
        "/admin/personalizacao",
      icon:
        PersonalizationIcon,
    },
    {
      title:
        "Configurações",
      description:
        "Controle operação e dados da loja.",
      route:
        "/admin/configuracoes",
      icon:
        SettingsIcon,
    },
  ];

function DashboardCard({
  card,
}: {
  card: AdminCard;
}) {
  const Icon =
    card.icon;

  return (
    <Link
      href={
        card.route
      }
      className={[
        "group relative overflow-hidden rounded-2xl border p-5 transition duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        card.featured
          ? "border-primary/20 bg-primary text-primary-foreground shadow-sm hover:-translate-y-0.5 hover:shadow-md"
          : "border-border bg-card text-card-foreground hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-sm",
      ].join(
        " "
      )}
    >
      <div className="flex items-start justify-between gap-4">

        <div
          className={[
            "flex h-10 w-10 items-center justify-center rounded-xl",
            card.featured
              ? "bg-primary-foreground/10"
              : "bg-muted text-foreground",
          ].join(
            " "
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <ArrowIcon
          className={[
            "h-4 w-4 transition-transform duration-200 group-hover:translate-x-1",
            card.featured
              ? "text-primary-foreground/70"
              : "text-muted-foreground",
          ].join(
            " "
          )}
        />

      </div>

      <h3 className="mt-5 text-lg font-bold">
        {card.title}
      </h3>

      <p
        className={[
          "mt-2 text-sm leading-6",
          card.featured
            ? "text-primary-foreground/75"
            : "text-muted-foreground",
        ].join(
          " "
        )}
      >
        {card.description}
      </p>

    </Link>
  );
}

function money(
  value: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style:
        "currency",
      currency:
        "BRL",
    }
  ).format(
    value
  );
}

function orderValue(
  order: Order
) {
  const raw =
    order.finalTotal ??
    order.totalAmount ??
    order.total ??
    0;

  const parsed =
    typeof raw ===
    "number"
      ? raw
      : Number(
          raw
        );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}

export default function AdminPage() {

  const [
    profile,
    setProfile,
  ] =
    useState<
      StoreProfile | null
    >(null);

  const [
    status,
    setStatus,
  ] =
    useState<
      StoreStatus | null
    >(null);

  const [
    orders,
    setOrders,
  ] =
    useState<
      Order[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  async function loadDashboard() {

    try {

      const [
        profileResponse,
        statusResponse,
        ordersResponse,
      ] =
        await Promise.all([
          adminFetch(
            `${API_URL}/api/store/profile`,
            {
              cache:
                "no-store",
            }
          ),

          adminFetch(
            `${API_URL}/api/store/status`,
            {
              cache:
                "no-store",
            }
          ),

          adminFetch(
            `${API_URL}/api/orders`,
            {
              cache:
                "no-store",
            }
          ),
        ]);

      if (
        profileResponse.ok
      ) {
        setProfile(
          await profileResponse.json()
        );
      }

      if (
        statusResponse.ok
      ) {
        setStatus(
          await statusResponse.json()
        );
      }

      if (
        ordersResponse.ok
      ) {

        const data =
          await ordersResponse.json();

        setOrders(
          Array.isArray(
            data
          )
            ? data
            : []
        );
      }

    } catch {
      // O painel continua utilizável mesmo se algum resumo não carregar.

    } finally {

      setLoading(
        false
      );
    }
  }

  useEffect(() => {

    loadDashboard();

    const interval =
      window.setInterval(
        loadDashboard,
        15000
      );

    return () =>
      window.clearInterval(
        interval
      );

  }, []);

  const storeSlug =
    profile?.slug?.trim() ||
    null;

  const publicMenuUrl =
    storeSlug
      ? `/cardapio/${encodeURIComponent(
          storeSlug
        )}`
      : "/";

  const activeOrders =
    useMemo(
      () =>
        orders.filter(
          (
            order
          ) =>
            [
              "RECEIVED",
              "PREPARING",
              "READY",
              "OUT_FOR_DELIVERY",
            ].includes(
              String(
                order.status ??
                  ""
              ).toUpperCase()
            )
        ),
      [
        orders,
      ]
    );

  const preparingOrders =
    useMemo(
      () =>
        orders.filter(
          (
            order
          ) =>
            String(
              order.status ??
                ""
            ).toUpperCase() ===
            "PREPARING"
        ).length,
      [
        orders,
      ]
    );

  const readyOrders =
    useMemo(
      () =>
        orders.filter(
          (
            order
          ) =>
            String(
              order.status ??
                ""
            ).toUpperCase() ===
            "READY"
        ).length,
      [
        orders,
      ]
    );

  const approvedRevenue =
    useMemo(
      () =>
        orders
          .filter(
            (
              order
            ) => {

              const payment =
                String(
                  order.paymentStatus ??
                    ""
                ).toUpperCase();

              const state =
                String(
                  order.status ??
                    ""
                ).toUpperCase();

              return (
                payment ===
                  "APPROVED" ||
                [
                  "PREPARING",
                  "READY",
                  "OUT_FOR_DELIVERY",
                  "DELIVERED",
                ].includes(
                  state
                )
              );
            }
          )
          .reduce(
            (
              sum,
              order
            ) =>
              sum +
              orderValue(
                order
              ),
            0
          ),
      [
        orders,
      ]
    );

  const orderLimit =
    status?.dailyOrderLimit ??
    0;

  const ordersToday =
    status?.ordersToday ??
    0;

  const remaining =
    orderLimit >
    0
      ? Math.max(
          orderLimit -
            ordersToday,
          0
        )
      : null;

  return (

    <main className="min-h-screen bg-background">

      <AdminHeader />

      <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 lg:px-8">

        <section className="border-b border-border pb-7">

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            PizzaSystem
          </p>

          <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <h1 className="font-display text-4xl uppercase leading-none tracking-tight text-foreground sm:text-5xl">
                Painel administrativo
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                {profile?.name
                  ? `Visão geral da operação de ${profile.name}.`
                  : "Visão geral da operação da sua loja."}
              </p>

            </div>

            <div className="flex flex-wrap gap-2">

              <Link
                href="/admin/pedidos"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
              >
                Ver pedidos
              </Link>

              <Link
                href={
                  publicMenuUrl
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-bold text-foreground transition hover:bg-muted"
              >
                Ver cardápio
              </Link>

            </div>

          </div>

        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">

            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Loja agora
            </p>

            <div className="mt-3 flex items-center gap-2">

              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  status?.open
                    ? "bg-emerald-500"
                    : "bg-red-500"
                }`}
              />

              <strong
                className={
                  status?.open
                    ? "text-emerald-700"
                    : "text-red-600"
                }
              >
                {loading
                  ? "Carregando..."
                  : status?.open
                    ? "Recebendo pedidos"
                    : "Pedidos fechados"}
              </strong>

            </div>

            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
              {status?.message ||
                "Status operacional da loja."}
            </p>

          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">

            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Pedidos hoje
            </p>

            <p className="mt-2 text-3xl font-bold text-foreground">
              {loading
                ? "—"
                : ordersToday}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {remaining ===
              null
                ? "Sem limite diário configurado"
                : `${remaining} restantes no limite de hoje`}
            </p>

          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">

            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Em andamento
            </p>

            <p className="mt-2 text-3xl font-bold text-foreground">
              {loading
                ? "—"
                : activeOrders.length}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {preparingOrders} preparando ·{" "}
              {readyOrders} prontos
            </p>

          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">

            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Pedidos carregados
            </p>

            <p className="mt-2 text-3xl font-bold text-foreground">
              {loading
                ? "—"
                : orders.length}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Total disponível no painel
            </p>

          </div>

        </section>

        <section className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Resumo financeiro carregado
              </p>

              <p className="mt-1 text-2xl font-bold text-foreground">
                {loading
                  ? "—"
                  : money(
                      approvedRevenue
                    )}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Soma dos pedidos aprovados disponíveis nesta consulta. Para fechamento oficial, use Caixa e Relatórios.
              </p>

            </div>

            <Link
              href="/admin/caixa"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-border px-4 text-sm font-bold text-foreground transition hover:bg-muted"
            >
              Abrir caixa
            </Link>

          </div>

        </section>

        <section className="mt-8">

          <div className="mb-4">

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Operação
            </p>

            <h2 className="mt-1 text-xl font-bold text-foreground">
              Acesso rápido
            </h2>

          </div>

          <div className="grid gap-4 md:grid-cols-3">

            {operationCards.map(
              (
                card
              ) => (
                <DashboardCard
                  key={
                    card.route
                  }
                  card={
                    card
                  }
                />
              )
            )}

          </div>

        </section>

        <section className="mt-10">

          <div className="mb-4">

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Gestão
            </p>

            <h2 className="mt-1 text-xl font-bold text-foreground">
              Financeiro e acompanhamento
            </h2>

          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

            {managementCards.map(
              (
                card
              ) => (
                <DashboardCard
                  key={
                    card.route
                  }
                  card={
                    card
                  }
                />
              )
            )}

          </div>

        </section>

        <section className="mt-10 pb-8">

          <div className="mb-4">

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Estrutura
            </p>

            <h2 className="mt-1 text-xl font-bold text-foreground">
              Cardápio e sistema
            </h2>

          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

            {catalogCards.map(
              (
                card
              ) => (
                <DashboardCard
                  key={
                    card.route
                  }
                  card={
                    card
                  }
                />
              )
            )}

          </div>

        </section>

      </div>

    </main>
  );
}

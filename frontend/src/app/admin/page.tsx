"use client";

import Link from "next/link";

type IconProps = {
  className?: string;
};

type AdminCard = {
  title: string;
  description: string;
  route: string;
  icon: (props: IconProps) => React.ReactNode;
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

const operationCards: AdminCard[] = [
  {
    title: "Pedidos",
    description:
      "Acompanhe pedidos, pagamentos, clientes e andamento da operação.",
    route: "/admin/pedidos",
    icon: OrdersIcon,
    featured: true,
  },
  {
    title: "Cozinha",
    description:
      "Gerencie os pedidos em preparo e avance cada etapa da produção.",
    route: "/admin/cozinha",
    icon: KitchenIcon,
  },
  {
    title: "Entregas",
    description:
      "Acompanhe pedidos prontos e organize a saída para entrega.",
    route: "/admin/entregas",
    icon: DeliveryIcon,
  },
];

const managementCards: AdminCard[] = [
  {
    title: "Histórico",
    description:
      "Consulte pedidos concluídos, cancelados e recusados.",
    route: "/admin/historico",
    icon: HistoryIcon,
  },
  {
    title: "Relatórios",
    description:
      "Acompanhe faturamento, ticket médio e desempenho da operação.",
    route: "/admin/relatorios",
    icon: ChartIcon,
  },
  {
    title: "Caixa",
    description:
      "Visualize faturamento, taxas e formas de pagamento.",
    route: "/admin/caixa",
    icon: CashIcon,
  },
  {
    title: "Cupons",
    description:
      "Gerencie promoções, descontos, validade e utilização.",
    route: "/admin/cupons",
    icon: CouponIcon,
  },
];

const catalogCards: AdminCard[] = [
  {
    title: "Produtos",
    description:
      "Edite produtos, preços, descrições, imagens e disponibilidade.",
    route: "/admin/cardapio",
    icon: MenuIcon,
  },
  {
    title: "Categorias",
    description:
      "Organize os grupos e a estrutura do cardápio.",
    route: "/admin/categorias",
    icon: CategoryIcon,
  },
  {
    title: "Horários",
    description:
      "Configure os períodos em que a pizzaria recebe pedidos.",
    route: "/admin/horarios",
    icon: ClockIcon,
  },
  {
    title: "Configurações",
    description:
      "Controle abertura, limites e dados gerais da operação.",
    route: "/admin/configuracoes",
    icon: SettingsIcon,
  },
];

function DashboardCard({
  card,
}: {
  card: AdminCard;
}) {
  const Icon = card.icon;

  return (
    <Link
      href={card.route}
      className={[
        "group relative overflow-hidden rounded-2xl border p-5 transition duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        card.featured
          ? "border-primary/20 bg-primary text-primary-foreground shadow-sm hover:-translate-y-0.5 hover:shadow-md"
          : "border-border bg-card text-card-foreground hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-sm",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={[
            "flex h-10 w-10 items-center justify-center rounded-xl",
            card.featured
              ? "bg-primary-foreground/10"
              : "bg-muted text-foreground",
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </div>

        <ArrowIcon
          className={[
            "h-4 w-4 transition-transform duration-200 group-hover:translate-x-1",
            card.featured
              ? "text-primary-foreground/70"
              : "text-muted-foreground",
          ].join(" ")}
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
        ].join(" ")}
      >
        {card.description}
      </p>
    </Link>
  );
}

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">

        {/* CABEÇALHO */}

        <section className="border-b border-border pb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            PizzaSystem
          </p>

          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-4xl uppercase leading-none tracking-tight text-foreground sm:text-5xl">
                Painel administrativo
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Controle a operação da pizzaria, acompanhe pedidos e gerencie
                cardápio, financeiro e configurações em um só lugar.
              </p>
            </div>

            <Link
              href="/cardapio"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-card px-5 text-sm font-bold text-foreground transition hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm"
            >
              Ver cardápio
            </Link>
          </div>
        </section>

        {/* OPERAÇÃO */}

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Operação
              </p>

              <h2 className="mt-1 text-xl font-bold text-foreground">
                Acesso rápido
              </h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {operationCards.map((card) => (
              <DashboardCard
                key={card.route}
                card={card}
              />
            ))}
          </div>
        </section>

        {/* GESTÃO */}

        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Gestão
            </p>

            <h2 className="mt-1 text-xl font-bold text-foreground">
              Financeiro e acompanhamento
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {managementCards.map((card) => (
              <DashboardCard
                key={card.route}
                card={card}
              />
            ))}
          </div>
        </section>

        {/* CARDÁPIO E SISTEMA */}

        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Estrutura
            </p>

            <h2 className="mt-1 text-xl font-bold text-foreground">
              Cardápio e sistema
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {catalogCards.map((card) => (
              <DashboardCard
                key={card.route}
                card={card}
              />
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
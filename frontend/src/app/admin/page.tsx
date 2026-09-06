"use client";

import { useRouter } from "next/navigation";

type AdminCard = {
  title: string;
  description: string;
  route: string;
  icon: string;
};

const adminCards: AdminCard[] = [
  {
    title: "Pedidos",
    description:
      "Consulte todos os pedidos, pagamentos, clientes, itens e andamento da operação.",
    route: "/admin/pedidos",
    icon: "📦",
  },
  {
    title: "Cozinha",
    description:
      "Acompanhe pedidos pagos em preparo e avance o status até a entrega.",
    route: "/admin/cozinha",
    icon: "🍕",
  },
  {
    title: "Histórico",
    description:
      "Veja pedidos entregues, cancelados e pagamentos recusados.",
    route: "/admin/historico",
    icon: "🧾",
  },
  {
    title: "Relatórios",
    description:
      "Acompanhe faturamento, pedidos aprovados, ticket médio e formas de pagamento.",
    route: "/admin/relatorios",
    icon: "📊",
  },
  {
    title: "Caixa",
    description:
      "Consulte o resumo financeiro diário, faturamento, taxas e formas de pagamento.",
    route: "/admin/caixa",
    icon: "💰",
  },
  {
    title: "Cupons",
    description:
      "Crie promoções, configure descontos, validade, limites e acompanhe a utilização.",
    route: "/admin/cupons",
    icon: "🎟️",
  },
  {
    title: "Áreas de entrega",
    description:
      "Gerencie bairros atendidos, taxas de entrega e disponibilidade no checkout.",
    route: "/admin/entregas",
    icon: "🛵",
  },
  {
    title: "Cardápio",
    description:
      "Cadastre produtos, altere preços, descrições, imagens e disponibilidade.",
    route: "/admin/cardapio",
    icon: "📋",
  },
  {
    title: "Categorias",
    description:
      "Organize pizzas, esfihas, bebidas e outros grupos do cardápio.",
    route: "/admin/categorias",
    icon: "🗂️",
  },
  {
    title: "Horários",
    description:
      "Configure os dias e horários em que a pizzaria pode receber pedidos.",
    route: "/admin/horarios",
    icon: "🕒",
  },
  {
    title: "Configurações",
    description:
      "Controle abertura manual, limite diário e dados gerais da pizzaria.",
    route: "/admin/configuracoes",
    icon: "⚙️",
  },
];

export default function AdminPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-7xl">

        {/* =========================
            CABEÇALHO
            ========================= */}

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              PizzaSystem
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              Painel administrativo
            </h1>

            <p className="mt-2 max-w-3xl text-gray-600">
              Central de gerenciamento da operação, pedidos, relatórios,
              caixa, promoções, cardápio, entregas e configurações da pizzaria.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/cardapio")
            }
            className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            Ver site
          </button>

        </div>

        {/* =========================
            ÁREAS
            ========================= */}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

          {adminCards.map((card) => (
            <button
              key={card.route}
              type="button"
              onClick={() =>
                router.push(card.route)
              }
              className="group rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >

              <div className="flex items-start justify-between gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-2xl">
                  {card.icon}
                </div>

                <span className="text-xl text-gray-400 transition group-hover:translate-x-1 group-hover:text-gray-700">
                  →
                </span>

              </div>

              <h2 className="mt-5 text-xl font-bold text-gray-900">
                {card.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                {card.description}
              </p>

            </button>
          ))}

        </div>

        {/* =========================
            PRÓXIMAS ETAPAS
            ========================= */}

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div>

            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Próxima funcionalidade
            </p>

            <h2 className="mt-1 text-xl font-bold text-gray-900">
              Segurança do painel
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
              Operação, relatórios, caixa e sistema de promoções já fazem
              parte da estrutura administrativa. A próxima etapa será
              proteger o acesso às ferramentas de gerenciamento.
            </p>

          </div>

          <div className="mt-5">

            <div className="rounded-xl bg-gray-50 p-4">

              <p className="font-semibold text-gray-700">
                Login administrativo
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Autenticação e proteção das rotas do painel administrativo.
              </p>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}
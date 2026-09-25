"use client";

import {
  useState,
} from "react";

import Link from "next/link";

import GuideFeatureIcon from "@/components/GuideFeatureIcon";

import AdminHeader from "@/components/AdminHeader";
import AdminOnboarding from "@/components/AdminOnboarding";

const areas = [
  {
    title: "Painel",
    description:
      "Visão geral da operação e atalhos rápidos para as áreas mais usadas.",
    href: "/admin",
    icon: "dashboard",
  },
  {
    title: "Cardápio",
    description:
      "Cadastre produtos, categorias, adicionais e bordas. Revise preços, disponibilidade e imagens antes de divulgar.",
    href: "/admin/cardapio",
    icon: "menu",
  },
  {
    title: "Loja online",
    description:
      "Escolha o endereço público da loja, copie o link e abra o cardápio exatamente como o cliente verá.",
    href: "/admin/loja",
    icon: "store",
  },
  {
    title: "Pedidos",
    description:
      "Acompanhe cliente, endereço, pagamento e itens. Também é possível imprimir o comprovante ou baixar PDF.",
    href: "/admin/pedidos",
    icon: "menu",
  },
  {
    title: "Cozinha",
    description:
      "Organize os pedidos por etapa: recebido, preparando, pronto e demais status da produção.",
    href: "/admin/cozinha",
    icon: "kitchen",
  },
  {
    title: "Entregas",
    description:
      "Configure o endereço de saída, valor por km, distância máxima e frete grátis. O cálculo usa a rota real e cada pedido guarda o atalho do Google Maps.",
    href: "/admin/entregas",
    icon: "delivery",
  },
  {
    title: "Cupons e fidelidade",
    description:
      "Crie promoções e acompanhe o programa de fidelidade dos clientes da loja.",
    href: "/admin/cupons",
    icon: "coupon",
  },
  {
    title: "Pagamentos",
    description:
      "Conecte a conta Mercado Pago do estabelecimento e acompanhe o status financeiro dos pedidos.",
    href: "/admin/configuracoes",
    icon: "payment",
  },
  {
    title: "Caixa e relatórios",
    description:
      "Consulte faturamento, ticket médio, formas de pagamento e fechamento por data. O caixa também pode ser exportado em PDF.",
    href: "/admin/caixa",
    icon: "reports",
  },
  {
    title: "Personalização",
    description:
      "Ajuste nome, logo, capa, textos e aparência do cardápio público.",
    href: "/admin/personalizacao",
    icon: "palette",
  },
  {
    title: "Horários e operação",
    description:
      "Defina quando a loja pode receber pedidos e revise as configurações operacionais.",
    href: "/admin/horarios",
    icon: "settings",
  },
];

export default function GuiaPage() {
  const [
    tourOpen,
    setTourOpen,
  ] =
    useState(false);

  return (
    <main className="min-h-screen bg-background">
      <AdminHeader />

      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">

        <section className="border-b border-border pb-7">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                <GuideFeatureIcon
                  kind="guide"
                  className="h-4 w-4"
                />
                Guia
              </div>

              <h1 className="mt-3 font-display text-4xl uppercase leading-none tracking-tight text-foreground sm:text-5xl">
                Como usar o PizzaSystem
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                Um mapa rápido de tudo que existe no sistema. Se você pulou a apresentação inicial ou esqueceu onde fica alguma função, pode voltar aqui quando quiser.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setTourOpen(
                  true
                )
              }
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
            >
              <span aria-hidden="true">▶</span>
              Rever apresentação
            </button>

          </div>

        </section>

        <section className="mt-7 grid gap-4 md:grid-cols-2">

          {areas.map(
            (
              area,
              index
            ) => {
              const iconKind =
                area.icon as
                  | "dashboard"
                  | "menu"
                  | "store"
                  | "kitchen"
                  | "delivery"
                  | "payment"
                  | "reports"
                  | "palette"
                  | "settings"
                  | "coupon";

              return (
                <Link
                  key={
                    area.title
                  }
                  href={
                    area.href
                  }
                  className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-sm"
                >

                  <div className="flex items-start gap-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <GuideFeatureIcon
                        kind={iconKind}
                        className="h-5 w-5"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                          {String(
                            index +
                              1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <h2 className="text-base font-bold text-foreground">
                          {area.title}
                        </h2>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {area.description}
                      </p>

                      <span className="mt-4 inline-flex text-xs font-bold text-primary">
                        Abrir área →
                      </span>
                    </div>

                  </div>

                </Link>
              );
            }
          )}

        </section>

        <section className="mt-7 rounded-3xl border border-border bg-card p-6 sm:p-8">

          <h2 className="font-display text-3xl uppercase tracking-tight text-foreground">
            Fluxo recomendado para uma loja nova
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {[
              "1. Personalize a loja",
              "2. Cadastre categorias e produtos",
              "3. Configure horários e pagamentos",
              "4. Abra a loja e faça um pedido de teste",
            ].map(
              (
                item
              ) => (
                <div
                  key={
                    item
                  }
                  className="rounded-2xl border border-border bg-background p-4 text-sm font-semibold leading-6 text-foreground"
                >
                  {item}
                </div>
              )
            )}

          </div>

        </section>

      </div>

      <AdminOnboarding
        open={
          tourOpen
        }
        onClose={() =>
          setTourOpen(
            false
          )
        }
      />
    </main>
  );
}

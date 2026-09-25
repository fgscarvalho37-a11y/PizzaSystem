"use client";

import {
  useState,
} from "react";

type PreviewMode =
  | "admin"
  | "storefront";

function AdminPreview() {
  return (
    <div className="grid min-h-[760px] lg:grid-cols-[86px_1fr]">
      <aside className="hidden border-r border-black/10 bg-[#191816] px-3 py-5 text-white lg:block">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f15a24] text-lg font-black">
          P
        </div>

        <div className="mt-8 space-y-3">
          {Array.from({
            length: 8,
          }).map(
            (_, index) => (
              <div
                key={index}
                className={[
                  "mx-auto h-11 w-11 rounded-2xl",
                  index === 0
                    ? "bg-white/14"
                    : "bg-white/[0.04]",
                ].join(
                  " "
                )}
              />
            )
          )}
        </div>
      </aside>

      <section className="p-5 sm:p-8 lg:p-10">
        <div className="mx-auto max-w-[1300px]">

          <header className="flex flex-col gap-5 border-b border-black/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#f15a24]">
                PizzaSystem
              </p>

              <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.04em] sm:text-5xl">
                Painel da loja
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-black/55">
                Pedidos, cozinha, entregas, caixa e cardápio em uma única operação.
              </p>
            </div>

            <div className="flex gap-2">
              <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-bold">
                Loja aberta
              </div>

              <div className="rounded-full bg-[#181817] px-4 py-2 text-xs font-bold text-white">
                Abrir loja
              </div>
            </div>
          </header>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [
                "Pedidos hoje",
                "28",
                "+12% hoje",
              ],
              [
                "Faturamento",
                "R$ 2.184",
                "aprovado",
              ],
              [
                "Em preparo",
                "7",
                "na cozinha",
              ],
              [
                "Ticket médio",
                "R$ 78,00",
                "por pedido",
              ],
            ].map(
              (
                item,
                index
              ) => (
                <article
                  key={
                    item[0]
                  }
                  className={[
                    "rounded-3xl border p-5",
                    index === 0
                      ? "border-[#f15a24]/20 bg-[#f15a24] text-white"
                      : "border-black/10 bg-white",
                  ].join(
                    " "
                  )}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-65">
                    {item[0]}
                  </p>

                  <p className="mt-3 text-3xl font-black tracking-tight">
                    {item[1]}
                  </p>

                  <p className="mt-2 text-xs opacity-60">
                    {item[2]}
                  </p>
                </article>
              )
            )}
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
            <section className="rounded-3xl border border-black/10 bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-black/40">
                    Operação
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    Pedidos recentes
                  </h2>
                </div>

                <span className="text-xs font-bold text-[#f15a24]">
                  Ver todos
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  [
                    "#128",
                    "Mariana",
                    "2 pizzas",
                    "Preparando",
                    "R$ 96,00",
                  ],
                  [
                    "#127",
                    "Lucas",
                    "1 pizza + bebida",
                    "Recebido",
                    "R$ 74,00",
                  ],
                  [
                    "#126",
                    "Ana",
                    "3 pizzas",
                    "Pronto",
                    "R$ 142,00",
                  ],
                  [
                    "#125",
                    "Rafael",
                    "2 lanches",
                    "Saiu para entrega",
                    "R$ 61,00",
                  ],
                ].map(
                  (
                    order
                  ) => (
                    <div
                      key={
                        order[0]
                      }
                      className="grid gap-3 rounded-2xl border border-black/8 bg-[#fbfaf8] p-4 sm:grid-cols-[70px_1fr_150px_110px] sm:items-center"
                    >
                      <strong>
                        {order[0]}
                      </strong>

                      <div>
                        <p className="font-bold">
                          {order[1]}
                        </p>

                        <p className="text-xs text-black/45">
                          {order[2]}
                        </p>
                      </div>

                      <span className="w-fit rounded-full bg-black/[0.05] px-3 py-1 text-[11px] font-bold">
                        {order[3]}
                      </span>

                      <strong className="sm:text-right">
                        {order[4]}
                      </strong>
                    </div>
                  )
                )}
              </div>
            </section>

            <aside className="rounded-3xl border border-black/10 bg-[#181817] p-5 text-white sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
                Cozinha
              </p>

              <h2 className="mt-1 text-xl font-black">
                Fila atual
              </h2>

              <div className="mt-5 space-y-3">
                {[
                  [
                    "Recebidos",
                    "4",
                  ],
                  [
                    "Preparando",
                    "7",
                  ],
                  [
                    "Prontos",
                    "3",
                  ],
                  [
                    "Entregas",
                    "5",
                  ],
                ].map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={
                        item[0]
                      }
                      className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.04] p-4"
                    >
                      <span className="text-sm text-white/70">
                        {item[0]}
                      </span>

                      <span
                        className={[
                          "flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-black",
                          index === 1
                            ? "bg-[#f15a24] text-white"
                            : "bg-white/10",
                        ].join(
                          " "
                        )}
                      >
                        {item[1]}
                      </span>
                    </div>
                  )
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

function StorefrontPreview() {
  const products = [
    {
      name:
        "Pizza Calabresa",
      description:
        "Calabresa, cebola, mussarela e orégano.",
      price:
        "R$ 49,90",
      emoji:
        "🍕",
    },
    {
      name:
        "Pizza Frango com Catupiry",
      description:
        "Frango desfiado, catupiry e mussarela.",
      price:
        "R$ 54,90",
      emoji:
        "🍕",
    },
    {
      name:
        "Pizza Portuguesa",
      description:
        "Presunto, ovo, cebola, azeitona e mussarela.",
      price:
        "R$ 56,90",
      emoji:
        "🍕",
    },
    {
      name:
        "Coca-Cola 2L",
      description:
        "Gelada para acompanhar seu pedido.",
      price:
        "R$ 14,00",
      emoji:
        "🥤",
    },
  ];

  return (
    <div className="min-h-[760px] bg-[#fffaf4] text-[#191816]">
      <header className="border-b border-black/10 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-4 sm:px-8">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f15a24] text-xl">
              🍕
            </div>

            <div>
              <p className="text-sm font-black">
                Pizzaria Bella Massa
              </p>

              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                Aberto agora
              </p>
            </div>

          </div>

          <div className="flex items-center gap-2">

            <button className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-bold">
              Minha conta
            </button>

            <button className="rounded-full bg-[#181817] px-4 py-2 text-xs font-bold text-white">
              Carrinho · 2
            </button>

          </div>

        </div>
      </header>

      <section className="relative overflow-hidden bg-[#191816] text-white">
        <div className="absolute right-[-80px] top-[-100px] h-80 w-80 rounded-full bg-[#f15a24]/25 blur-3xl" />

        <div className="relative mx-auto grid max-w-[1200px] items-center gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_0.7fr] lg:py-16">

          <div>

            <span className="inline-flex rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/60">
              Cardápio online
            </span>

            <h1 className="mt-5 max-w-2xl text-5xl font-black uppercase leading-[0.92] tracking-[-0.05em] sm:text-6xl">
              Escolha.
              <span className="block text-[#f15a24]">
                Peça.
              </span>
              Aproveite.
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-6 text-white/55">
              Faça seu pedido online, escolha adicionais e acompanhe tudo de forma rápida.
            </p>

          </div>

          <div className="hidden items-center justify-center lg:flex">
            <div className="flex h-52 w-52 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[92px] shadow-[0_0_80px_rgba(241,90,36,0.15)]">
              🍕
            </div>
          </div>

        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f15a24]">
              O cardápio
            </p>

            <h2 className="mt-1 text-3xl font-black">
              Escolha o seu
            </h2>
          </div>

          <div className="flex gap-2 overflow-x-auto">

            {[
              "Todos",
              "Pizzas",
              "Bebidas",
              "Combos",
            ].map(
              (
                category,
                index
              ) => (
                <button
                  key={
                    category
                  }
                  className={[
                    "whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold",
                    index === 0
                      ? "bg-[#181817] text-white"
                      : "border border-black/10 bg-white",
                  ].join(
                    " "
                  )}
                >
                  {category}
                </button>
              )
            )}

          </div>

        </div>

        <div className="mt-6">
          <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/40">
            Buscar no cardápio...
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {products.map(
            (
              product
            ) => (
              <article
                key={
                  product.name
                }
                className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm"
              >

                <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-[#ffe0cf] to-[#fff4e8] text-7xl">
                  {
                    product.emoji
                  }
                </div>

                <div className="p-5">

                  <h3 className="text-base font-black">
                    {
                      product.name
                    }
                  </h3>

                  <p className="mt-2 min-h-10 text-xs leading-5 text-black/45">
                    {
                      product.description
                    }
                  </p>

                  <div className="mt-5 flex items-center justify-between gap-3">

                    <strong className="text-lg">
                      {
                        product.price
                      }
                    </strong>

                    <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f15a24] text-lg font-black text-white">
                      +
                    </button>

                  </div>

                </div>

              </article>
            )
          )}

        </div>

      </main>
    </div>
  );
}

export default function PizzaSystemPreviewPage() {
  const [
    mode,
    setMode,
  ] =
    useState<PreviewMode>(
      "admin"
    );

  return (
    <main className="min-h-screen bg-[#ebe7e0] p-3 sm:p-5">

      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[30px] border border-black/10 bg-[#f6f3ee] shadow-2xl">

        <div className="flex flex-col gap-3 border-b border-black/10 bg-[#181817] px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f15a24] text-sm font-black">
              P
            </div>

            <div>
              <p className="text-xs font-black">
                PizzaSystem
              </p>

              <p className="text-[10px] text-white/40">
                Preview demonstrativo
              </p>
            </div>

          </div>

          <div className="flex rounded-xl border border-white/10 bg-white/[0.04] p-1">

            <button
              type="button"
              onClick={() =>
                setMode(
                  "admin"
                )
              }
              className={[
                "rounded-lg px-4 py-2 text-xs font-bold transition",
                mode === "admin"
                  ? "bg-white text-[#181817]"
                  : "text-white/50 hover:text-white",
              ].join(
                " "
              )}
            >
              Painel admin
            </button>

            <button
              type="button"
              onClick={() =>
                setMode(
                  "storefront"
                )
              }
              className={[
                "rounded-lg px-4 py-2 text-xs font-bold transition",
                mode === "storefront"
                  ? "bg-white text-[#181817]"
                  : "text-white/50 hover:text-white",
              ].join(
                " "
              )}
            >
              Cardápio
            </button>

          </div>

        </div>

        {mode ===
        "admin" ? (
          <AdminPreview />
        ) : (
          <StorefrontPreview />
        )}

      </div>

    </main>
  );
}

export default function PizzaSystemPreviewPage() {
  return (
    <main className="min-h-screen bg-[#f6f3ee] text-[#181817]">
      <div className="grid min-h-screen lg:grid-cols-[86px_1fr]">
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

            <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-black/30">
              Preview demonstrativo do PizzaSystem
            </p>

          </div>
        </section>
      </div>
    </main>
  );
}

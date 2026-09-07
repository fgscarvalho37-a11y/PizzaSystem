"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Order = {
  id: number;
  customerName: string;
  customerPhone: string;
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
  deliveryFee: number;
  total: number;
  status: string;
  paymentStatus?: string;
  createdAt: string;
};

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: "Aguardando pagamento",
  RECEIVED: "Pedido recebido",
  PREPARING: "Em preparo",
  READY: "Pronto",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

const statusMessages: Record<string, string> = {
  PENDING_PAYMENT:
    "Estamos aguardando a confirmação do pagamento.",
  RECEIVED:
    "Seu pedido foi recebido pela pizzaria.",
  PREPARING:
    "Seu pedido está sendo preparado.",
  READY:
    "Seu pedido está pronto e será enviado em breve.",
  OUT_FOR_DELIVERY:
    "Seu pedido saiu para entrega.",
  DELIVERED:
    "Pedido entregue. Aproveite.",
  CANCELLED:
    "Este pedido foi cancelado.",
};

const statusSteps = [
  "RECEIVED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

function formatMoney(value: number) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(value);
}

function CheckIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function ClockIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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

function MapPinIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  );
}

export default function PedidoPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  async function loadOrder() {
    try {
      const response = await fetch(
        `http://localhost:8080/api/orders/${id}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Pedido não encontrado"
        );
      }

      const data: Order =
        await response.json();

      setOrder(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();

    const interval =
      setInterval(() => {
        loadOrder();
      }, 3000);

    return () =>
      clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background pb-16 text-foreground">
        <header className="border-b border-border bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="skeleton h-9 w-40 rounded-xl" />
            <div className="skeleton h-9 w-24 rounded-full" />
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div className="skeleton h-4 w-28" />
          <div className="skeleton mt-3 h-12 w-72" />
          <div className="skeleton mt-8 h-64 rounded-[28px]" />
          <div className="skeleton mt-6 h-52 rounded-[28px]" />
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-5 py-10 text-foreground">
        <div className="w-full max-w-lg rounded-[28px] border border-border bg-card p-8 text-center shadow-[0_18px_60px_-30px] shadow-foreground/40">
          <p className="font-mono-brand text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Acompanhamento
          </p>

          <h1 className="mt-2 font-display text-4xl tracking-tight">
            Pedido não encontrado
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Não conseguimos localizar esse pedido.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/cardapio"
              )
            }
            className="brand-button mt-6 w-full rounded-2xl px-5 py-3.5"
          >
            Voltar ao cardápio
          </button>
        </div>
      </main>
    );
  }

  const currentStep =
    statusSteps.indexOf(
      order.status
    );

  const isCancelled =
    order.status ===
    "CANCELLED";

  const isDelivered =
    order.status ===
    "DELIVERED";

  const isPendingPayment =
    order.status ===
    "PENDING_PAYMENT";

  const statusLabel =
    statusLabels[
      order.status
    ] ?? order.status;

  const statusMessage =
    statusMessages[
      order.status
    ] ??
    "Status atualizado.";

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">

      {/* =========================
          HEADER
          ========================= */}

      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">

          <button
            type="button"
            onClick={() =>
              router.push(
                "/cardapio"
              )
            }
            className="flex items-center gap-2.5"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-display text-lg text-primary-foreground shadow-[0_2px_0_0] shadow-foreground/30">
              P
            </span>

            <span className="font-display text-2xl leading-none tracking-tight">
              PizzaSystem
              <span className="text-primary">
                .
              </span>
            </span>
          </button>

          <span className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-cream">
            Pedido #{order.id}
          </span>

        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">

        <p className="font-mono-brand text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          (d) Acompanhar
        </p>

        <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
              Pedido #{order.id}
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Acompanhe o andamento do seu pedido em tempo real.
            </p>
          </div>

          <div
            className={`inline-flex items-center gap-2 self-start rounded-full px-4 py-2 font-mono-brand text-xs font-bold uppercase tracking-wide ${
              isCancelled
                ? "bg-primary/10 text-primary"
                : isDelivered
                  ? "bg-lime/25 text-foreground"
                  : isPendingPayment
                    ? "bg-butter/35 text-foreground"
                    : "bg-foreground text-cream"
            }`}
          >
            {!isCancelled &&
              !isDelivered && (
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              )}

            {statusLabel}
          </div>

        </div>

        {/* =========================
            STATUS PRINCIPAL
            ========================= */}

        <section className="mt-8 overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_18px_60px_-30px] shadow-foreground/40">

          <div className="p-5 sm:p-7">

            <div className="flex items-start gap-4">

              <div
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
                  isCancelled
                    ? "bg-primary/10 text-primary"
                    : isDelivered
                      ? "bg-lime/25 text-foreground"
                      : isPendingPayment
                        ? "bg-butter/35 text-foreground"
                        : "bg-secondary text-foreground"
                }`}
              >
                {isDelivered ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  <ClockIcon className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">

                <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Status atual
                </p>

                <h2 className="mt-1 font-display text-3xl tracking-tight">
                  {statusLabel}
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {statusMessage}
                </p>

              </div>

            </div>

            {!isCancelled &&
              !isPendingPayment && (

                <div className="mt-8 grid gap-3 sm:grid-cols-5">

                  {statusSteps.map(
                    (
                      status,
                      index
                    ) => {

                      const completed =
                        currentStep >=
                          0 &&
                        index <=
                          currentStep;

                      const current =
                        index ===
                        currentStep;

                      return (
                        <div
                          key={
                            status
                          }
                          className={`relative rounded-2xl border p-3 text-center transition ${
                            current
                              ? "border-primary bg-primary/5"
                              : completed
                                ? "border-foreground/15 bg-secondary/70"
                                : "border-border bg-background/50"
                          }`}
                        >

                          <div
                            className={`mx-auto grid h-9 w-9 place-items-center rounded-full text-xs font-bold ${
                              completed
                                ? "bg-foreground text-cream"
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {completed ? (
                              <CheckIcon className="h-4 w-4" />
                            ) : (
                              index +
                              1
                            )}
                          </div>

                          <p
                            className={`mt-2 text-xs font-bold leading-4 ${
                              completed
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {
                              statusLabels[
                                status
                              ]
                            }
                          </p>

                          {current &&
                            !isDelivered && (
                              <p className="mt-1 font-mono-brand text-[9px] uppercase tracking-wider text-primary">
                                Agora
                              </p>
                            )}

                        </div>
                      );
                    }
                  )}

                </div>

              )}

            {isPendingPayment && (

              <div className="mt-7 rounded-2xl border border-butter/50 bg-butter/20 p-4">

                <p className="font-bold">
                  Pagamento ainda não confirmado
                </p>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Assim que o pagamento for aprovado, o pedido entra automaticamente na cozinha.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/pagamento/${order.id}`
                    )
                  }
                  className="mt-4 rounded-xl bg-foreground px-5 py-3 text-sm font-bold text-cream transition-transform active:scale-95"
                >
                  Voltar ao pagamento
                </button>

              </div>

            )}

          </div>

        </section>

        {/* =========================
            ENTREGA + VALORES
            ========================= */}

        <div className="mt-6 grid gap-6 md:grid-cols-2">

          <section className="rounded-[28px] border border-border bg-card p-5 shadow-[0_18px_60px_-30px] shadow-foreground/40">

            <div className="flex items-center gap-3">

              <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary">
                <MapPinIcon className="h-5 w-5" />
              </div>

              <div>
                <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Entrega
                </p>

                <h2 className="mt-0.5 font-display text-2xl tracking-tight">
                  Endereço
                </h2>
              </div>

            </div>

            <div className="mt-5 space-y-2 text-sm">

              <p className="font-bold">
                {order.customerName}
              </p>

              <p className="leading-6 text-muted-foreground">
                {order.street},{" "}
                {order.number}
                <br />
                {order.neighborhood}
              </p>

              {order.complement && (
                <p className="text-muted-foreground">
                  {order.complement}
                </p>
              )}

            </div>

          </section>

          <section className="rounded-[28px] border-2 border-foreground bg-foreground p-5 text-cream shadow-[0_6px_0_0] shadow-primary/40">

            <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-cream/55">
              Valores
            </p>

            <div className="mt-5 space-y-3">

              <div className="flex items-center justify-between gap-4 text-sm">

                <span className="text-cream/65">
                  Taxa de entrega
                </span>

                <span className="font-mono-brand">
                  {formatMoney(
                    Number(
                      order.deliveryFee ??
                        0
                    )
                  )}
                </span>

              </div>

              <div className="h-px bg-cream/15" />

              <div className="flex items-end justify-between gap-4">

                <span className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-cream/55">
                  Total
                </span>

                <span className="font-display text-4xl tracking-tight text-butter">
                  {formatMoney(
                    Number(
                      order.total
                    )
                  )}
                </span>

              </div>

            </div>

          </section>

        </div>

        <div className="mt-6 rounded-2xl border border-border bg-secondary/55 p-4 text-center">

          <p className="text-sm font-semibold">
            O status é atualizado automaticamente a cada poucos segundos.
          </p>

        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/cardapio"
            )
          }
          className="mt-6 w-full rounded-2xl border-2 border-foreground px-5 py-3.5 text-sm font-bold transition-colors hover:bg-foreground hover:text-cream"
        >
          Voltar ao cardápio
        </button>

      </div>
    </main>
  );
}

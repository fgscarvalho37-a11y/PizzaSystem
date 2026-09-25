"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

type Order = {
  id: number;
  total: number;
  paymentStatus: string;
  status: string;
};

const API_URL = "";

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

export default function PaymentSuccessPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const id =
    params.id as string;

  const tokenFromUrl =
    searchParams.get("token");

  const storeSlug =
    searchParams.get("store");

  const menuUrl =
    storeSlug
      ? `/cardapio/${encodeURIComponent(storeSlug)}`
      : "/";

  const [
    accessToken,
    setAccessToken,
  ] =
    useState<string | null>(
      null
    );

  const [
    tokenReady,
    setTokenReady,
  ] =
    useState(false);

  const [
    order,
    setOrder,
  ] =
    useState<Order | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  // =========================
  // TOKEN DE ACESSO
  // =========================

  useEffect(() => {
    if (!id) {
      return;
    }

    const storageKey =
      `pizzasystem-order-token:${id}`;

    if (tokenFromUrl) {
      sessionStorage.setItem(
        storageKey,
        tokenFromUrl
      );

      setAccessToken(
        tokenFromUrl
      );

      setTokenReady(true);

      return;
    }

    const storedToken =
      sessionStorage.getItem(
        storageKey
      );

    setAccessToken(
      storedToken
    );

    setTokenReady(true);
  }, [
    id,
    tokenFromUrl,
  ]);

  // =========================
  // CARREGAR PEDIDO
  // =========================

  useEffect(() => {
    if (!tokenReady) {
      return;
    }

    async function loadOrder() {
      if (!accessToken) {
        setOrder(null);
        setLoading(false);
        return;
      }

      try {
        const encodedToken =
          encodeURIComponent(
            accessToken
          );

        const response =
          await fetch(
            `${API_URL}/api/orders/${id}?token=${encodedToken}`,
            {
              cache:
                "no-store",
            }
          );

        if (!response.ok) {
          throw new Error(
            "Pedido não encontrado"
          );
        }

        const data:
          Order =
          await response.json();

        setOrder(data);

      } catch (error) {
        console.error(error);

        setOrder(null);

      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [
    id,
    accessToken,
    tokenReady,
  ]);

  if (
    !tokenReady ||
    loading
  ) {
    return (
      <main className="min-h-screen bg-background pb-16 text-foreground">
        <header className="border-b border-border bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="skeleton h-9 w-40 rounded-xl" />
            <div className="skeleton h-9 w-24 rounded-full" />
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="skeleton h-[420px] rounded-[30px]" />
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-5 py-10 text-foreground">
        <div className="w-full max-w-lg rounded-[28px] border border-border bg-card p-8 text-center shadow-[0_18px_60px_-30px] shadow-foreground/40">
          <p className="font-mono-brand text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Pagamento
          </p>

          <h1 className="mt-2 font-display text-4xl tracking-tight">
            Pedido não encontrado
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Não conseguimos localizar esse pedido agora.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                menuUrl
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

  const approved =
    order.paymentStatus ===
    "APPROVED";

  const encodedToken =
    encodeURIComponent(
      accessToken ?? ""
    );

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">

      <header className="border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">

          <button
            type="button"
            onClick={() =>
              router.push(
                menuUrl
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

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">

        <div className="rounded-[30px] border border-border bg-card p-7 text-center shadow-[0_18px_60px_-30px] shadow-foreground/40 sm:p-10">

          <div
            className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${
              approved
                ? "bg-lime/25 text-foreground"
                : "bg-butter/35 text-foreground"
            }`}
          >
            {approved ? (
              <CheckIcon className="h-7 w-7" />
            ) : (
              <ClockIcon className="h-7 w-7" />
            )}
          </div>

          <p className="mt-6 font-mono-brand text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {approved
              ? "Pagamento confirmado"
              : "Confirmação pendente"}
          </p>

          <h1 className="mt-2 font-display text-5xl tracking-tight">
            {approved
              ? "Pagamento aprovado"
              : "Pagamento em processamento"}
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
            {approved
              ? "Seu pagamento foi confirmado e a pizzaria já recebeu o pedido."
              : "Estamos aguardando a confirmação do pagamento. Você pode acompanhar o pedido enquanto isso."}
          </p>

          <div className="mx-auto mt-7 max-w-md overflow-hidden rounded-2xl border border-border bg-secondary">

            <div className="grid grid-cols-2 divide-x divide-border">

              <div className="p-5">
                <p className="font-mono-brand text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  Pedido
                </p>

                <p className="mt-1 font-display text-3xl tracking-tight">
                  #{order.id}
                </p>
              </div>

              <div className="p-5">
                <p className="font-mono-brand text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  Total
                </p>

                <p className="mt-1 font-display text-3xl tracking-tight text-primary">
                  {formatMoney(
                    Number(
                      order.total
                    )
                  )}
                </p>
              </div>

            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">

              <span className="text-sm text-muted-foreground">
                Status do pedido
              </span>

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  approved
                    ? "bg-foreground text-cream"
                    : "bg-butter/50 text-foreground"
                }`}
              >
                {approved
                  ? "Recebido"
                  : "Aguardando confirmação"}
              </span>

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/pedido/${order.id}?token=${encodedToken}`
              )
            }
            className="brand-button mt-7 w-full rounded-2xl px-5 py-3.5"
          >
            Acompanhar pedido
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                menuUrl
              )
            }
            className="mt-3 w-full rounded-2xl border-2 border-foreground px-5 py-3.5 text-sm font-bold transition-colors hover:bg-foreground hover:text-cream"
          >
            Voltar ao cardápio
          </button>

        </div>

      </div>
    </main>
  );
}

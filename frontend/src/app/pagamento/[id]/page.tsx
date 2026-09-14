"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080";

type PixPayment = {
  id: string;
  amount: string;
  status: string;
  status_detail: string;
  payment_method: {
    id: string;
    type: string;
    ticket_url?: string;
    qr_code?: string;
    qr_code_base64?: string;
  };
};

type MercadoPagoOrder = {
  id: string;
  status: string;
  status_detail: string;
  total_amount: string;
  external_reference: string;
  transactions: {
    payments: PixPayment[];
  };
};

type LocalOrder = {
  id: number;
  paymentStatus: string;
  status: string;
  total: number;
};

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

function CopyIcon({
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
      <rect
        x="9"
        y="9"
        width="11"
        height="11"
        rx="2"
      />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export default function PagamentoPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [tokenFromUrl, setTokenFromUrl] =
    useState<string | null>(null);

  const [storeSlug, setStoreSlug] =
    useState("");

  const [urlReady, setUrlReady] =
    useState(false);

  const [accessToken, setAccessToken] =
    useState<string | null>(null);

  const [tokenReady, setTokenReady] =
    useState(false);

  const [data, setData] =
    useState<MercadoPagoOrder | null>(null);

  const [localOrder, setLocalOrder] =
    useState<LocalOrder | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [copied, setCopied] =
    useState(false);

  const [expiresAt, setExpiresAt] =
    useState<number | null>(null);

  const [secondsLeft, setSecondsLeft] =
    useState(0);

  const [canceling, setCanceling] =
    useState(false);

  const [cancelError, setCancelError] =
    useState("");

  const [showCancelConfirm, setShowCancelConfirm] =
    useState(false);

  const [autoCancelTriggered, setAutoCancelTriggered] =
    useState(false);

  useEffect(() => {
    const query =
      new URLSearchParams(
        window.location.search
      );

    setTokenFromUrl(
      query.get("token")
    );

    setStoreSlug(
      query.get("store")?.trim() ?? ""
    );

    setUrlReady(true);
  }, []);

  useEffect(() => {
    if (!urlReady || !id) {
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
  }, [id, tokenFromUrl, urlReady]);

  useEffect(() => {
    if (!id) {
      return;
    }

    const expirationKey =
      `pizzasystem-pix-expires-at:${id}`;

    const storedExpiration =
      localStorage.getItem(
        expirationKey
      );

    let nextExpiration =
      storedExpiration
        ? Number(storedExpiration)
        : 0;

    if (!nextExpiration ||
        Number.isNaN(nextExpiration)) {

      nextExpiration =
        Date.now() +
        15 * 60 * 1000;

      localStorage.setItem(
        expirationKey,
        String(nextExpiration)
      );
    }

    setExpiresAt(
      nextExpiration
    );
  }, [id]);

  useEffect(() => {
    if (!expiresAt) {
      return;
    }

    const expirationTime =
      expiresAt;

    function updateCountdown() {
      const difference =
        Math.max(
          0,
          Math.ceil(
            (expirationTime - Date.now()) /
            1000
          )
        );

      setSecondsLeft(
        difference
      );
    }

    updateCountdown();

    const timer =
      setInterval(
        updateCountdown,
        1000
      );

    return () =>
      clearInterval(timer);
  }, [expiresAt]);

  async function loadData() {
    if (!accessToken) {
      setData(null);
      setLocalOrder(null);
      setLoading(false);
      return;
    }

    try {
      const encodedToken =
        encodeURIComponent(
          accessToken
        );

      const [pixResponse, orderResponse] =
        await Promise.all([
          fetch(
            `${API_URL}/api/payments/${id}/pix?token=${encodedToken}`,
            {
              cache: "no-store",
            }
          ),

          fetch(
            `${API_URL}/api/orders/${id}?token=${encodedToken}`,
            {
              cache: "no-store",
            }
          ),
        ]);

      if (!pixResponse.ok) {
        throw new Error(
          "Erro ao carregar Pix"
        );
      }

      if (!orderResponse.ok) {
        throw new Error(
          "Erro ao carregar pedido"
        );
      }

      const pixData: MercadoPagoOrder =
        await pixResponse.json();

      const orderData: LocalOrder =
        await orderResponse.json();

      setData(pixData);
      setLocalOrder(orderData);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!tokenReady) {
      return;
    }

    loadData();

    if (!accessToken) {
      return;
    }

    const interval = setInterval(() => {
      loadData();
    }, 3000);

    return () => clearInterval(interval);
  }, [id, accessToken, tokenReady]);

  useEffect(() => {
    if (!localOrder ||
        localOrder.paymentStatus !== "APPROVED" ||
        !accessToken) {
      return;
    }

    localStorage.removeItem(
      `pizzasystem-pix-expires-at:${id}`
    );

    const timer =
      setTimeout(() => {
        router.push(
          `/pedido/${localOrder.id}?token=${encodeURIComponent(
            accessToken
          )}`
        );
      }, 1800);

    return () =>
      clearTimeout(timer);
  }, [
    localOrder,
    accessToken,
    id,
    router,
  ]);

  useEffect(() => {
    if (
      !tokenReady ||
      !localOrder ||
      localOrder.paymentStatus === "APPROVED" ||
      localOrder.status === "CANCELLED" ||
      secondsLeft > 0 ||
      autoCancelTriggered ||
      !accessToken
    ) {
      return;
    }

    setAutoCancelTriggered(true);

    const cancelExpiredOrder =
      async () => {
        try {
          const encodedToken =
            encodeURIComponent(
              accessToken
            );

          const response =
            await fetch(
              `${API_URL}/api/orders/${id}/cancel?token=${encodedToken}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type":
                    "application/json",
                },
              }
            );

          if (!response.ok) {
            throw new Error(
              "Não foi possível cancelar o Pix expirado."
            );
          }

          localStorage.removeItem(
            `pizzasystem-pix-expires-at:${id}`
          );

          router.replace(
            storeSlug
              ? `/cardapio/${encodeURIComponent(
                  storeSlug
                )}?pix=expired`
              : "/"
          );
        } catch (error) {
          console.error(
            "Erro ao cancelar Pix expirado:",
            error
          );

          setCancelError(
            "O Pix expirou, mas não foi possível cancelar o pedido automaticamente."
          );
        }
      };

    void cancelExpiredOrder();
  }, [
    tokenReady,
    localOrder,
    secondsLeft,
    autoCancelTriggered,
    accessToken,
    id,
    router,
    storeSlug,
  ]);

  if (!urlReady || !tokenReady || loading) {
    return (
      <main className="min-h-screen bg-background pb-16 text-foreground">
        <header className="border-b border-border bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="skeleton h-9 w-40 rounded-xl" />
            <div className="skeleton h-9 w-24 rounded-full" />
          </div>
        </header>

        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="skeleton h-4 w-28" />
          <div className="skeleton mt-3 h-12 w-72" />
          <div className="mx-auto mt-8 grid max-w-3xl gap-6 md:grid-cols-[320px_1fr]">
            <div className="skeleton aspect-square rounded-[28px]" />
            <div className="space-y-4">
              <div className="skeleton h-28 rounded-[28px]" />
              <div className="skeleton h-40 rounded-[28px]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!data || !localOrder) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-5 py-10 text-foreground">
        <div className="w-full max-w-lg rounded-[28px] border border-border bg-card p-8 text-center shadow-[0_18px_60px_-30px] shadow-foreground/40">
          <p className="font-mono-brand text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Pagamento
          </p>

          <h1 className="mt-2 font-display text-4xl tracking-tight">
            Não foi possível carregar
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Tente novamente em alguns instantes ou volte ao cardápio.
          </p>

          <button
            type="button"
            onClick={goBackToStore}
            className="brand-button mt-6 w-full rounded-2xl px-5 py-3.5"
          >
            Voltar ao cardápio
          </button>
        </div>
      </main>
    );
  }

  const payment =
    data.transactions?.payments?.[0];

  const qrCode =
    payment?.payment_method?.qr_code ?? "";

  const qrBase64 =
    payment?.payment_method?.qr_code_base64 ?? "";

  const approved =
    localOrder.paymentStatus === "APPROVED";

  async function copyPix() {
    if (!qrCode) {
      return;
    }

    await navigator.clipboard.writeText(
      qrCode
    );

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  const expired =
    !approved &&
    secondsLeft <= 0;

  const minutes =
    Math.floor(
      secondsLeft / 60
    );

  const seconds =
    secondsLeft % 60;

  const countdown =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  function goBackToStore() {
    if (storeSlug) {
      router.push(
        `/cardapio/${encodeURIComponent(
          storeSlug
        )}`
      );

      return;
    }

    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }

  async function cancelOrder(
    automatic = false
  ) {
    if (!accessToken ||
        approved ||
        canceling) {
      return;
    }

    try {
      setCanceling(true);
      setCancelError("");

      const encodedToken =
        encodeURIComponent(
          accessToken
        );

      const response =
        await fetch(
          `${API_URL}/api/orders/${id}/cancel?token=${encodedToken}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

      if (!response.ok) {
        let message =
          "Não foi possível cancelar o pedido.";

        try {
          const payload =
            await response.json();

          if (
            typeof payload?.message ===
              "string" &&
            payload.message
          ) {
            message =
              payload.message;
          }
        } catch {
          // mantém mensagem padrão
        }

        throw new Error(
          message
        );
      }

      localStorage.removeItem(
        `pizzasystem-pix-expires-at:${id}`
      );

      setShowCancelConfirm(false);

      if (automatic) {
        router.replace(
          storeSlug
            ? `/cardapio/${encodeURIComponent(
                storeSlug
              )}?pix=expired`
            : "/"
        );

        return;
      }

      goBackToStore();

    } catch (error) {
      setCancelError(
        error instanceof Error
          ? error.message
          : "Não foi possível cancelar o pedido."
      );

      setShowCancelConfirm(false);
    } finally {
      setCanceling(false);
    }
  }
  if (approved) {
    return (
      <main className="min-h-screen bg-background pb-16 text-foreground">
        <header className="border-b border-border bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={goBackToStore}
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
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="rounded-[30px] border border-border bg-card p-7 text-center shadow-[0_18px_60px_-30px] shadow-foreground/40 sm:p-10">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-lime/25 text-foreground">
              <CheckIcon className="h-7 w-7" />
            </div>

            <p className="mt-6 font-mono-brand text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Pagamento confirmado
            </p>

            <h1 className="mt-2 font-display text-5xl tracking-tight">
              Pedido recebido
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
              O pagamento foi aprovado e a pizzaria já recebeu seu pedido. Você será direcionado para o acompanhamento em instantes.
            </p>

            <div className="mx-auto mt-7 max-w-md rounded-2xl bg-secondary p-5">
              <p className="font-mono-brand text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Pedido
              </p>

              <p className="mt-1 font-display text-4xl tracking-tight">
                #{localOrder.id}
              </p>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">
                  Status
                </span>

                <span className="rounded-full bg-foreground px-3 py-1.5 text-xs font-bold text-cream">
                  Recebido
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/pedido/${localOrder.id}?token=${encodeURIComponent(
                    accessToken ?? ""
                  )}`
                )
              }
              className="brand-button mt-7 w-full rounded-2xl px-5 py-3.5"
            >
              Acompanhar pedido
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <header className="border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={goBackToStore}
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
            Pedido #{localOrder.id}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <p className="font-mono-brand text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          (c) Pagamento
        </p>

        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
              Pague com Pix
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Escaneie o QR Code ou copie o código abaixo. A confirmação acontece automaticamente.
            </p>
          </div>

          <p className="font-display text-4xl tracking-tight text-primary sm:text-5xl">
            {formatMoney(
              Number(data.total_amount)
            )}
          </p>
        </div>

        <div className="mt-8 grid items-start gap-6 md:grid-cols-[340px_1fr]">
          <section className="rounded-[28px] border border-border bg-card p-5 shadow-[0_18px_60px_-30px] shadow-foreground/40">
            <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Escaneie para pagar
            </p>

            <div className="mt-4 rounded-2xl bg-white p-4">
              {qrBase64 && !expired ? (
                <img
                  src={`data:image/png;base64,${qrBase64}`}
                  alt="QR Code Pix"
                  className="mx-auto aspect-square w-full max-w-[280px]"
                />
              ) : (
                <div className="grid aspect-square place-items-center rounded-xl bg-secondary text-center text-sm text-muted-foreground">
                  {expired
                    ? "Pix expirado"
                    : "QR Code indisponível"}
                </div>
              )}
            </div>
          </section>

          <div className="space-y-5">
            <section className="rounded-[28px] border border-border bg-card p-5 shadow-[0_18px_60px_-30px] shadow-foreground/40">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Status
                  </p>

                  <h2 className="mt-1 font-display text-2xl tracking-tight">
                    {expired
                      ? "Pix expirado"
                      : "Aguardando pagamento"}
                  </h2>
                </div>

                <span className="flex items-center gap-2 rounded-full bg-butter/35 px-3 py-1.5 font-mono-brand text-[10px] font-bold uppercase tracking-wider">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      expired
                        ? "bg-muted-foreground"
                        : "animate-pulse bg-primary"
                    }`}
                  />
                  {expired
                    ? "Expirado"
                    : "Verificando"}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl bg-secondary/70 px-4 py-3">
                <span className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Tempo restante
                </span>

                <span className={`font-mono-brand text-lg font-bold ${
                  expired
                    ? "text-primary"
                    : "text-foreground"
                }`}>
                  {countdown}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {expired
                  ? "O tempo desta cobrança terminou. Cancele o pedido ou volte ao cardápio para fazer um novo pedido."
                  : "Pode fechar o aplicativo do banco depois de pagar. Esta página verifica o status automaticamente a cada poucos segundos."}
              </p>
            </section>

            <section className="rounded-[28px] border border-border bg-card p-5 shadow-[0_18px_60px_-30px] shadow-foreground/40">
              <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Pix copia e cola
              </p>

              <textarea
                readOnly
                value={
                  expired
                    ? ""
                    : qrCode
                }
                rows={5}
                className="mt-3 w-full resize-none rounded-2xl border border-border bg-secondary/60 p-3 font-mono text-xs leading-5 outline-none"
              />

              <button
                type="button"
                onClick={copyPix}
                disabled={
                  expired ||
                  !qrCode
                }
                className="brand-button mt-3 w-full rounded-2xl px-5 py-3.5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    Código copiado
                  </>
                ) : (
                  <>
                    <CopyIcon className="h-4 w-4" />
                    Copiar código Pix
                  </>
                )}
              </button>

              {!expired &&
                payment?.payment_method?.ticket_url && (
                <a
                  href={
                    payment.payment_method.ticket_url
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block text-center font-mono-brand text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                >
                  Abrir no Mercado Pago
                </a>
              )}
            </section>
          </div>
        </div>

        {cancelError && (
          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="font-bold text-primary">
              Não foi possível cancelar
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {cancelError}
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={goBackToStore}
            className="min-h-12 rounded-2xl border-2 border-foreground bg-transparent px-5 text-sm font-bold transition-colors hover:bg-foreground hover:text-cream"
          >
            Voltar ao cardápio
          </button>

          <button
            type="button"
            onClick={() =>
              setShowCancelConfirm(true)
            }
            disabled={
              approved ||
              canceling
            }
            className="min-h-12 rounded-2xl border border-primary/30 bg-primary/5 px-5 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            {canceling
              ? "Cancelando..."
              : "Cancelar pedido"}
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-secondary/55 p-4">
          <p className="text-sm font-semibold">
            Depois do pagamento, você será direcionado para acompanhar o pedido assim que a aprovação for identificada.
          </p>
        </div>
      </div>

      {showCancelConfirm && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-order-title"
        >
          <div className="w-full max-w-md rounded-[28px] border border-border bg-card p-6 shadow-2xl sm:p-7">
            <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Cancelar pedido
            </p>

            <h2
              id="cancel-order-title"
              className="mt-2 font-display text-3xl tracking-tight"
            >
              Tem certeza?
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Se você cancelar agora, este pedido será encerrado e o Pix não será mais considerado válido pelo PizzaSystem.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  setShowCancelConfirm(false)
                }
                disabled={canceling}
                className="min-h-12 rounded-2xl border-2 border-foreground bg-transparent px-5 text-sm font-bold transition-colors hover:bg-foreground hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
              >
                Manter pedido
              </button>

              <button
                type="button"
                onClick={() =>
                  void cancelOrder(false)
                }
                disabled={canceling}
                className="min-h-12 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {canceling
                  ? "Cancelando..."
                  : "Sim, cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

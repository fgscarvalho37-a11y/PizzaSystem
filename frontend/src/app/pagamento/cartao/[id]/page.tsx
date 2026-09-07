"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  CardPayment,
  CardNumber,
  ExpirationDate,
  SecurityCode,
  createCardToken,
  initMercadoPago,
} from "@mercadopago/sdk-react";

type Order = {
  id: number;
  total: number;

  paymentMethod:
    | "CREDIT_CARD"
    | "DEBIT_CARD";

  paymentStatus: string;
  status: string;
};

type CreditCardData = {
  token: string;

  payment_method_id: string;

  installments?: number;

  payer: {
    email: string;

    identification?: {
      type?: string;
      number?: string;
    };
  };
};

type PaymentErrorResponse = {
  success?: boolean;
  status?: string;
  reason?: string;
  message?: string;
};

const publicKey =
  process.env
    .NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

if (publicKey) {
  initMercadoPago(
    publicKey,
    {
      locale: "pt-BR",
    }
  );
}

export default function CardPaymentPage() {

  const params =
    useParams();

  const router =
    useRouter();

  const id =
    params.id as string;

  const [order, setOrder] =
    useState<Order | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [
    processing,
    setProcessing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    cardholderName,
    setCardholderName,
  ] = useState("");

  const [
    identificationNumber,
    setIdentificationNumber,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  // =========================
  // CARREGAR PEDIDO
  // =========================

  useEffect(() => {

    async function loadOrder() {

      try {

        const response =
          await fetch(
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

      } catch {

        setErrorMessage(
          "Não foi possível carregar o pedido."
        );

      } finally {

        setLoading(false);
      }
    }

    loadOrder();

  }, [id]);

  // =========================
  // LER MENSAGEM DO BACKEND
  // =========================

  async function readPaymentError(
    response: Response,
    fallbackMessage: string
  ) {

    try {

      const data:
        PaymentErrorResponse =
          await response.json();

      if (
        data.message &&
        data.message.trim()
      ) {

        return data.message;
      }

    } catch {
      // usa fallback
    }

    return fallbackMessage;
  }

  // =========================
  // CRÉDITO
  // =========================

  async function handleCreditSubmit(
    formData: CreditCardData
  ) {

    if (!order) {
      return;
    }

    setProcessing(true);
    setErrorMessage("");

    try {

      const response =
        await fetch(
          `http://localhost:8080/api/payments/${order.id}/card`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                token:
                  formData.token,

                paymentMethodId:
                  formData
                    .payment_method_id,

                installments:
                  formData
                    .installments ?? 1,

                email:
                  formData
                    .payer
                    .email,

                identificationType:
                  formData
                    .payer
                    ?.identification
                    ?.type ?? null,

                identificationNumber:
                  formData
                    .payer
                    ?.identification
                    ?.number ?? null,
              }),
          }
        );

      if (!response.ok) {

        const message =
          await readPaymentError(
            response,
            "O pagamento não pôde ser processado. Tente novamente."
          );

        /*
         * IMPORTANTE:
         * pagamento recusado é uma situação
         * normal do sistema, não um erro
         * técnico do frontend.
         *
         * Por isso não usamos console.error.
         */

        setErrorMessage(
          message
        );

        return;
      }

      await response.json();

      router.push(
        `/pagamento/sucesso/${order.id}`
      );

    } catch {

      setErrorMessage(
        "Não foi possível se comunicar com o servidor. Tente novamente."
      );

    } finally {

      setProcessing(false);
    }
  }

  // =========================
  // DÉBITO
  // =========================
  // Mantido para retomarmos
  // futuramente.
  // O checkout atual não
  // permite selecionar débito.
  // =========================

  async function handleDebitSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();

    if (!order) {
      return;
    }

    setProcessing(true);
    setErrorMessage("");

    try {

      if (
        !cardholderName.trim()
      ) {

        setErrorMessage(
          "Informe o nome do titular."
        );

        return;
      }

      if (
        !identificationNumber.trim()
      ) {

        setErrorMessage(
          "Informe o CPF."
        );

        return;
      }

      if (!email.trim()) {

        setErrorMessage(
          "Informe o e-mail."
        );

        return;
      }

      const cardToken: any =
        await createCardToken({
          cardholderName:
            cardholderName.trim(),

          identificationType:
            "CPF",

          identificationNumber:
            identificationNumber
              .replace(/\D/g, ""),
        });

      if (
        !cardToken ||
        !cardToken.id
      ) {

        setErrorMessage(
          "Não foi possível gerar o token do cartão."
        );

        return;
      }

      const response =
        await fetch(
          `http://localhost:8080/api/payments/${order.id}/card`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                token:
                  cardToken.id,

                paymentMethodId:
                  "debelo",

                installments: 1,

                email:
                  email.trim(),

                identificationType:
                  "CPF",

                identificationNumber:
                  identificationNumber
                    .replace(
                      /\D/g,
                      ""
                    ),
              }),
          }
        );

      if (!response.ok) {

        const message =
          await readPaymentError(
            response,
            "O pagamento no débito não pôde ser processado."
          );

        setErrorMessage(
          message
        );

        return;
      }

      await response.json();

      router.push(
        `/pagamento/sucesso/${order.id}`
      );

    } catch {

      setErrorMessage(
        "Não foi possível se comunicar com o servidor. Tente novamente."
      );

    } finally {

      setProcessing(false);
    }
  }

  // =========================
  // CARREGANDO
  // =========================

  if (loading) {
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

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="skeleton h-[520px] rounded-[28px]" />
            <div className="skeleton h-72 rounded-[28px]" />
          </div>
        </div>
      </main>
    );
  }

  // =========================
  // PEDIDO NÃO ENCONTRADO
  // =========================

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
            Não conseguimos localizar os dados deste pedido.
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

  // =========================
  // PUBLIC KEY
  // =========================

  if (!publicKey) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-5 py-10 text-foreground">
        <div className="w-full max-w-lg rounded-[28px] border border-primary/20 bg-card p-8">
          <p className="font-mono-brand text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Configuração
          </p>

          <h1 className="mt-2 font-display text-4xl tracking-tight">
            Pagamento indisponível
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            A chave pública do Mercado Pago não está configurada. Verifique o arquivo .env.local.
          </p>
        </div>
      </main>
    );
  }

  const isDebit =
    order.paymentMethod ===
    "DEBIT_CARD";

  const formatMoney = (
    value: number
  ) =>
    new Intl.NumberFormat(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    ).format(value);

  const fieldClass =
    "h-12 w-full rounded-xl border border-border bg-white/70 px-3 text-sm outline-none transition-colors focus:border-foreground";

  return (
    <main className="min-h-screen bg-background pb-16 font-body text-foreground antialiased selection:bg-butter">

      {/* HEADER */}

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

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">

        <button
          type="button"
          onClick={() =>
            router.push(
              `/pedido/${order.id}`
            )
          }
          className="font-mono-brand text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Voltar ao pedido
        </button>

        <p className="mt-7 font-mono-brand text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          (c) Pagamento
        </p>

        <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
              {isDebit
                ? "Pague no débito"
                : "Pague com cartão"}
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Preencha os dados do cartão para concluir o pedido com segurança.
            </p>
          </div>

          <p className="font-display text-4xl tracking-tight text-primary sm:text-5xl">
            {formatMoney(
              Number(
                order.total
              )
            )}
          </p>

        </div>

        {processing && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-butter/50 bg-butter/20 p-4">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />

            <div>
              <p className="font-bold">
                Processando pagamento
              </p>

              <p className="mt-0.5 text-sm text-muted-foreground">
                Aguarde enquanto confirmamos os dados do cartão.
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">

              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-primary">
                !
              </div>

              <div>
                <p className="font-bold text-primary">
                  Pagamento não aprovado
                </p>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {errorMessage}
                </p>

                <p className="mt-2 font-mono-brand text-[10px] uppercase tracking-wider text-muted-foreground">
                  Revise os dados ou tente outro cartão
                </p>
              </div>

            </div>
          </div>
        )}

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">

          {/* FORMULÁRIO */}

          <section className="rounded-[28px] border border-border bg-card p-5 shadow-[0_18px_60px_-30px] shadow-foreground/40 sm:p-7">

            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Dados do cartão
                </p>

                <h2 className="mt-1 font-display text-2xl tracking-tight">
                  {isDebit
                    ? "Cartão de débito"
                    : "Cartão de crédito"}
                </h2>
              </div>

              <span className="rounded-full bg-secondary px-3 py-1.5 font-mono-brand text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Mercado Pago
              </span>

            </div>

            {isDebit ? (

              <form
                onSubmit={
                  handleDebitSubmit
                }
                className="mt-6 space-y-4"
              >

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Número do cartão
                  </label>

                  <div className="flex h-12 items-center rounded-xl border border-border bg-white/70 px-3 transition-colors focus-within:border-foreground">
                    <div className="w-full">
                      <CardNumber
                        placeholder="Número do cartão"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Validade
                    </label>

                    <div className="flex h-12 items-center rounded-xl border border-border bg-white/70 px-3 transition-colors focus-within:border-foreground">
                      <div className="w-full">
                        <ExpirationDate
                          placeholder="MM/AA"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      CVV
                    </label>

                    <div className="flex h-12 items-center rounded-xl border border-border bg-white/70 px-3 transition-colors focus-within:border-foreground">
                      <div className="w-full">
                        <SecurityCode
                          placeholder="CVV"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Nome do titular
                  </label>

                  <input
                    type="text"
                    value={
                      cardholderName
                    }
                    onChange={(
                      event
                    ) =>
                      setCardholderName(
                        event.target.value
                      )
                    }
                    placeholder="Nome como está no cartão"
                    className={
                      fieldClass
                    }
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    CPF
                  </label>

                  <input
                    type="text"
                    value={
                      identificationNumber
                    }
                    onChange={(
                      event
                    ) =>
                      setIdentificationNumber(
                        event.target.value
                      )
                    }
                    placeholder="00000000000"
                    className={
                      fieldClass
                    }
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    E-mail
                  </label>

                  <input
                    type="email"
                    value={
                      email
                    }
                    onChange={(
                      event
                    ) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    placeholder="seu@email.com"
                    className={
                      fieldClass
                    }
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    processing
                  }
                  className="brand-button mt-2 w-full rounded-2xl px-5 py-3.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {processing
                    ? "Processando..."
                    : `Pagar ${formatMoney(
                        Number(
                          order.total
                        )
                      )}`}
                </button>

              </form>

            ) : (

              <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-white p-3 sm:p-4">

                <CardPayment
                  initialization={{
                    amount:
                      Number(
                        order.total
                      ),
                  }}
                  customization={{
                    paymentMethods: {
                      minInstallments:
                        1,
                      maxInstallments:
                        12,
                    },
                  }}
                  onSubmit={
                    handleCreditSubmit as any
                  }
                  onReady={() => {
                    // formulário pronto
                  }}
                  onError={() => {
                    setErrorMessage(
                      "Não foi possível carregar o formulário de pagamento."
                    );
                  }}
                />

              </div>

            )}

          </section>

          {/* RESUMO */}

          <aside className="lg:sticky lg:top-24">

            <div className="rounded-[28px] border-2 border-foreground bg-foreground p-5 text-cream shadow-[0_6px_0_0] shadow-primary/40">

              <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-cream/55">
                Resumo
              </p>

              <h2 className="mt-1 font-display text-2xl tracking-tight">
                Pedido #{order.id}
              </h2>

              <div className="mt-5 space-y-3 border-y border-cream/15 py-4">

                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-cream/65">
                    Forma de pagamento
                  </span>

                  <span className="text-right font-bold">
                    {isDebit
                      ? "Débito"
                      : "Crédito"}
                  </span>
                </div>

                {!isDebit && (
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-cream/65">
                      Parcelamento
                    </span>

                    <span className="font-bold">
                      Até 12x
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-cream/65">
                    Ambiente
                  </span>

                  <span className="font-bold">
                    Mercado Pago
                  </span>
                </div>

              </div>

              <div className="mt-5 flex items-end justify-between gap-4">

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

              <p className="mt-5 text-xs leading-5 text-cream/50">
                Os dados do cartão são processados diretamente pelo Mercado Pago. O PizzaSystem não armazena o número do seu cartão.
              </p>

            </div>

          </aside>

        </div>
      </div>
    </main>
  );
}

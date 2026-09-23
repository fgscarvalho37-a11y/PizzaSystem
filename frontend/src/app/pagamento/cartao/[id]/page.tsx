"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  CardPayment,
  CardNumber,
  ExpirationDate,
  SecurityCode,
  createCardToken,
  initMercadoPago,
} from "@mercadopago/sdk-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080";

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
  detail?: string;
};

type PublicKeyResponse = {
  publicKey?: string;
};

function formatMoney(
  value: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(value);
}

export default function CardPaymentPage() {

  const params =
    useParams();

  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const id =
    params.id as string;

  const tokenFromUrl =
    searchParams.get(
      "token"
    );

  const storeSlug =
    searchParams.get(
      "store"
    );

  const menuUrl =
    storeSlug
      ? `/cardapio/${encodeURIComponent(
          storeSlug
        )}`
      : "/";

  const [
    accessToken,
    setAccessToken,
  ] =
    useState<
      string | null
    >(null);

  const [
    tokenReady,
    setTokenReady,
  ] =
    useState(false);

  const [
    order,
    setOrder,
  ] =
    useState<
      Order | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    publicKeyLoading,
    setPublicKeyLoading,
  ] =
    useState(true);

  const [
    mercadoPagoReady,
    setMercadoPagoReady,
  ] =
    useState(false);

  const [
    publicKeyError,
    setPublicKeyError,
  ] =
    useState("");

  const [
    processing,
    setProcessing,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    debitCardholderName,
    setDebitCardholderName,
  ] =
    useState("");

  const [
    debitIdentificationNumber,
    setDebitIdentificationNumber,
  ] =
    useState("");

  const [
    debitEmail,
    setDebitEmail,
  ] =
    useState("");


  // =========================
  // TOKEN DE ACESSO DO PEDIDO
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

      setTokenReady(
        true
      );

      return;
    }

    const storedToken =
      sessionStorage.getItem(
        storageKey
      );

    setAccessToken(
      storedToken
    );

    setTokenReady(
      true
    );

  }, [
    id,
    tokenFromUrl,
  ]);

  // =========================
  // CARREGAR PEDIDO
  // =========================

  useEffect(() => {

    let mounted =
      true;

    async function loadOrder() {

      if (!tokenReady) {
        return;
      }

      if (!accessToken) {

        if (mounted) {
          setOrder(
            null
          );

          setLoading(
            false
          );
        }

        return;
      }

      try {

        setLoading(
          true
        );

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

        if (mounted) {

          setOrder(
            data
          );
        }

      } catch {

        if (mounted) {

          setOrder(
            null
          );

          setErrorMessage(
            "Não foi possível carregar o pedido."
          );
        }

      } finally {

        if (mounted) {

          setLoading(
            false
          );
        }
      }
    }

    void loadOrder();

    return () => {
      mounted =
        false;
    };

  }, [
    id,
    accessToken,
    tokenReady,
  ]);

  // =========================
  // PUBLIC KEY DINÂMICA
  // =========================

  useEffect(() => {

    let mounted =
      true;

    async function loadPublicKey() {

      if (
        !order ||
        !accessToken
      ) {
        return;
      }

      try {

        setPublicKeyLoading(
          true
        );

        setMercadoPagoReady(
          false
        );

        setPublicKeyError(
          ""
        );

        const response =
          await fetch(
            `${API_URL}/api/payments/${order.id}/public-key?token=${encodeURIComponent(
              accessToken
            )}`,
            {
              method:
                "GET",

              cache:
                "no-store",
            }
          );

        if (!response.ok) {

          let message =
            "O Mercado Pago não está disponível para esta loja.";

          try {

            const data =
              await response.json();

            if (
              typeof data
                ?.detail ===
                "string" &&
              data.detail
            ) {

              message =
                data.detail;

            } else if (
              typeof data
                ?.message ===
                "string" &&
              data.message
            ) {

              message =
                data.message;
            }

          } catch {
            // mantém mensagem padrão
          }

          throw new Error(
            message
          );
        }

        const data:
          PublicKeyResponse =
          await response.json();

        const publicKey =
          data.publicKey
            ?.trim();

        if (!publicKey) {

          throw new Error(
            "A conta Mercado Pago desta loja precisa ser reconectada."
          );
        }

        /*
         * A chave pública agora vem da conta
         * Mercado Pago vinculada à loja do pedido.
         *
         * Não usamos mais
         * NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY.
         */
        initMercadoPago(
          publicKey,
          {
            locale:
              "pt-BR",
          }
        );

        if (mounted) {

          setMercadoPagoReady(
            true
          );
        }

      } catch (
        error
      ) {

        if (mounted) {

          setMercadoPagoReady(
            false
          );

          setPublicKeyError(
            error instanceof
              Error
              ? error.message
              : "Não foi possível carregar a configuração do Mercado Pago."
          );
        }

      } finally {

        if (mounted) {

          setPublicKeyLoading(
            false
          );
        }
      }
    }

    void loadPublicKey();

    return () => {
      mounted =
        false;
    };

  }, [
    order,
    accessToken,
  ]);

  // =========================
  // ERRO DO BACKEND
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

      if (
        data.detail &&
        data.detail.trim()
      ) {

        return data.detail;
      }

    } catch {
      // usa fallback
    }

    return fallbackMessage;
  }

  // =========================
  // CARTÃO - CRÉDITO / DÉBITO
  // =========================

  async function handleCardSubmit(
    formData:
      CreditCardData
  ) {

    if (
      !order ||
      !accessToken
    ) {
      return;
    }

    setProcessing(
      true
    );

    setErrorMessage(
      ""
    );

    try {

      const response =
        await fetch(
          `${API_URL}/api/payments/${order.id}/card?token=${encodeURIComponent(
            accessToken
          )}`,
          {
            method:
              "POST",

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
                  order.paymentMethod ===
                  "DEBIT_CARD"
                    ? 1
                    : (
                        formData
                          .installments ??
                        1
                      ),

                email:
                  formData
                    .payer
                    .email,

                identificationType:
                  formData
                    .payer
                    ?.identification
                    ?.type ??
                  null,

                identificationNumber:
                  formData
                    .payer
                    ?.identification
                    ?.number ??
                  null,
              }),
          }
        );

      if (!response.ok) {

        const message =
          await readPaymentError(
            response,
            "O pagamento não pôde ser processado. Tente novamente."
          );

        setErrorMessage(
          message
        );

        return;
      }

      await response.json();

      const successUrl =
        `/pagamento/sucesso/${order.id}?token=${encodeURIComponent(
          accessToken
        )}` +
        (
          storeSlug
            ? `&store=${encodeURIComponent(
                storeSlug
              )}`
            : ""
        );

      router.push(
        successUrl
      );

    } catch {

      setErrorMessage(
        "Não foi possível se comunicar com o servidor. Tente novamente."
      );

    } finally {

      setProcessing(
        false
      );
    }
  }

  // =========================
  // DÉBITO - CORE METHODS
  // =========================

  async function handleDebitSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();

    if (
      !order ||
      !accessToken
    ) {
      return;
    }

    setProcessing(
      true
    );

    setErrorMessage(
      ""
    );

    try {

      if (
        !debitCardholderName.trim()
      ) {

        setErrorMessage(
          "Informe o nome do titular."
        );

        return;
      }

      const cpf =
        debitIdentificationNumber
          .replace(
            /\D/g,
            ""
          );

      if (
        cpf.length !== 11
      ) {

        setErrorMessage(
          "Informe um CPF válido."
        );

        return;
      }

      if (
        !debitEmail.trim()
      ) {

        setErrorMessage(
          "Informe o e-mail."
        );

        return;
      }

      const cardToken:
        any =
        await createCardToken({
          cardholderName:
            debitCardholderName
              .trim(),

          identificationType:
            "CPF",

          identificationNumber:
            cpf,
        });

      if (
        !cardToken ||
        !cardToken.id
      ) {

        setErrorMessage(
          "Não foi possível gerar o token do cartão de débito."
        );

        return;
      }

      /*
       * No Brasil, o cartão de débito de teste
       * documentado pelo Mercado Pago é Elo.
       *
       * Usamos os Secure Fields somente para
       * tokenizar o cartão e enviamos o meio
       * de pagamento como Elo + debit_card
       * no backend.
       */
      const response =
        await fetch(
          `${API_URL}/api/payments/${order.id}/card?token=${encodeURIComponent(
            accessToken
          )}`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                token:
                  cardToken.id,

                paymentMethodId:
                  "elo",

                installments:
                  1,

                email:
                  debitEmail.trim(),

                identificationType:
                  "CPF",

                identificationNumber:
                  cpf,
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
        `/pagamento/sucesso/${order.id}?token=${encodeURIComponent(
          accessToken
        )}` +
        (
          storeSlug
            ? `&store=${encodeURIComponent(
                storeSlug
              )}`
            : ""
        )
      );

    } catch {

      setErrorMessage(
        "Não foi possível processar o cartão de débito. Tente novamente."
      );

    } finally {

      setProcessing(
        false
      );
    }
  }

  // =========================
  // CARREGANDO
  // =========================

  if (
    !tokenReady ||
    loading ||
    (
      order &&
      publicKeyLoading
    )
  ) {

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

  // =========================
  // MERCADO PAGO INDISPONÍVEL
  // =========================

  if (
    !mercadoPagoReady
  ) {

    return (
      <main className="grid min-h-screen place-items-center bg-background px-5 py-10 text-foreground">

        <div className="w-full max-w-lg rounded-[28px] border border-primary/20 bg-card p-8">

          <p className="font-mono-brand text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Pagamento
          </p>

          <h1 className="mt-2 font-display text-4xl tracking-tight">
            Pagamento indisponível
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {publicKeyError ||
              "A conta Mercado Pago desta loja não está pronta para receber pagamentos com cartão."}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                menuUrl
              )
            }
            className="mt-6 w-full rounded-2xl border border-border bg-background px-5 py-3 text-sm font-bold transition-colors hover:bg-secondary"
          >
            Voltar ao cardápio
          </button>

        </div>

      </main>
    );
  }

  const isDebit =
    order.paymentMethod ===
    "DEBIT_CARD";


  return (
    <main className="min-h-screen bg-background pb-16 font-body text-foreground antialiased selection:bg-butter">

      {/* =========================
          HEADER
      ========================= */}

      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">

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

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">

        <button
          type="button"
          onClick={() =>
            router.push(
              `/pedido/${order.id}?token=${encodeURIComponent(
                accessToken ??
                ""
              )}` +
              (
                storeSlug
                  ? `&store=${encodeURIComponent(
                      storeSlug
                    )}`
                  : ""
              )
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

          {/* =========================
              FORMULÁRIO
          ========================= */}

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
                      debitCardholderName
                    }
                    onChange={(
                      event
                    ) =>
                      setDebitCardholderName(
                        event.target.value
                      )
                    }
                    placeholder="Nome como está no cartão"
                    className="h-12 w-full rounded-xl border border-border bg-white/70 px-3 text-sm outline-none transition-colors focus:border-foreground"
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
                      debitIdentificationNumber
                    }
                    onChange={(
                      event
                    ) =>
                      setDebitIdentificationNumber(
                        event.target.value
                      )
                    }
                    placeholder="00000000000"
                    className="h-12 w-full rounded-xl border border-border bg-white/70 px-3 text-sm outline-none transition-colors focus:border-foreground"
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
                      debitEmail
                    }
                    onChange={(
                      event
                    ) =>
                      setDebitEmail(
                        event.target.value
                      )
                    }
                    placeholder="seu@email.com"
                    className="h-12 w-full rounded-xl border border-border bg-white/70 px-3 text-sm outline-none transition-colors focus:border-foreground"
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

                      types: {
                        excluded: [
                          "debit_card",
                          "prepaid_card",
                        ],
                      },
                    },
                  } as any}
                  onSubmit={
                    handleCardSubmit as any
                  }
                  onReady={() => {
                    // formulário pronto
                  }}
                  onError={() => {

                    setErrorMessage(
                      "Não foi possível carregar o formulário de crédito."
                    );
                  }}
                />

              </div>

            )}

          </section>

          {/* =========================
              RESUMO
          ========================= */}

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
                    Processamento
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

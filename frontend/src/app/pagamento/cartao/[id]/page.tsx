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
      <main className="min-h-screen bg-gray-100 p-6">

        <p>
          Carregando pagamento...
        </p>

      </main>
    );
  }

  // =========================
  // PEDIDO NÃO ENCONTRADO
  // =========================

  if (!order) {

    return (
      <main className="min-h-screen bg-gray-100 p-6">

        <div className="mx-auto max-w-xl rounded-xl bg-white p-6 shadow-sm">

          <h1 className="text-2xl font-bold">
            Pedido não encontrado
          </h1>

          <button
            onClick={() =>
              router.push(
                "/cardapio"
              )
            }
            className="mt-5 rounded-lg bg-black px-5 py-3 font-semibold text-white"
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
      <main className="min-h-screen bg-gray-100 p-6">

        <div className="mx-auto max-w-xl rounded-xl bg-white p-6 shadow-sm">

          <h1 className="text-2xl font-bold text-red-600">
            Public Key não configurada
          </h1>

          <p className="mt-3 text-gray-600">
            Verifique o arquivo .env.local.
          </p>

        </div>

      </main>
    );
  }

  const isDebit =
    order.paymentMethod
      === "DEBIT_CARD";

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-6">

      <div className="mx-auto max-w-lg">

        <button
          type="button"
          onClick={() =>
            router.push(
              `/pedido/${order.id}`
            )
          }
          className="mb-4 text-sm font-semibold"
        >
          ← Voltar
        </button>

        <div className="rounded-2xl bg-white p-6 shadow-sm">

          <div className="text-center">

            <h1 className="text-2xl font-bold">

              {isDebit
                ? "Pagamento no débito"
                : "Pagamento no crédito"}

            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Pedido #{order.id}
            </p>

            <p className="mt-4 text-3xl font-bold">

              R${" "}

              {Number(
                order.total
              )
                .toFixed(2)
                .replace(
                  ".",
                  ","
                )}

            </p>

          </div>

          {/* PROCESSANDO */}

          {processing && (

            <div className="mt-5 rounded-lg bg-blue-50 p-3 text-center">

              <p className="text-sm font-semibold text-blue-700">
                Processando pagamento...
              </p>

            </div>
          )}

          {/* PAGAMENTO RECUSADO / ERRO */}

          {errorMessage && (

            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">

              <div className="flex items-start gap-3">

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-lg text-red-600">
                  !
                </div>

                <div>

                  <p className="font-semibold text-red-700">
                    Pagamento não aprovado
                  </p>

                  <p className="mt-1 text-sm leading-5 text-red-600">
                    {errorMessage}
                  </p>

                  <p className="mt-2 text-xs text-red-500">
                    Revise os dados ou tente outro cartão.
                  </p>

                </div>

              </div>

            </div>
          )}

          {/* =========================
              DÉBITO
              ========================= */}

          {isDebit ? (

            <form
              onSubmit={
                handleDebitSubmit
              }
              className="mt-6 space-y-4"
            >

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Número do cartão
                </label>

                <div className="flex h-12 items-center rounded-lg border border-gray-300 bg-white px-3">

                  <div className="w-full">

                    <CardNumber
                      placeholder="Número do cartão"
                    />

                  </div>

                </div>

              </div>

              <div className="grid grid-cols-2 gap-3">

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Validade
                  </label>

                  <div className="flex h-12 items-center rounded-lg border border-gray-300 bg-white px-3">

                    <div className="w-full">

                      <ExpirationDate
                        placeholder="MM/AA"
                      />

                    </div>

                  </div>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    CVV
                  </label>

                  <div className="flex h-12 items-center rounded-lg border border-gray-300 bg-white px-3">

                    <div className="w-full">

                      <SecurityCode
                        placeholder="CVV"
                      />

                    </div>

                  </div>

                </div>

              </div>

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
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
                  className="h-12 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-black"
                  required
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
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
                  className="h-12 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-black"
                  required
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
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
                  className="h-12 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-black"
                  required
                />

              </div>

              <button
                type="submit"
                disabled={
                  processing
                }
                className="mt-2 h-12 w-full rounded-lg bg-black px-5 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {processing
                  ? "Processando..."
                  : `Pagar R$ ${Number(
                      order.total
                    )
                      .toFixed(2)
                      .replace(
                        ".",
                        ","
                      )}`}

              </button>

            </form>

          ) : (

            /* =========================
                CRÉDITO
                ========================= */

            <div className="mt-6">

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

          <p className="mt-5 text-center text-xs text-gray-400">
            Os dados do cartão são processados com segurança pelo Mercado Pago.
          </p>

        </div>

      </div>

    </main>
  );
}
"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import AdminHeader from "@/components/AdminHeader";

type CashData = {
  date: string;
  totalRevenue: number;
  productRevenue: number;
  deliveryFees: number;
  orderCount: number;
  averageTicket: number;
  deliveredOrders: number;
  activeOrders: number;
  cancelledOrders: number;

  ordersByPaymentMethod: {
    PIX?: number;
    CREDIT_CARD?: number;
    DEBIT_CARD?: number;
  };

  revenueByPaymentMethod: {
    PIX?: number;
    CREDIT_CARD?: number;
    DEBIT_CARD?: number;
  };
};

type CashClosing = {
  id: number;
  date: string;
  closedAt: string;

  totalRevenue: number;
  productRevenue: number;
  deliveryFees: number;

  orderCount: number;
  averageTicket: number;

  pixRevenue: number;
  creditCardRevenue: number;
  debitCardRevenue: number;

  deliveredOrders: number;
  activeOrders: number;
  cancelledOrders: number;
};

type CashClosingStatus = {
  date: string;
  closed: boolean;
};

function formatMoney(
  value: number | undefined
) {
  return `R$ ${Number(
    value ?? 0
  )
    .toFixed(2)
    .replace(".", ",")}`;
}

function formatDate(
  value: string
) {
  if (!value) {
    return "";
  }

  const [year, month, day] =
    value.split("-");

  return `${day}/${month}/${year}`;
}

function formatDateTime(
  value: string
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  return date.toLocaleString(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  );
}

function getToday() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      now.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function AdminCaixaPage() {
  const today =
    getToday();

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(today);

  const [
    cash,
    setCash,
  ] =
    useState<CashData | null>(
      null
    );

  const [
    closing,
    setClosing,
  ] =
    useState<CashClosing | null>(
      null
    );

  const [
    isClosed,
    setIsClosed,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    closingCash,
    setClosingCash,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  // =========================
  // STATUS DO FECHAMENTO
  // =========================

  async function loadClosingStatus(
    date: string
  ) {
    const response =
      await fetch(
        `http://localhost:8080/api/cash-closings/status?date=${date}`,
        {
          cache: "no-store",
        }
      );

    if (!response.ok) {
      throw new Error(
        "Erro ao consultar fechamento"
      );
    }

    const status:
      CashClosingStatus =
      await response.json();

    setIsClosed(
      status.closed
    );

    if (status.closed) {
      await loadClosing(
        date
      );
    } else {
      setClosing(null);
    }
  }

  // =========================
  // CARREGAR FECHAMENTO SALVO
  // =========================

  async function loadClosing(
    date: string
  ) {
    const response =
      await fetch(
        `http://localhost:8080/api/cash-closings?date=${date}`,
        {
          cache: "no-store",
        }
      );

    if (!response.ok) {
      throw new Error(
        "Erro ao carregar fechamento"
      );
    }

    const data:
      CashClosing =
      await response.json();

    setClosing(data);
  }

  // =========================
  // CARREGAR CAIXA
  // =========================

  async function loadCash(
    date: string
  ) {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response =
        await fetch(
          `http://localhost:8080/api/cash?date=${date}`,
          {
            cache: "no-store",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Erro ao carregar caixa"
        );
      }

      const data:
        CashData =
        await response.json();

      setCash(data);

      await loadClosingStatus(
        date
      );

    } catch (error) {
      console.error(error);

      setErrorMessage(
        "Não foi possível carregar o caixa."
      );

    } finally {
      setLoading(false);
    }
  }

  // =========================
  // CARREGAMENTO INICIAL
  // =========================

  useEffect(() => {
    loadCash(today);
  }, []);

  // =========================
  // CONSULTAR DATA
  // =========================

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedDate) {
      setErrorMessage(
        "Selecione uma data."
      );

      return;
    }

    await loadCash(
      selectedDate
    );
  }

  // =========================
  // VOLTAR PARA HOJE
  // =========================

  async function showToday() {
    setSelectedDate(
      today
    );

    await loadCash(
      today
    );
  }

  // =========================
  // FECHAR CAIXA
  // =========================

  async function handleCloseCash() {
    if (!cash) {
      return;
    }

    if (isClosed) {
      return;
    }

    const confirmed =
      window.confirm(
        `Deseja realmente fechar o caixa de ${formatDate(
          cash.date
        )}?\n\nDepois de fechado, os valores ficarão registrados como o fechamento oficial desta data.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setClosingCash(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response =
        await fetch(
          `http://localhost:8080/api/cash-closings?date=${cash.date}`,
          {
            method: "POST",
          }
        );

      if (!response.ok) {
        let message =
          "Não foi possível fechar o caixa.";

        try {
          const errorData =
            await response.json();

          if (
            typeof errorData?.message ===
            "string"
          ) {
            message =
              errorData.message;
          }
        } catch {
          // Mantém mensagem padrão.
        }

        throw new Error(
          message
        );
      }

      const data:
        CashClosing =
        await response.json();

      setClosing(data);
      setIsClosed(true);

      setSuccessMessage(
        `Caixa de ${formatDate(
          data.date
        )} fechado com sucesso.`
      );

    } catch (error) {
      console.error(error);

      if (
        error instanceof Error
      ) {
        setErrorMessage(
          error.message
        );
      } else {
        setErrorMessage(
          "Não foi possível fechar o caixa."
        );
      }

    } finally {
      setClosingCash(false);
    }
  }

  // =========================
  // DADOS EXIBIDOS
  // =========================

  const pixCount =
    cash
      ?.ordersByPaymentMethod
      ?.PIX ?? 0;

  const creditCount =
    cash
      ?.ordersByPaymentMethod
      ?.CREDIT_CARD ?? 0;

  const debitCount =
    cash
      ?.ordersByPaymentMethod
      ?.DEBIT_CARD ?? 0;

  const pixRevenue =
    cash
      ?.revenueByPaymentMethod
      ?.PIX ?? 0;

  const creditRevenue =
    cash
      ?.revenueByPaymentMethod
      ?.CREDIT_CARD ?? 0;

  const debitRevenue =
    cash
      ?.revenueByPaymentMethod
      ?.DEBIT_CARD ?? 0;

  return (
    <main className="min-h-screen bg-gray-100">

      <AdminHeader
        title="Caixa"
      />

      <div className="mx-auto max-w-7xl p-6">

        {/* CABEÇALHO */}

        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Financeiro
          </p>

          <h2 className="mt-1 text-3xl font-bold text-gray-900">
            Caixa diário
          </h2>

          <p className="mt-2 max-w-3xl text-gray-600">
            Consulte o movimento financeiro e registre o fechamento oficial de cada dia.
          </p>

        </div>

        {/* FILTRO */}

        <form
          onSubmit={
            handleSubmit
          }
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >

          <div className="flex flex-col gap-4 md:flex-row md:items-end">

            <div className="flex-1">

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Data do caixa
              </label>

              <input
                type="date"
                value={
                  selectedDate
                }
                onChange={(
                  event
                ) =>
                  setSelectedDate(
                    event.target.value
                  )
                }
                className="h-12 w-full rounded-xl border border-gray-300 px-4 outline-none transition focus:border-black"
              />

            </div>

            <button
              type="button"
              onClick={
                showToday
              }
              disabled={
                loading
              }
              className="h-12 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Hoje
            </button>

            <button
              type="submit"
              disabled={
                loading
              }
              className="h-12 rounded-xl bg-black px-6 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Carregando..."
                : "Consultar"}
            </button>

          </div>

        </form>

        {/* ERRO */}

        {errorMessage && (

          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">

            <p className="font-semibold text-red-700">
              Atenção
            </p>

            <p className="mt-1 text-sm text-red-600">
              {errorMessage}
            </p>

          </div>

        )}

        {/* SUCESSO */}

        {successMessage && (

          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">

            <p className="font-semibold text-green-800">
              Caixa fechado
            </p>

            <p className="mt-1 text-sm text-green-700">
              {successMessage}
            </p>

          </div>

        )}

        {/* STATUS DA DATA */}

        {cash && (

          <div
            className={`mt-6 rounded-xl border p-4 ${
              isClosed
                ? "border-green-200 bg-green-50"
                : "border-blue-200 bg-blue-50"
            }`}
          >

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p
                  className={`text-sm font-semibold ${
                    isClosed
                      ? "text-green-800"
                      : "text-blue-800"
                  }`}
                >
                  Caixa de{" "}
                  {formatDate(
                    cash.date
                  )}
                </p>

                <p
                  className={`mt-1 text-sm ${
                    isClosed
                      ? "text-green-700"
                      : "text-blue-700"
                  }`}
                >
                  {isClosed
                    ? "Este caixa já possui um fechamento oficial registrado."
                    : "Caixa aberto para fechamento."}
                </p>

              </div>

              <span
                className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                  isClosed
                    ? "bg-green-200 text-green-800"
                    : "bg-blue-200 text-blue-800"
                }`}
              >
                {isClosed
                  ? "FECHADO"
                  : "ABERTO"}
              </span>

            </div>

          </div>

        )}

        {/* RESUMO */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-sm text-gray-500">
              Faturamento
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {formatMoney(
                cash?.totalRevenue
              )}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Total dos pedidos aprovados.
            </p>

          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-sm text-gray-500">
              Pedidos pagos
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {cash?.orderCount ?? 0}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Quantidade de pedidos aprovados.
            </p>

          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-sm text-gray-500">
              Ticket médio
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {formatMoney(
                cash?.averageTicket
              )}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Valor médio por pedido.
            </p>

          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-sm text-gray-500">
              Taxas de entrega
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {formatMoney(
                cash?.deliveryFees
              )}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Total cobrado em entregas.
            </p>

          </section>

        </div>

        {/* COMPOSIÇÃO */}

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            Composição
          </p>

          <h3 className="mt-1 text-xl font-bold text-gray-900">
            Origem do faturamento
          </h3>

          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <div className="rounded-xl bg-gray-50 p-5">

              <p className="text-sm text-gray-500">
                Produtos
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatMoney(
                  cash?.productRevenue
                )}
              </p>

            </div>

            <div className="rounded-xl bg-gray-50 p-5">

              <p className="text-sm text-gray-500">
                Entregas
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatMoney(
                  cash?.deliveryFees
                )}
              </p>

            </div>

            <div className="rounded-xl bg-black p-5 text-white">

              <p className="text-sm text-gray-300">
                Total
              </p>

              <p className="mt-2 text-2xl font-bold">
                {formatMoney(
                  cash?.totalRevenue
                )}
              </p>

            </div>

          </div>

        </section>

        {/* PAGAMENTOS */}

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            Recebimentos
          </p>

          <h3 className="mt-1 text-xl font-bold text-gray-900">
            Formas de pagamento
          </h3>

          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <div className="rounded-xl border border-gray-200 p-5">

              <div className="flex items-center justify-between gap-3">

                <p className="font-bold text-gray-900">
                  Pix
                </p>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  {pixCount}
                </span>

              </div>

              <p className="mt-4 text-2xl font-bold text-gray-900">
                {formatMoney(
                  pixRevenue
                )}
              </p>

            </div>

            <div className="rounded-xl border border-gray-200 p-5">

              <div className="flex items-center justify-between gap-3">

                <p className="font-bold text-gray-900">
                  Cartão de crédito
                </p>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                  {creditCount}
                </span>

              </div>

              <p className="mt-4 text-2xl font-bold text-gray-900">
                {formatMoney(
                  creditRevenue
                )}
              </p>

            </div>

            <div className="rounded-xl border border-gray-200 p-5">

              <div className="flex items-center justify-between gap-3">

                <p className="font-bold text-gray-900">
                  Cartão de débito
                </p>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                  {debitCount}
                </span>

              </div>

              <p className="mt-4 text-2xl font-bold text-gray-900">
                {formatMoney(
                  debitRevenue
                )}
              </p>

              <p className="mt-2 text-xs text-gray-400">
                Temporariamente indisponível no checkout.
              </p>

            </div>

          </div>

        </section>

        {/* OPERAÇÃO */}

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            Operação
          </p>

          <h3 className="mt-1 text-xl font-bold text-gray-900">
            Situação dos pedidos
          </h3>

          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <div className="rounded-xl bg-green-50 p-5">

              <p className="text-sm font-semibold text-green-700">
                Entregues
              </p>

              <p className="mt-2 text-3xl font-bold text-green-800">
                {cash?.deliveredOrders ?? 0}
              </p>

            </div>

            <div className="rounded-xl bg-blue-50 p-5">

              <p className="text-sm font-semibold text-blue-700">
                Em andamento
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-800">
                {cash?.activeOrders ?? 0}
              </p>

            </div>

            <div className="rounded-xl bg-red-50 p-5">

              <p className="text-sm font-semibold text-red-700">
                Cancelados
              </p>

              <p className="mt-2 text-3xl font-bold text-red-800">
                {cash?.cancelledOrders ?? 0}
              </p>

            </div>

          </div>

        </section>

        {/* FECHAMENTO */}

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            Fechamento
          </p>

          <h3 className="mt-1 text-xl font-bold text-gray-900">
            Fechamento de caixa
          </h3>

          {isClosed && closing ? (

            <div className="mt-5">

              <div className="rounded-xl border border-green-200 bg-green-50 p-5">

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                  <div>

                    <p className="font-bold text-green-800">
                      Caixa fechado
                    </p>

                    <p className="mt-1 text-sm text-green-700">
                      Fechado em{" "}
                      {formatDateTime(
                        closing.closedAt
                      )}
                    </p>

                  </div>

                  <span className="w-fit rounded-full bg-green-200 px-4 py-2 text-xs font-bold text-green-800">
                    FECHAMENTO #{closing.id}
                  </span>

                </div>

              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <div className="rounded-xl bg-gray-50 p-4">

                  <p className="text-sm text-gray-500">
                    Total fechado
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {formatMoney(
                      closing.totalRevenue
                    )}
                  </p>

                </div>

                <div className="rounded-xl bg-gray-50 p-4">

                  <p className="text-sm text-gray-500">
                    Produtos
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {formatMoney(
                      closing.productRevenue
                    )}
                  </p>

                </div>

                <div className="rounded-xl bg-gray-50 p-4">

                  <p className="text-sm text-gray-500">
                    Entregas
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {formatMoney(
                      closing.deliveryFees
                    )}
                  </p>

                </div>

                <div className="rounded-xl bg-gray-50 p-4">

                  <p className="text-sm text-gray-500">
                    Pedidos
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {closing.orderCount}
                  </p>

                </div>

              </div>

              <p className="mt-4 text-sm text-gray-500">
                Estes são os valores registrados no momento do fechamento e permanecem salvos no histórico.
              </p>

            </div>

          ) : (

            <div className="mt-5">

              <p className="max-w-3xl text-sm leading-6 text-gray-500">
                Ao fechar o caixa, o sistema registrará no banco o faturamento, pedidos, taxas de entrega e formas de pagamento desta data.
              </p>

              <button
                type="button"
                onClick={
                  handleCloseCash
                }
                disabled={
                  loading ||
                  closingCash ||
                  !cash
                }
                className="mt-5 rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {closingCash
                  ? "Fechando caixa..."
                  : "Fechar caixa"}
              </button>

            </div>

          )}

        </section>

      </div>

    </main>
  );
}
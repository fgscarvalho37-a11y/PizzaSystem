"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import AdminHeader from "@/components/AdminHeader";
import { adminFetch } from "@/lib/adminFetch";

type ReportData = {
  startDate: string;
  endDate: string;

  revenue: number;
  orderCount: number;
  averageTicket: number;

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

  ordersByStatus: {
    PENDING_PAYMENT?: number;
    RECEIVED?: number;
    PREPARING?: number;
    READY?: number;
    OUT_FOR_DELIVERY?: number;
    DELIVERED?: number;
    CANCELLED?: number;
  };
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

export default function AdminRelatoriosPage() {
  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  const firstDayOfMonth =
    `${today.slice(
      0,
      8
    )}01`;

  const [
    startDate,
    setStartDate,
  ] = useState(
    firstDayOfMonth
  );

  const [
    endDate,
    setEndDate,
  ] = useState(
    today
  );

  const [
    report,
    setReport,
  ] =
    useState<ReportData | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  // =========================
  // CARREGAR RELATÓRIO
  // =========================

  async function loadReport(
    start: string,
    end: string
  ) {
    try {
      setLoading(true);
      setErrorMessage("");

     const response =
  await adminFetch(
    `http://localhost:8080/api/reports?startDate=${start}&endDate=${end}`,
    {
      cache: "no-store",
      credentials: "include",
    }
  );

      if (!response.ok) {
        throw new Error(
          "Erro ao carregar relatório"
        );
      }

      const data:
        ReportData =
        await response.json();

      setReport(data);

    } catch {
      setErrorMessage(
        "Não foi possível carregar o relatório."
      );

    } finally {
      setLoading(false);
    }
  }

  // =========================
  // CARREGAMENTO INICIAL
  // =========================

  useEffect(() => {
    loadReport(
      firstDayOfMonth,
      today
    );
  }, []);

  // =========================
  // FILTRAR
  // =========================

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !startDate ||
      !endDate
    ) {
      setErrorMessage(
        "Informe o período."
      );

      return;
    }

    if (
      endDate <
      startDate
    ) {
      setErrorMessage(
        "A data final não pode ser anterior à data inicial."
      );

      return;
    }

    await loadReport(
      startDate,
      endDate
    );
  }

  // =========================
  // ATALHOS DE PERÍODO
  // =========================

  async function showToday() {
    setStartDate(today);
    setEndDate(today);

    await loadReport(
      today,
      today
    );
  }

  async function showMonth() {
    setStartDate(
      firstDayOfMonth
    );

    setEndDate(
      today
    );

    await loadReport(
      firstDayOfMonth,
      today
    );
  }

  // =========================
  // VALORES
  // =========================

  const pixCount =
    report
      ?.ordersByPaymentMethod
      ?.PIX ?? 0;

  const creditCount =
    report
      ?.ordersByPaymentMethod
      ?.CREDIT_CARD ?? 0;

  const debitCount =
    report
      ?.ordersByPaymentMethod
      ?.DEBIT_CARD ?? 0;

  const pixRevenue =
    report
      ?.revenueByPaymentMethod
      ?.PIX ?? 0;

  const creditRevenue =
    report
      ?.revenueByPaymentMethod
      ?.CREDIT_CARD ?? 0;

  const debitRevenue =
    report
      ?.revenueByPaymentMethod
      ?.DEBIT_CARD ?? 0;

  const delivered =
    report
      ?.ordersByStatus
      ?.DELIVERED ?? 0;

  const received =
    report
      ?.ordersByStatus
      ?.RECEIVED ?? 0;

  const preparing =
    report
      ?.ordersByStatus
      ?.PREPARING ?? 0;

  const ready =
    report
      ?.ordersByStatus
      ?.READY ?? 0;

  const outForDelivery =
    report
      ?.ordersByStatus
      ?.OUT_FOR_DELIVERY ?? 0;

  const cancelled =
    report
      ?.ordersByStatus
      ?.CANCELLED ?? 0;

  return (
    <main className="min-h-screen bg-gray-100">

      <AdminHeader
        title="Relatórios"
      />

      <div className="mx-auto max-w-7xl p-6">

        {/* =========================
            TÍTULO
            ========================= */}

        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Gestão
          </p>

          <h2 className="mt-1 text-3xl font-bold text-gray-900">
            Relatórios de vendas
          </h2>

          <p className="mt-2 max-w-3xl text-gray-600">
            Acompanhe faturamento, pedidos aprovados, ticket médio, formas de pagamento e andamento dos pedidos.
          </p>

        </div>

        {/* =========================
            FILTRO
            ========================= */}

        <form
          onSubmit={
            handleSubmit
          }
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div className="grid flex-1 gap-4 sm:grid-cols-2">

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Data inicial
                </label>

                <input
                  type="date"
                  value={
                    startDate
                  }
                  onChange={(
                    event
                  ) =>
                    setStartDate(
                      event.target.value
                    )
                  }
                  className="h-12 w-full rounded-xl border border-gray-300 px-4 outline-none transition focus:border-black"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Data final
                </label>

                <input
                  type="date"
                  value={
                    endDate
                  }
                  onChange={(
                    event
                  ) =>
                    setEndDate(
                      event.target.value
                    )
                  }
                  className="h-12 w-full rounded-xl border border-gray-300 px-4 outline-none transition focus:border-black"
                />

              </div>

            </div>

            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={
                  showToday
                }
                className="h-12 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Hoje
              </button>

              <button
                type="button"
                onClick={
                  showMonth
                }
                className="h-12 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Este mês
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
                  : "Aplicar período"}
              </button>

            </div>

          </div>

        </form>

        {/* =========================
            ERRO
            ========================= */}

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

        {/* =========================
            PERÍODO
            ========================= */}

        {report && (

          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">

            <p className="text-sm font-semibold text-blue-800">
              Período analisado
            </p>

            <p className="mt-1 text-sm text-blue-700">
              {formatDate(
                report.startDate
              )}{" "}
              até{" "}
              {formatDate(
                report.endDate
              )}
            </p>

          </div>

        )}

        {/* =========================
            RESUMO
            ========================= */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-sm text-gray-500">
              Faturamento
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {formatMoney(
                report?.revenue
              )}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Soma dos pedidos com pagamento aprovado.
            </p>

          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-sm text-gray-500">
              Pedidos aprovados
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {
                report?.orderCount ??
                0
              }
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Pedidos pagos dentro do período.
            </p>

          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-sm text-gray-500">
              Ticket médio
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {formatMoney(
                report?.averageTicket
              )}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Valor médio por pedido aprovado.
            </p>

          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-sm text-gray-500">
              Entregues
            </p>

            <p className="mt-2 text-3xl font-bold text-green-700">
              {delivered}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Pedidos concluídos no período.
            </p>

          </section>

        </div>

        {/* =========================
            FORMAS DE PAGAMENTO
            ========================= */}

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div>

            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Pagamentos
            </p>

            <h3 className="mt-1 text-xl font-bold text-gray-900">
              Formas de pagamento
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Quantidade e faturamento por meio de pagamento.
            </p>

          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">

            {/* PIX */}

            <div className="rounded-xl border border-gray-200 p-5">

              <div className="flex items-center justify-between gap-3">

                <p className="font-bold text-gray-900">
                  Pix
                </p>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  {pixCount}{" "}
                  {pixCount === 1
                    ? "pedido"
                    : "pedidos"}
                </span>

              </div>

              <p className="mt-4 text-2xl font-bold text-gray-900">
                {formatMoney(
                  pixRevenue
                )}
              </p>

            </div>

            {/* CRÉDITO */}

            <div className="rounded-xl border border-gray-200 p-5">

              <div className="flex items-center justify-between gap-3">

                <p className="font-bold text-gray-900">
                  Cartão de crédito
                </p>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                  {creditCount}{" "}
                  {creditCount === 1
                    ? "pedido"
                    : "pedidos"}
                </span>

              </div>

              <p className="mt-4 text-2xl font-bold text-gray-900">
                {formatMoney(
                  creditRevenue
                )}
              </p>

            </div>

            {/* DÉBITO */}

            <div className="rounded-xl border border-gray-200 p-5">

              <div className="flex items-center justify-between gap-3">

                <p className="font-bold text-gray-900">
                  Cartão de débito
                </p>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                  {debitCount}{" "}
                  {debitCount === 1
                    ? "pedido"
                    : "pedidos"}
                </span>

              </div>

              <p className="mt-4 text-2xl font-bold text-gray-900">
                {formatMoney(
                  debitRevenue
                )}
              </p>

              <p className="mt-2 text-xs text-gray-400">
                Débito temporariamente indisponível no checkout.
              </p>

            </div>

          </div>

        </section>

        {/* =========================
            STATUS
            ========================= */}

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div>

            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Operação
            </p>

            <h3 className="mt-1 text-xl font-bold text-gray-900">
              Status dos pedidos pagos
            </h3>

          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <div className="rounded-xl bg-blue-50 p-4">

              <p className="text-sm font-semibold text-blue-700">
                Recebidos
              </p>

              <p className="mt-1 text-2xl font-bold text-blue-800">
                {received}
              </p>

            </div>

            <div className="rounded-xl bg-yellow-50 p-4">

              <p className="text-sm font-semibold text-yellow-700">
                Preparando
              </p>

              <p className="mt-1 text-2xl font-bold text-yellow-800">
                {preparing}
              </p>

            </div>

            <div className="rounded-xl bg-green-50 p-4">

              <p className="text-sm font-semibold text-green-700">
                Prontos
              </p>

              <p className="mt-1 text-2xl font-bold text-green-800">
                {ready}
              </p>

            </div>

            <div className="rounded-xl bg-purple-50 p-4">

              <p className="text-sm font-semibold text-purple-700">
                Em entrega
              </p>

              <p className="mt-1 text-2xl font-bold text-purple-800">
                {outForDelivery}
              </p>

            </div>

            <div className="rounded-xl bg-emerald-50 p-4">

              <p className="text-sm font-semibold text-emerald-700">
                Entregues
              </p>

              <p className="mt-1 text-2xl font-bold text-emerald-800">
                {delivered}
              </p>

            </div>

            <div className="rounded-xl bg-red-50 p-4">

              <p className="text-sm font-semibold text-red-700">
                Cancelados
              </p>

              <p className="mt-1 text-2xl font-bold text-red-800">
                {cancelled}
              </p>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}
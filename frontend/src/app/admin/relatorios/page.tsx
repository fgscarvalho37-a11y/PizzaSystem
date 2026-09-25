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

type IconProps = {
  className?: string;
};

const API_URL = "";

function formatMoney(
  value: number | undefined
) {
  return Number(
    value ?? 0
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

function formatDate(
  value: string
) {
  if (!value) {
    return "";
  }

  const [
    year,
    month,
    day,
  ] = value.split("-");

  return `${day}/${month}/${year}`;
}

function CalendarIcon({
  className = "h-4 w-4",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
      />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M3 10h18" />
    </svg>
  );
}

function AlertIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />
      <path d="M12 8v5" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.2"
      />

      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReportSkeleton() {
  return (
    <div
      className="mt-6 space-y-6"
      role="status"
      aria-label="Carregando relatório"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map(
          (item) => (
            <div
              key={item}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="animate-pulse">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="mt-3 h-8 w-28 rounded bg-muted" />
                <div className="mt-3 h-3 w-36 rounded bg-muted" />
              </div>
            </div>
          )
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="animate-pulse">
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="h-24 rounded-xl bg-muted" />
            <div className="h-24 rounded-xl bg-muted" />
            <div className="h-24 rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
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

  async function loadReport(
    start: string,
    end: string
  ) {
    try {
      setLoading(true);
      setErrorMessage("");

      const response =
        await adminFetch(
          `${API_URL}/api/reports?startDate=${start}&endDate=${end}`,
          {
            cache: "no-store",
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

  useEffect(() => {
    loadReport(
      firstDayOfMonth,
      today
    );
  }, []);

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
    <main className="min-h-screen bg-background">

      <AdminHeader />

      <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 lg:px-8">

        <section className="border-b border-border pb-6">

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Gestão
          </p>

          <h1 className="mt-2 font-display text-4xl uppercase leading-none tracking-tight text-foreground">
            Relatórios
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Acompanhe faturamento, ticket médio, pagamentos e andamento dos pedidos.
          </p>

        </section>

        <form
          onSubmit={
            handleSubmit
          }
          className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-5"
        >

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">

            <div>

              <label
                htmlFor="report-start"
                className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
              >
                Data inicial
              </label>

              <input
                id="report-start"
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
                className="
                  h-11 w-full
                  rounded-xl
                  border border-input
                  bg-background
                  px-4
                  text-sm text-foreground
                  outline-none
                  transition
                  focus:border-primary
                  focus:ring-2
                  focus:ring-primary/10
                "
              />

            </div>

            <div>

              <label
                htmlFor="report-end"
                className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
              >
                Data final
              </label>

              <input
                id="report-end"
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
                className="
                  h-11 w-full
                  rounded-xl
                  border border-input
                  bg-background
                  px-4
                  text-sm text-foreground
                  outline-none
                  transition
                  focus:border-primary
                  focus:ring-2
                  focus:ring-primary/10
                "
              />

            </div>

            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={
                  showToday
                }
                disabled={
                  loading
                }
                className="
                  h-11 rounded-xl
                  border border-border
                  bg-background
                  px-4
                  text-sm font-bold
                  text-foreground
                  transition
                  hover:bg-muted
                  disabled:pointer-events-none
                  disabled:opacity-50
                "
              >
                Hoje
              </button>

              <button
                type="button"
                onClick={
                  showMonth
                }
                disabled={
                  loading
                }
                className="
                  h-11 rounded-xl
                  border border-border
                  bg-background
                  px-4
                  text-sm font-bold
                  text-foreground
                  transition
                  hover:bg-muted
                  disabled:pointer-events-none
                  disabled:opacity-50
                "
              >
                Este mês
              </button>

              <button
                type="submit"
                disabled={
                  loading
                }
                className="
                  inline-flex h-11
                  items-center
                  justify-center
                  gap-2 rounded-xl
                  bg-foreground
                  px-5
                  text-sm font-bold
                  text-background
                  transition
                  hover:opacity-90
                  disabled:pointer-events-none
                  disabled:opacity-50
                "
              >

                {loading && (
                  <Spinner />
                )}

                {loading
                  ? "Carregando"
                  : "Aplicar"}
              </button>

            </div>

          </div>

        </form>

        {errorMessage && (
          <div
            className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
            role="alert"
          >
            <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />

            <div>
              <p className="text-sm font-bold text-red-800">
                Não foi possível gerar o relatório
              </p>

              <p className="mt-1 text-sm text-red-700">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {report && !loading && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <CalendarIcon />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Período analisado
              </p>

              <p className="mt-0.5 text-sm font-bold text-foreground">
                {formatDate(
                  report.startDate
                )}{" "}
                —{" "}
                {formatDate(
                  report.endDate
                )}
              </p>
            </div>

          </div>
        )}

        {loading ? (
          <ReportSkeleton />

        ) : (
          <>
            <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

              <div className="rounded-2xl border border-border bg-primary p-5 text-primary-foreground">

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary-foreground/70">
                  Faturamento
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight">
                  {formatMoney(
                    report?.revenue
                  )}
                </p>

                <p className="mt-2 text-xs leading-5 text-primary-foreground/70">
                  Pagamentos aprovados no período.
                </p>

              </div>

              <div className="rounded-2xl border border-border bg-card p-5">

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Pedidos pagos
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                  {report?.orderCount ??
                    0}
                </p>

                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Pedidos aprovados no período.
                </p>

              </div>

              <div className="rounded-2xl border border-border bg-card p-5">

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Ticket médio
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                  {formatMoney(
                    report?.averageTicket
                  )}
                </p>

                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Valor médio por pedido aprovado.
                </p>

              </div>

              <div className="rounded-2xl border border-border bg-card p-5">

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Entregues
                </p>

                <div className="mt-2 flex items-end justify-between">

                  <p className="text-3xl font-bold tracking-tight text-emerald-700">
                    {delivered}
                  </p>

                  <span className="mb-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />

                </div>

                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Pedidos concluídos no período.
                </p>

              </div>

            </section>

            <section className="mt-6 rounded-2xl border border-border bg-card p-5">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Pagamentos
                </p>

                <h2 className="mt-1 text-xl font-bold text-foreground">
                  Formas de pagamento
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Quantidade de pedidos e faturamento por meio de pagamento.
                </p>

              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">

                <div className="rounded-xl border border-border bg-background p-4">

                  <div className="flex items-center justify-between gap-3">

                    <p className="font-bold text-foreground">
                      Pix
                    </p>

                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                      {pixCount}{" "}
                      {pixCount === 1
                        ? "pedido"
                        : "pedidos"}
                    </span>

                  </div>

                  <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">
                    {formatMoney(
                      pixRevenue
                    )}
                  </p>

                </div>

                <div className="rounded-xl border border-border bg-background p-4">

                  <div className="flex items-center justify-between gap-3">

                    <p className="font-bold text-foreground">
                      Cartão de crédito
                    </p>

                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                      {creditCount}{" "}
                      {creditCount === 1
                        ? "pedido"
                        : "pedidos"}
                    </span>

                  </div>

                  <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">
                    {formatMoney(
                      creditRevenue
                    )}
                  </p>

                </div>

                <div className="rounded-xl border border-border bg-background p-4">

                  <div className="flex items-center justify-between gap-3">

                    <p className="font-bold text-foreground">
                      Cartão de débito
                    </p>

                    <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                      {debitCount}{" "}
                      {debitCount === 1
                        ? "pedido"
                        : "pedidos"}
                    </span>

                  </div>

                  <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">
                    {formatMoney(
                      debitRevenue
                    )}
                  </p>

                  <p className="mt-2 text-xs text-muted-foreground">
                    Temporariamente indisponível no checkout.
                  </p>

                </div>

              </div>

            </section>

            <section className="mt-6 rounded-2xl border border-border bg-card p-5">

              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Operação
              </p>

              <h2 className="mt-1 text-xl font-bold text-foreground">
                Status dos pedidos pagos
              </h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">

                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                    Recebidos
                  </p>

                  <p className="mt-2 text-2xl font-bold text-blue-800">
                    {received}
                  </p>

                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">
                    Preparando
                  </p>

                  <p className="mt-2 text-2xl font-bold text-amber-800">
                    {preparing}
                  </p>

                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                    Prontos
                  </p>

                  <p className="mt-2 text-2xl font-bold text-emerald-800">
                    {ready}
                  </p>

                </div>

                <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">

                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700">
                    Em entrega
                  </p>

                  <p className="mt-2 text-2xl font-bold text-violet-800">
                    {outForDelivery}
                  </p>

                </div>

                <div className="rounded-xl border border-green-200 bg-green-50 p-4">

                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-green-700">
                    Entregues
                  </p>

                  <p className="mt-2 text-2xl font-bold text-green-800">
                    {delivered}
                  </p>

                </div>

                <div className="rounded-xl border border-red-200 bg-red-50 p-4">

                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-700">
                    Cancelados
                  </p>

                  <p className="mt-2 text-2xl font-bold text-red-800">
                    {cancelled}
                  </p>

                </div>

              </div>

            </section>
          </>
        )}

      </div>

    </main>
  );
}
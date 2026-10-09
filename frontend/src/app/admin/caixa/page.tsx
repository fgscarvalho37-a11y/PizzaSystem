"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import AdminHeader from "@/components/AdminHeader";
import { useLanguage } from "@/i18n/LanguageProvider";
import { adminFetch } from "@/lib/adminFetch";
import { formatStoreMoney } from "@/lib/storeIntl";
import { downloadSimplePdf } from "@/lib/simplePdf";

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
    PAYPAL?: number;
    CASH?: number;
    OTHER?: number;
  };

  ordersByFulfillmentType?: {
    DELIVERY?: number;
    PICKUP?: number;
  };

  ordersByPaymentTiming?: {
    ONLINE?: number;
    ON_PICKUP?: number;
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

type IconProps = {
  className?: string;
};

const API_URL = "";

/* =========================
   FORMATADORES
========================= */

function formatMoney(
  value: number | undefined
) {
  return formatStoreMoney(
    value
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

function formatDateTime(
  value: string
) {
  if (!value) {
    return "";
  }

  return new Date(
    value
  ).toLocaleString(
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
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

/* =========================
   ÍCONES
========================= */

function CalendarIcon({
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

function CheckIcon({
  className = "h-5 w-5",
}: IconProps) {
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
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function LockIcon({
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
      <rect
        x="5"
        y="10"
        width="14"
        height="11"
        rx="2"
      />

      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
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

/* =========================
   SKELETON
========================= */

function CashSkeleton() {
  return (
    <div
      className="mt-6 space-y-6"
      role="status"
      aria-label="Carregando caixa"
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

                <div className="mt-3 h-8 w-32 rounded bg-muted" />

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

/* =========================
   PÁGINA
========================= */

export default function AdminCaixaPage() {
  const { text } = useLanguage();
  const today =
    getToday();

  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState(
      today
    );

  const [
    cash,
    setCash,
  ] =
    useState<
      CashData | null
    >(null);

  const [
    closing,
    setClosing,
  ] =
    useState<
      CashClosing | null
    >(null);

  const [
    isClosed,
    setIsClosed,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    closingCash,
    setClosingCash,
  ] =
    useState(false);

  const [
    confirmOpen,
    setConfirmOpen,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");

  async function loadClosingStatus(
    date: string
  ) {
    const response =
      await adminFetch(
        `${API_URL}/api/cash-closings/status?date=${date}`,
        {
          cache:
            "no-store",
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

    if (
      status.closed
    ) {
      await loadClosing(
        date
      );

    } else {
      setClosing(null);
    }
  }

  async function loadClosing(
    date: string
  ) {
    const response =
      await adminFetch(
        `${API_URL}/api/cash-closings?date=${date}`,
        {
          cache:
            "no-store",
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

  async function loadCash(
    date: string
  ) {
    try {
      setLoading(true);

      setErrorMessage("");
      setSuccessMessage("");

      const response =
        await adminFetch(
          `${API_URL}/api/cash?date=${date}`,
          {
            cache:
              "no-store",
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

    } catch {
      setErrorMessage(
        "Não foi possível carregar o caixa."
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCash(
      today
    );
  }, []);

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !selectedDate
    ) {
      setErrorMessage(
        "Selecione uma data."
      );

      return;
    }

    await loadCash(
      selectedDate
    );
  }

  async function showToday() {
    setSelectedDate(
      today
    );

    await loadCash(
      today
    );
  }

  function requestCloseCash() {
    if (
      !cash ||
      isClosed ||
      loading
    ) {
      return;
    }

    setConfirmOpen(
      true
    );
  }

  async function handleCloseCash() {
    if (
      !cash ||
      isClosed
    ) {
      return;
    }

    try {
      setClosingCash(
        true
      );

      setErrorMessage("");
      setSuccessMessage("");

      const response =
        await adminFetch(
          `${API_URL}/api/cash-closings?date=${cash.date}`,
          {
            method:
              "POST",
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

      setConfirmOpen(
        false
      );

    } catch (error) {
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
      setClosingCash(
        false
      );
    }
  }

  function downloadCashReport() {
    if (!cash) {
      return;
    }

    const lines = [
      `Data: ${formatDate(
        cash.date
      )}`,
      `Situacao: ${isClosed ? "Fechado" : "Aberto"}`,
      closing?.closedAt
        ? `Fechado em: ${formatDateTime(
            closing.closedAt
          )}`
        : "",
      "",
      `Faturamento: ${formatMoney(
        cash.totalRevenue
      )}`,
      `Receita de produtos: ${formatMoney(
        cash.productRevenue
      )}`,
      `Taxas de entrega: ${formatMoney(
        cash.deliveryFees
      )}`,
      `Pedidos pagos: ${cash.orderCount}`,
      `Ticket medio: ${formatMoney(
        cash.averageTicket
      )}`,
      "",
      "FORMAS DE PAGAMENTO",
      `PIX: ${pixCount} pedido(s) - ${formatMoney(
        pixRevenue
      )}`,
      `Credito: ${creditCount} pedido(s) - ${formatMoney(
        creditRevenue
      )}`,
      `Debito: ${debitCount} pedido(s) - ${formatMoney(
        debitRevenue
      )}`,
      "",
      "MODALIDADES",
      `Entrega: ${deliveryCount}`,
      `Retirada: ${pickupCount}`,
      `Pagamento online: ${onlineCount}`,
      `Pagamento na retirada: ${payAtPickupCount}`,
      "",
      "STATUS DOS PEDIDOS",
      `Entregues/concluidos: ${cash.deliveredOrders}`,
      `Em andamento: ${cash.activeOrders}`,
      `Cancelados: ${cash.cancelledOrders}`,
      "",
      "Relatorio gerado pelo PizzaSystem.",
    ].filter(
      Boolean
    ) as string[];

    downloadSimplePdf(
      `caixa-${cash.date}.pdf`,
      "PizzaSystem - Relatorio de Caixa",
      lines
    );
  }

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

  const deliveryCount =
    cash
      ?.ordersByFulfillmentType
      ?.DELIVERY ?? 0;

  const pickupCount =
    cash
      ?.ordersByFulfillmentType
      ?.PICKUP ?? 0;

  const onlineCount =
    cash
      ?.ordersByPaymentTiming
      ?.ONLINE ?? 0;

  const payAtPickupCount =
    cash
      ?.ordersByPaymentTiming
      ?.ON_PICKUP ?? 0;

  return (
    <main className="min-h-screen bg-background">

      <AdminHeader />

      <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 lg:px-8">

        <section className="border-b border-border pb-6">

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            {text("Financeiro", "Finance")}
          </p>

          <h1 className="mt-2 font-display text-4xl uppercase leading-none tracking-tight text-foreground">
            Caixa
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {text("Consulte o movimento financeiro e registre o fechamento oficial de cada dia.", "Review cash flow and record the official close of each day.")}
          </p>

        </section>

        <form
          onSubmit={
            handleSubmit
          }
          className="mt-6 rounded-2xl border border-border bg-card p-4"
        >

          <div className="flex flex-col gap-3 md:flex-row md:items-end">

            <div className="flex-1">

              <label
                htmlFor="cash-date"
                className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
              >
                {text("Data do caixa", "Register date")}
              </label>

              <input
                id="cash-date"
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
                className="
                  h-11 w-full
                  rounded-xl
                  border border-input
                  bg-background px-4
                  text-sm text-foreground
                  outline-none transition
                  focus:border-primary
                  focus:ring-2
                  focus:ring-primary/10
                "
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
              type="submit"
              disabled={
                loading
              }
              className="
                inline-flex h-11
                items-center justify-center
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
                ? "Consultando"
                : "Consultar"}

            </button>

          </div>

        </form>

        {errorMessage && (
          <div
            className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
            role="alert"
          >
            <AlertIcon className="mt-0.5 shrink-0 text-red-700" />

            <div>
              <p className="text-sm font-bold text-red-800">
                {text("Não foi possível concluir", "Could not complete")}
              </p>

              <p className="mt-1 text-sm text-red-700">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {successMessage && (
          <div
            className="mt-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
            role="status"
          >
            <CheckIcon className="mt-0.5 shrink-0 text-emerald-700" />

            <div>

              <p className="text-sm font-bold text-emerald-800">
                {text("Caixa fechado", "Register closed")}
              </p>

              <p className="mt-1 text-sm text-emerald-700">
                {successMessage}
              </p>

            </div>
          </div>
        )}

        {loading ? (
          <CashSkeleton />

        ) : cash ? (
          <>

            <section
              className={[
                "mt-5 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between",
                isClosed
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-blue-200 bg-blue-50",
              ].join(
                " "
              )}
            >

              <div className="flex items-center gap-3">

                <div
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    isClosed
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-blue-100 text-blue-700",
                  ].join(
                    " "
                  )}
                >
                  {isClosed ? (
                    <LockIcon />
                  ) : (
                    <CalendarIcon />
                  )}
                </div>

                <div>

                  <p
                    className={[
                      "text-sm font-bold",
                      isClosed
                        ? "text-emerald-800"
                        : "text-blue-800",
                    ].join(
                      " "
                    )}
                  >
                    Caixa de{" "}
                    {formatDate(
                      cash.date
                    )}
                  </p>

                  <p
                    className={[
                      "mt-0.5 text-sm",
                      isClosed
                        ? "text-emerald-700"
                        : "text-blue-700",
                    ].join(
                      " "
                    )}
                  >
                    {isClosed
                      ? "Fechamento oficial registrado."
                      : "Disponível para fechamento."}
                  </p>

                </div>

              </div>

              <span
                className={[
                  "w-fit rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
                  isClosed
                    ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                    : "border-blue-200 bg-blue-100 text-blue-800",
                ].join(
                  " "
                )}
              >
                {isClosed
                  ? "Fechado"
                  : "Aberto"}
              </span>

            </section>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={
                  downloadCashReport
                }
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-bold text-foreground transition hover:bg-muted"
              >
                {text("Baixar PDF do caixa", "Download cash register PDF")}
              </button>
            </div>

            <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

              <div className="rounded-2xl border border-primary/20 bg-primary p-5 text-primary-foreground">

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary-foreground/70">
                  {text("Faturamento", "Revenue")}
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight">
                  {formatMoney(
                    cash.totalRevenue
                  )}
                </p>

                <p className="mt-2 text-xs text-primary-foreground/70">
                  {text("Pedidos aprovados", "Approved orders")}
                </p>

              </div>

              <div className="rounded-2xl border border-border bg-card p-5">

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  {text("Pedidos pagos", "Paid orders")}
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                  {cash.orderCount}
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  {text("Pedidos aprovados", "Approved orders")}
                </p>

              </div>

              <div className="rounded-2xl border border-border bg-card p-5">

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  {text("Ticket médio", "Average order value")}
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                  {formatMoney(
                    cash.averageTicket
                  )}
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  {text("Média por pedido", "Average per order")}
                </p>

              </div>

              <div className="rounded-2xl border border-border bg-card p-5">

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  {text("Taxas de entrega", "Delivery fees")}
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                  {formatMoney(
                    cash.deliveryFees
                  )}
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  {text("Total em entregas", "Total delivery revenue")}
                </p>

              </div>

            </section>

            <section className="mt-6 rounded-2xl border border-border bg-card p-5">

              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                {text("Composição", "Breakdown")}
              </p>

              <h2 className="mt-1 text-xl font-bold text-foreground">
                {text("Origem do faturamento", "Revenue sources")}
              </h2>

              <div className="mt-5 grid gap-3 md:grid-cols-3">

                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-sm text-muted-foreground">
                    {text("Produtos", "Products")}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {formatMoney(
                      cash.productRevenue
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-sm text-muted-foreground">
                    {text("Entregas", "Deliveries")}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {formatMoney(
                      cash.deliveryFees
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-foreground p-4 text-background">
                  <p className="text-sm opacity-70">
                    Total
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    {formatMoney(
                      cash.totalRevenue
                    )}
                  </p>
                </div>

              </div>

            </section>

            <section className="mt-6 rounded-2xl border border-border bg-card p-5">

              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                {text("Modalidades", "Fulfillment methods")}
              </p>

              <h2 className="mt-1 text-xl font-bold text-foreground">
                {text("Entrega e retirada", "Delivery and pickup")}
              </h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                    {text("Entrega", "Delivery")}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-blue-800">
                    {deliveryCount}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">
                    {text("Retirada", "Pickup")}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-amber-800">
                    {pickupCount}
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                    {text("Online", "Online")}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-emerald-800">
                    {onlineCount}
                  </p>
                </div>

                <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-700">
                    {text("Na retirada", "At pickup")}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-orange-800">
                    {payAtPickupCount}
                  </p>
                </div>

              </div>

            </section>

            <section className="mt-6 rounded-2xl border border-border bg-card p-5">

              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                {text("Recebimentos", "Payments received")}
              </p>

              <h2 className="mt-1 text-xl font-bold text-foreground">
                {text("Formas de pagamento", "Payment methods")}
              </h2>

              <div className="mt-5 grid gap-3 md:grid-cols-3">

                <div className="rounded-xl border border-border bg-background p-4">

                  <div className="flex items-center justify-between">

                    <p className="font-bold text-foreground">
                      Pix
                    </p>

                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                      {pixCount}
                    </span>

                  </div>

                  <p className="mt-4 text-2xl font-bold text-foreground">
                    {formatMoney(
                      pixRevenue
                    )}
                  </p>

                </div>

                <div className="rounded-xl border border-border bg-background p-4">

                  <div className="flex items-center justify-between">

                    <p className="font-bold text-foreground">
                      {text("Cartão de crédito", "Credit card")}
                    </p>

                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                      {creditCount}
                    </span>

                  </div>

                  <p className="mt-4 text-2xl font-bold text-foreground">
                    {formatMoney(
                      creditRevenue
                    )}
                  </p>

                </div>

                <div className="rounded-xl border border-border bg-background p-4">

                  <div className="flex items-center justify-between">

                    <p className="font-bold text-foreground">
                      {text("Cartão de débito", "Debit card")}
                    </p>

                    <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                      {debitCount}
                    </span>

                  </div>

                  <p className="mt-4 text-2xl font-bold text-foreground">
                    {formatMoney(
                      debitRevenue
                    )}
                  </p>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {text("Indisponível no checkout.", "Unavailable at checkout.")}
                  </p>

                </div>

              </div>

            </section>

            <section className="mt-6 rounded-2xl border border-border bg-card p-5">

              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                {text("Operação", "Operations")}
              </p>

              <h2 className="mt-1 text-xl font-bold text-foreground">
                {text("Situação dos pedidos", "Order statuses")}
              </h2>

              <div className="mt-5 grid gap-3 md:grid-cols-3">

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                    {text("Entregues", "Delivered")}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-emerald-800">
                    {cash.deliveredOrders}
                  </p>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                    {text("Em andamento", "In progress")}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-blue-800">
                    {cash.activeOrders}
                  </p>
                </div>

                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-700">
                    {text("Cancelados", "Canceled")}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-red-800">
                    {cash.cancelledOrders}
                  </p>
                </div>

              </div>

            </section>

            <section className="mt-6 rounded-2xl border border-border bg-card p-5">

              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                {text("Fechamento", "Closeout")}
              </p>

              <h2 className="mt-1 text-xl font-bold text-foreground">
                {text("Fechamento de caixa", "Cash register closeout")}
              </h2>

              {isClosed &&
              closing ? (

                <div className="mt-5">

                  <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-3">

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                        <LockIcon />
                      </div>

                      <div>

                        <p className="font-bold text-emerald-800">
                          {text("Caixa fechado", "Register closed")}
                        </p>

                        <p className="mt-0.5 text-sm text-emerald-700">
                          {formatDateTime(
                            closing.closedAt
                          )}
                        </p>

                      </div>

                    </div>

                    <span className="w-fit rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      #{closing.id}
                    </span>

                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs text-muted-foreground">
                        Total
                      </p>

                      <p className="mt-1 text-lg font-bold text-foreground">
                        {formatMoney(
                          closing.totalRevenue
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs text-muted-foreground">
                        {text("Produtos", "Products")}
                      </p>

                      <p className="mt-1 text-lg font-bold text-foreground">
                        {formatMoney(
                          closing.productRevenue
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs text-muted-foreground">
                        {text("Entregas", "Deliveries")}
                      </p>

                      <p className="mt-1 text-lg font-bold text-foreground">
                        {formatMoney(
                          closing.deliveryFees
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs text-muted-foreground">
                        {text("Pedidos", "Orders")}
                      </p>

                      <p className="mt-1 text-lg font-bold text-foreground">
                        {closing.orderCount}
                      </p>
                    </div>

                  </div>

                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {text("Os valores acima são o registro oficial salvo no momento do fechamento.", "The values above are the official record saved at closeout.")}
                  </p>

                </div>

              ) : (

                <div className="mt-5">

                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    O fechamento registra definitivamente o faturamento, pedidos,
                    entregas e formas de pagamento desta data.
                  </p>

                  <button
                    type="button"
                    onClick={
                      requestCloseCash
                    }
                    disabled={
                      loading ||
                      closingCash ||
                      !cash
                    }
                    className="
                      mt-4 inline-flex h-11
                      items-center justify-center
                      gap-2 rounded-xl
                      bg-primary
                      px-5
                      text-sm font-bold
                      text-primary-foreground
                      transition
                      hover:-translate-y-0.5
                      hover:shadow-sm
                      disabled:pointer-events-none
                      disabled:opacity-50
                    "
                  >
                    <LockIcon className="h-4 w-4" />

                    {text("Fechar caixa", "Close register")}
                  </button>

                </div>

              )}

            </section>

          </>
        ) : null}

      </div>

      {confirmOpen &&
        cash && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
            role="presentation"
            onMouseDown={(
              event
            ) => {
              if (
                event.target ===
                event.currentTarget &&
                !closingCash
              ) {
                setConfirmOpen(
                  false
                );
              }
            }}
          >

            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="close-cash-title"
              className="w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-2xl"
            >

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <LockIcon />
              </div>

              <h2
                id="close-cash-title"
                className="mt-4 text-xl font-bold text-foreground"
              >
                {text("Fechar caixa?", "Close the cash register?")}
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Você está prestes a registrar o fechamento oficial de{" "}
                <strong className="text-foreground">
                  {formatDate(
                    cash.date
                  )}
                </strong>.
              </p>

              <div className="mt-4 rounded-xl border border-border bg-card p-4">

                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {text("Total do caixa", "Register total")}
                </p>

                <p className="mt-1 text-2xl font-bold text-foreground">
                  {formatMoney(
                    cash.totalRevenue
                  )}
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  {cash.orderCount}{" "}
                  {cash.orderCount ===
                  1
                    ? "pedido pago"
                    : "pedidos pagos"}
                </p>

              </div>

              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Depois do fechamento, esses valores ficarão registrados como
                referência oficial para esta data.
              </p>

              <div className="mt-5 flex justify-end gap-2">

                <button
                  type="button"
                  disabled={
                    closingCash
                  }
                  onClick={() =>
                    setConfirmOpen(
                      false
                    )
                  }
                  className="
                    h-10 rounded-xl
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
                  {text("Cancelar", "Cancel")}
                </button>

                <button
                  type="button"
                  disabled={
                    closingCash
                  }
                  onClick={
                    handleCloseCash
                  }
                  className="
                    inline-flex h-10
                    items-center justify-center
                    gap-2 rounded-xl
                    bg-primary
                    px-4
                    text-sm font-bold
                    text-primary-foreground
                    transition
                    hover:opacity-90
                    disabled:pointer-events-none
                    disabled:opacity-50
                  "
                >

                  {closingCash && (
                    <Spinner />
                  )}

                  {closingCash
                    ? "Fechando"
                    : "Confirmar fechamento"}

                </button>

              </div>

            </section>

          </div>
        )}

    </main>
  );
}

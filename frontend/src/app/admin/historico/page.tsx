"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminHeader from "@/components/AdminHeader";
import { adminFetch } from "@/lib/adminFetch";

type OrderStatus =
  | "PENDING_PAYMENT"
  | "RECEIVED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

type PaymentStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "REFUNDED";

type PaymentMethod =
  | "PIX"
  | "CREDIT_CARD"
  | "DEBIT_CARD";

type Product = {
  id: number;
  name: string;
};

type OrderItem = {
  id: number;
  quantity: number;
  unitPrice: number;
  observation: string | null;
  crustName: string | null;
  crustPrice: number | null;
  product: Product;
};

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

  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;

  createdAt: string;
};

type OrderWithItems =
  Order & {
    items: OrderItem[];
  };

type HistoryFilter =
  | "ALL"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED";

type IconProps = {
  className?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080";

/* =========================
   HELPERS
========================= */

function currency(
  value: number
) {
  return Number(value).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

function orderStatusName(
  status: OrderStatus
) {
  switch (status) {
    case "DELIVERED":
      return "Entregue";

    case "CANCELLED":
      return "Cancelado";

    case "PENDING_PAYMENT":
      return "Aguardando pagamento";

    case "RECEIVED":
      return "Recebido";

    case "PREPARING":
      return "Preparando";

    case "READY":
      return "Pronto";

    case "OUT_FOR_DELIVERY":
      return "Saiu para entrega";

    default:
      return status;
  }
}

function paymentStatusName(
  status: PaymentStatus
) {
  switch (status) {
    case "APPROVED":
      return "Aprovado";

    case "PENDING":
      return "Pendente";

    case "REJECTED":
      return "Recusado";

    case "CANCELLED":
      return "Cancelado";

    case "REFUNDED":
      return "Estornado";

    default:
      return status;
  }
}

function paymentMethodName(
  method: PaymentMethod
) {
  switch (method) {
    case "PIX":
      return "Pix";

    case "CREDIT_CARD":
      return "Cartão de crédito";

    case "DEBIT_CARD":
      return "Cartão de débito";

    default:
      return method;
  }
}

function orderStatusClass(
  status: OrderStatus
) {
  switch (status) {
    case "DELIVERED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function paymentStatusClass(
  status: PaymentStatus
) {
  switch (status) {
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";

    case "CANCELLED":
      return "border-border bg-muted text-muted-foreground";

    case "REFUNDED":
      return "border-violet-200 bg-violet-50 text-violet-700";

    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

/* =========================
   ÍCONES
========================= */

function SearchIcon({
  className = "h-5 w-5",
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
      <circle
        cx="11"
        cy="11"
        r="7"
      />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function RefreshIcon({
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
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 4v7h-7" />
    </svg>
  );
}

function ChevronIcon({
  className = "h-4 w-4",
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ReceiptIcon({
  className = "h-6 w-6",
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
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
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
      strokeWidth="1.9"
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

function HistorySkeleton() {
  return (
    <div
      className="mt-6 space-y-3"
      role="status"
      aria-label="Carregando histórico"
    >
      {[1, 2, 3].map(
        (item) => (
          <div
            key={item}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="animate-pulse">

              <div className="flex items-center justify-between gap-6">

                <div className="flex flex-1 gap-6">
                  <div className="h-8 w-16 rounded-lg bg-muted" />
                  <div className="hidden h-8 w-40 rounded-lg bg-muted sm:block" />
                  <div className="hidden h-8 w-28 rounded-lg bg-muted lg:block" />
                </div>

                <div className="h-8 w-28 rounded-full bg-muted" />

              </div>

              <div className="mt-5 h-px bg-border" />

              <div className="mt-4 h-9 w-28 rounded-lg bg-muted" />

            </div>
          </div>
        )
      )}
    </div>
  );
}

/* =========================
   PÁGINA
========================= */

export default function AdminHistoricoPage() {
  const [
    orders,
    setOrders,
  ] =
    useState<
      OrderWithItems[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    filter,
    setFilter,
  ] =
    useState<HistoryFilter>(
      "ALL"
    );

  const [
    expandedId,
    setExpandedId,
  ] =
    useState<
      number | null
    >(null);

  /* =========================
     CARREGAR HISTÓRICO
  ========================= */

  async function loadHistory(
    manual = false
  ) {
    try {
      if (manual) {
        setRefreshing(true);
      }

      setErrorMessage("");

      const response =
        await adminFetch(
          `${API_URL}/api/orders`,
          {
            cache: "no-store",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Erro ao carregar pedidos"
        );
      }

      const data:
        Order[] =
        await response.json();

      const historyOrders =
        data.filter(
          (order) =>
            order.status ===
              "DELIVERED" ||
            order.status ===
              "CANCELLED" ||
            order.paymentStatus ===
              "REJECTED"
        );

      const ordersWithItems =
        await Promise.all(
          historyOrders.map(
            async (order) => {
              try {
                const itemsResponse =
                  await adminFetch(
                    `${API_URL}/api/orders/${order.id}/items`,
                    {
                      cache:
                        "no-store",
                    }
                  );

                if (
                  !itemsResponse.ok
                ) {
                  return {
                    ...order,
                    items: [],
                  };
                }

                const items:
                  OrderItem[] =
                  await itemsResponse.json();

                return {
                  ...order,
                  items,
                };

              } catch {
                return {
                  ...order,
                  items: [],
                };
              }
            }
          )
        );

      setOrders(
        ordersWithItems
      );

    } catch {
      setErrorMessage(
        "Não foi possível carregar o histórico."
      );

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  /* =========================
     FILTROS
  ========================= */

  const filteredOrders =
    useMemo(() => {
      const normalized =
        search
          .trim()
          .toLowerCase();

      return orders.filter(
        (order) => {

          if (
            filter ===
              "DELIVERED" &&
            order.status !==
              "DELIVERED"
          ) {
            return false;
          }

          if (
            filter ===
              "CANCELLED" &&
            order.status !==
              "CANCELLED"
          ) {
            return false;
          }

          if (
            filter ===
              "REJECTED" &&
            order.paymentStatus !==
              "REJECTED"
          ) {
            return false;
          }

          if (!normalized) {
            return true;
          }

          const searchable =
            [
              String(
                order.id
              ),

              order.customerName ??
                "",

              order.customerPhone ??
                "",

              order.neighborhood ??
                "",
            ]
              .join(" ")
              .toLowerCase();

          return searchable.includes(
            normalized
          );
        }
      );
    }, [
      orders,
      search,
      filter,
    ]);

  /* =========================
     RESUMO
  ========================= */

  const deliveredCount =
    orders.filter(
      (order) =>
        order.status ===
        "DELIVERED"
    ).length;

  const cancelledCount =
    orders.filter(
      (order) =>
        order.status ===
        "CANCELLED"
    ).length;

  const rejectedCount =
    orders.filter(
      (order) =>
        order.paymentStatus ===
        "REJECTED"
    ).length;

  const deliveredRevenue =
    orders
      .filter(
        (order) =>
          order.status ===
            "DELIVERED" &&
          order.paymentStatus ===
            "APPROVED"
      )
      .reduce(
        (
          total,
          order
        ) =>
          total +
          Number(
            order.total
          ),
        0
      );

  return (
    <main className="min-h-screen bg-background">

      <AdminHeader />

      <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 lg:px-8">

        {/* CABEÇALHO */}

        <section className="border-b border-border pb-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Operação
              </p>

              <h1 className="mt-2 font-display text-4xl uppercase leading-none tracking-tight text-foreground">
                Histórico
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Consulte pedidos entregues, cancelados e pagamentos recusados.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                loadHistory(true)
              }
              disabled={
                refreshing
              }
              className="
                inline-flex h-10
                items-center justify-center
                gap-2 rounded-full
                border border-border
                bg-card px-4
                text-sm font-bold
                text-foreground
                transition
                hover:-translate-y-0.5
                hover:border-foreground/20
                hover:shadow-sm
                disabled:pointer-events-none
                disabled:opacity-50
              "
            >
              {refreshing ? (
                <Spinner />
              ) : (
                <RefreshIcon />
              )}

              {refreshing
                ? "Atualizando"
                : "Atualizar"}
            </button>

          </div>

        </section>

        {/* RESUMO */}

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-border bg-card p-4">

            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Entregues
            </p>

            <div className="mt-2 flex items-end justify-between">

              <p className="text-2xl font-bold text-emerald-700">
                {deliveredCount}
              </p>

              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

            </div>

          </div>

          <div className="rounded-2xl border border-border bg-card p-4">

            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Cancelados
            </p>

            <div className="mt-2 flex items-end justify-between">

              <p className="text-2xl font-bold text-red-700">
                {cancelledCount}
              </p>

              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />

            </div>

          </div>

          <div className="rounded-2xl border border-border bg-card p-4">

            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Recusados
            </p>

            <p className="mt-2 text-2xl font-bold text-foreground">
              {rejectedCount}
            </p>

          </div>

          <div className="rounded-2xl border border-border bg-card p-4">

            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Valor entregue
            </p>

            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {currency(
                deliveredRevenue
              )}
            </p>

          </div>

        </section>

        {/* ERRO */}

        {errorMessage && (
          <div
            className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
            role="alert"
          >
            <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />

            <div>
              <p className="text-sm font-bold text-red-800">
                Não foi possível carregar
              </p>

              <p className="mt-1 text-sm text-red-700">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* FILTROS */}

        <section className="mt-6 rounded-2xl border border-border bg-card p-4">

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">

            <div>

              <label
                htmlFor="history-search"
                className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
              >
                Buscar
              </label>

              <div className="relative">

                <SearchIcon
                  className="
                    pointer-events-none
                    absolute left-4 top-1/2
                    h-5 w-5
                    -translate-y-1/2
                    text-muted-foreground
                  "
                />

                <input
                  id="history-search"
                  type="search"
                  value={
                    search
                  }
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Pedido, cliente, telefone ou bairro..."
                  className="
                    h-11 w-full
                    rounded-xl
                    border border-input
                    bg-background
                    pl-11 pr-4
                    text-sm text-foreground
                    outline-none
                    transition
                    placeholder:text-muted-foreground
                    focus:border-primary
                    focus:ring-2
                    focus:ring-primary/10
                  "
                />

              </div>

            </div>

            <div>

              <label
                htmlFor="history-filter"
                className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
              >
                Tipo
              </label>

              <select
                id="history-filter"
                value={
                  filter
                }
                onChange={(
                  event
                ) =>
                  setFilter(
                    event.target
                      .value as
                      HistoryFilter
                  )
                }
                className="
                  h-11 w-full
                  rounded-xl
                  border border-input
                  bg-background px-4
                  text-sm text-foreground
                  outline-none
                  transition
                  focus:border-primary
                  focus:ring-2
                  focus:ring-primary/10
                "
              >
                <option value="ALL">
                  Todos
                </option>

                <option value="DELIVERED">
                  Entregues
                </option>

                <option value="CANCELLED">
                  Cancelados
                </option>

                <option value="REJECTED">
                  Pagamento recusado
                </option>
              </select>

            </div>

          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">

            <p className="text-sm text-muted-foreground">

              <strong className="font-bold text-foreground">
                {filteredOrders.length}
              </strong>{" "}

              {filteredOrders.length ===
              1
                ? "registro encontrado"
                : "registros encontrados"}

            </p>

            {(search ||
              filter !==
                "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter(
                    "ALL"
                  );
                }}
                className="text-sm font-bold text-primary transition hover:opacity-70"
              >
                Limpar filtros
              </button>
            )}

          </div>

        </section>

        {/* LISTA */}

        {loading ? (
          <HistorySkeleton />

        ) : filteredOrders.length ===
          0 ? (

          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">

            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <ReceiptIcon />
            </div>

            <h2 className="mt-4 text-lg font-bold text-foreground">
              Nenhum registro encontrado
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Pedidos entregues, cancelados ou recusados aparecerão aqui.
            </p>

          </div>

        ) : (

          <section className="mt-6 space-y-3">

            {filteredOrders.map(
              (order) => {
                const createdAt =
                  new Date(
                    order.createdAt
                  );

                const date =
                  createdAt.toLocaleDateString(
                    "pt-BR"
                  );

                const time =
                  createdAt.toLocaleTimeString(
                    "pt-BR",
                    {
                      hour:
                        "2-digit",
                      minute:
                        "2-digit",
                    }
                  );

                const expanded =
                  expandedId ===
                  order.id;

                return (
                  <article
                    key={
                      order.id
                    }
                    className="overflow-hidden rounded-2xl border border-border bg-card"
                  >

                    {/* RESUMO */}

                    <div className="p-5">

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        <div className="flex flex-wrap gap-x-8 gap-y-4">

                          <div>

                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                              Pedido
                            </p>

                            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                              #{order.id}
                            </p>

                          </div>

                          <div className="min-w-40">

                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                              Cliente
                            </p>

                            <p className="mt-1 font-bold text-foreground">
                              {order.customerName}
                            </p>

                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {order.customerPhone}
                            </p>

                          </div>

                          <div>

                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                              Data
                            </p>

                            <p className="mt-1 font-semibold text-foreground">
                              {date}
                            </p>

                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {time}
                            </p>

                          </div>

                        </div>

                        <div className="flex flex-wrap items-center gap-2">

                          <span
                            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${orderStatusClass(
                              order.status
                            )}`}
                          >
                            {orderStatusName(
                              order.status
                            )}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${paymentStatusClass(
                              order.paymentStatus
                            )}`}
                          >
                            {paymentStatusName(
                              order.paymentStatus
                            )}
                          </span>

                          <div className="ml-0 min-w-28 sm:ml-3 sm:text-right">

                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                              Total
                            </p>

                            <p className="mt-1 text-xl font-bold tracking-tight text-foreground">
                              {currency(
                                order.total
                              )}
                            </p>

                          </div>

                        </div>

                      </div>

                      <div className="mt-5 flex items-center border-t border-border pt-4">

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(
                              expanded
                                ? null
                                : order.id
                            )
                          }
                          aria-expanded={
                            expanded
                          }
                          className="
                            inline-flex h-9
                            items-center gap-2
                            rounded-lg
                            border border-border
                            bg-background
                            px-3.5
                            text-sm font-bold
                            text-foreground
                            transition
                            hover:bg-muted
                          "
                        >
                          {expanded
                            ? "Ocultar"
                            : "Detalhes"}

                          <ChevronIcon
                            className={`h-4 w-4 transition-transform ${
                              expanded
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </button>

                        <span className="ml-auto text-sm font-medium text-muted-foreground">
                          {paymentMethodName(
                            order.paymentMethod
                          )}
                        </span>

                      </div>

                    </div>

                    {/* DETALHES */}

                    {expanded && (
                      <div className="border-t border-border bg-muted/30 p-5">

                        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">

                          {/* ITENS */}

                          <section>

                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                              Itens do pedido
                            </p>

                            <div className="mt-3 space-y-2">

                              {order.items.length ===
                              0 ? (
                                <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                                  Nenhum item encontrado.
                                </div>

                              ) : (

                                order.items.map(
                                  (item) => (
                                    <div
                                      key={
                                        item.id
                                      }
                                      className="rounded-xl border border-border bg-card p-4"
                                    >

                                      <div className="flex justify-between gap-4">

                                        <div>

                                          <p className="font-bold text-foreground">
                                            {item.quantity}x{" "}
                                            {
                                              item
                                                .product
                                                .name
                                            }
                                          </p>

                                          <p className="mt-1 text-sm text-muted-foreground">
                                            {currency(
                                              item.unitPrice
                                            )}{" "}
                                            cada
                                          </p>

                                        </div>

                                        <p className="font-bold text-foreground">
                                          {currency(
                                            Number(
                                              item.unitPrice
                                            ) *
                                              item.quantity
                                          )}
                                        </p>

                                      </div>

                                      {item.crustName && (
                                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">

                                          <div className="flex flex-wrap items-center justify-between gap-2">

                                            <div>

                                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
                                                Borda recheada
                                              </p>

                                              <p className="mt-1 text-sm font-bold text-amber-900">
                                                {item.crustName}
                                              </p>

                                            </div>

                                            {item.crustPrice !==
                                              null && (
                                              <p className="text-xs font-bold text-amber-700">
                                                +{" "}
                                                {currency(
                                                  item.crustPrice
                                                )}
                                              </p>
                                            )}

                                          </div>

                                        </div>
                                      )}

                                      {item.observation && (
                                        <div className="mt-3 rounded-lg border border-primary/15 bg-primary/5 p-3">

                                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                                            Observação
                                          </p>

                                          <p className="mt-1 text-sm leading-6 text-foreground">
                                            {item.observation}
                                          </p>

                                        </div>
                                      )}

                                    </div>
                                  )
                                )
                              )}

                            </div>

                          </section>

                          {/* ENTREGA */}

                          <section>

                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                              Entrega
                            </p>

                            <div className="mt-3 rounded-xl border border-border bg-card p-4">

                              <p className="font-bold text-foreground">
                                {order.street},{" "}
                                {order.number}
                              </p>

                              <p className="mt-1 text-sm text-muted-foreground">
                                {order.neighborhood}
                              </p>

                              {order.complement && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {order.complement}
                                </p>
                              )}

                              <div className="mt-4 border-t border-border pt-4">

                                <p className="text-xs text-muted-foreground">
                                  Taxa de entrega
                                </p>

                                <p className="mt-1 font-bold text-foreground">
                                  {currency(
                                    order.deliveryFee
                                  )}
                                </p>

                              </div>

                            </div>

                          </section>

                        </div>

                      </div>
                    )}

                  </article>
                );
              }
            )}

          </section>
        )}

      </div>

    </main>
  );
}
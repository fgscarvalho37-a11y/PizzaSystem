"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import AdminHeader from "@/components/AdminHeader";
import { adminFetch } from "@/lib/adminFetch";

/* =========================
   TIPOS
========================= */

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
  city?: string | null;
  neighborhood: string;
  complement: string;

  deliveryFee: number;
  deliveryDistanceKm?: number | null;
  deliveryRouteProvider?: string | null;
  deliveryRouteUrl?: string | null;
  total: number;

  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;

  paymentExternalId?: string | null;

  createdAt: string;
};

type OrderWithItems =
  Order & {
    items: OrderItem[];
  };

type IconProps = {
  className?: string;
};

const API_URL = "";

/* =========================
   FILTROS
========================= */

const orderStatuses: {
  value: OrderStatus | "ALL";
  label: string;
}[] = [
  {
    value: "ALL",
    label: "Todos",
  },
  {
    value: "PENDING_PAYMENT",
    label: "Aguardando pagamento",
  },
  {
    value: "RECEIVED",
    label: "Recebido",
  },
  {
    value: "PREPARING",
    label: "Preparando",
  },
  {
    value: "READY",
    label: "Pronto",
  },
  {
    value: "OUT_FOR_DELIVERY",
    label: "Saiu para entrega",
  },
  {
    value: "DELIVERED",
    label: "Entregue",
  },
  {
    value: "CANCELLED",
    label: "Cancelado",
  },
];

const paymentStatuses: {
  value: PaymentStatus | "ALL";
  label: string;
}[] = [
  {
    value: "ALL",
    label: "Todos",
  },
  {
    value: "PENDING",
    label: "Pendente",
  },
  {
    value: "APPROVED",
    label: "Aprovado",
  },
  {
    value: "REJECTED",
    label: "Recusado",
  },
  {
    value: "CANCELLED",
    label: "Cancelado",
  },
  {
    value: "REFUNDED",
    label: "Estornado",
  },
];

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

    case "DELIVERED":
      return "Entregue";

    case "CANCELLED":
      return "Cancelado";

    default:
      return status;
  }
}

function orderStatusClass(
  status: OrderStatus
) {
  switch (status) {
    case "PENDING_PAYMENT":
      return "border-border bg-muted text-muted-foreground";

    case "RECEIVED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "PREPARING":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "READY":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "OUT_FOR_DELIVERY":
      return "border-violet-200 bg-violet-50 text-violet-700";

    case "DELIVERED":
      return "border-green-200 bg-green-50 text-green-700";

    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function paymentStatusName(
  status: PaymentStatus
) {
  switch (status) {
    case "PENDING":
      return "Pendente";

    case "APPROVED":
      return "Aprovado";

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

/* =========================
   ÍCONES
========================= */

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

function KitchenIcon({
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
      <path d="M5 11h14" />
      <path d="M7 11a5 5 0 0 1 10 0" />
      <path d="M4 15h16" />
    </svg>
  );
}

function EmptyIcon({
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
      <path d="M9 9h6" />
      <path d="M9 13h4" />
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

function OrdersSkeleton() {
  return (
    <div
      className="mt-6 space-y-3"
      aria-label="Carregando pedidos"
      role="status"
    >
      {[1, 2, 3].map(
        (item) => (
          <div
            key={item}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="animate-pulse">
              <div className="flex items-center justify-between gap-6">
                <div className="flex flex-1 items-center gap-6">
                  <div className="h-8 w-16 rounded-lg bg-muted" />

                  <div className="hidden h-8 w-44 rounded-lg bg-muted sm:block" />

                  <div className="hidden h-8 w-28 rounded-lg bg-muted lg:block" />
                </div>

                <div className="h-8 w-28 rounded-full bg-muted" />
              </div>

              <div className="mt-5 h-px bg-border" />

              <div className="mt-4 flex gap-3">
                <div className="h-9 w-28 rounded-lg bg-muted" />
                <div className="h-9 w-28 rounded-lg bg-muted" />
              </div>
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

export default function AdminPedidosPage() {
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
    orderStatusFilter,
    setOrderStatusFilter,
  ] =
    useState<
      OrderStatus | "ALL"
    >("ALL");

  const [
    paymentStatusFilter,
    setPaymentStatusFilter,
  ] =
    useState<
      PaymentStatus | "ALL"
    >("ALL");

  const [
    expandedId,
    setExpandedId,
  ] =
    useState<
      number | null
    >(null);

  /* =========================
     CARREGAR PEDIDOS
  ========================= */

  async function loadOrders(
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

      const data: Order[] =
        await response.json();

      const ordersWithItems =
        await Promise.all(
          data.map(
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
        "Não foi possível carregar os pedidos."
      );

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  /* =========================
     FILTROS
  ========================= */

  const filteredOrders =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return orders.filter(
        (order) => {
          if (
            orderStatusFilter !==
              "ALL" &&
            order.status !==
              orderStatusFilter
          ) {
            return false;
          }

          if (
            paymentStatusFilter !==
              "ALL" &&
            order.paymentStatus !==
              paymentStatusFilter
          ) {
            return false;
          }

          if (
            !normalizedSearch
          ) {
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
              order.street ??
                "",
            ]
              .join(" ")
              .toLowerCase();

          return searchable.includes(
            normalizedSearch
          );
        }
      );
    }, [
      orders,
      search,
      orderStatusFilter,
      paymentStatusFilter,
    ]);

  /* =========================
     RESUMOS
  ========================= */

  const approvedCount =
    orders.filter(
      (order) =>
        order.paymentStatus ===
        "APPROVED"
    ).length;

  const pendingCount =
    orders.filter(
      (order) =>
        order.paymentStatus ===
        "PENDING"
    ).length;

  const rejectedCount =
    orders.filter(
      (order) =>
        order.paymentStatus ===
        "REJECTED"
    ).length;

  const activeCount =
    orders.filter(
      (order) =>
        [
          "RECEIVED",
          "PREPARING",
          "READY",
          "OUT_FOR_DELIVERY",
        ].includes(
          order.status
        )
    ).length;

  /* =========================
     RENDER
  ========================= */

  return (
    <main className="min-h-screen bg-background">

      <AdminHeader />

      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">

        {/* CABEÇALHO */}

        <section className="border-b border-border pb-7">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Operação
              </p>

              <h1 className="mt-2 font-display text-4xl uppercase leading-none tracking-tight text-foreground sm:text-5xl">
                Pedidos
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Acompanhe pedidos, pagamentos,
                clientes e andamento da operação.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                loadOrders(true)
              }
              disabled={
                refreshing
              }
              className="
                inline-flex h-11
                items-center justify-center
                gap-2 rounded-full
                border border-border
                bg-card px-5
                text-sm font-bold
                text-foreground
                transition
                hover:-translate-y-0.5
                hover:border-foreground/20
                hover:shadow-sm
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-ring
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

        {/* MÉTRICAS */}

        <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-border bg-card p-5">

            <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Total
            </p>

            <div className="mt-3 flex items-end justify-between gap-4">

              <p className="text-3xl font-bold tracking-tight text-foreground">
                {orders.length}
              </p>

              <span className="text-xs font-medium text-muted-foreground">
                pedidos
              </span>

            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">

            <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Em andamento
            </p>

            <div className="mt-3 flex items-end justify-between gap-4">

              <p className="text-3xl font-bold tracking-tight text-blue-700">
                {activeCount}
              </p>

              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />

            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">

            <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Pagos
            </p>

            <div className="mt-3 flex items-end justify-between gap-4">

              <p className="text-3xl font-bold tracking-tight text-emerald-700">
                {approvedCount}
              </p>

              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">

            <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Atenção
            </p>

            <div className="mt-3 flex items-end justify-between gap-4">

              <p className="text-3xl font-bold tracking-tight text-foreground">
                {pendingCount +
                  rejectedCount}
              </p>

              <span className="text-xs font-medium text-muted-foreground">
                pendentes / recusados
              </span>

            </div>
          </div>

        </section>

        {/* ERRO */}

        {errorMessage && (
          <div
            className="
              mt-6 rounded-2xl
              border border-red-200
              bg-red-50 p-4
            "
            role="alert"
          >
            <p className="text-sm font-bold text-red-800">
              Não foi possível atualizar os pedidos
            </p>

            <p className="mt-1 text-sm text-red-700">
              {errorMessage}
            </p>
          </div>
        )}

        {/* FILTROS */}

        <section className="mt-7 rounded-2xl border border-border bg-card p-4 sm:p-5">

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">

            <div>
              <label
                htmlFor="search-order"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground"
              >
                Buscar pedido
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
                  id="search-order"
                  type="search"
                  value={search}
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Número, cliente, telefone, bairro..."
                  className="
                    h-12 w-full
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
                htmlFor="order-status"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground"
              >
                Status
              </label>

              <select
                id="order-status"
                value={
                  orderStatusFilter
                }
                onChange={(
                  event
                ) =>
                  setOrderStatusFilter(
                    event.target
                      .value as
                      | OrderStatus
                      | "ALL"
                  )
                }
                className="
                  h-12 w-full
                  rounded-xl
                  border border-input
                  bg-background px-4
                  text-sm text-foreground
                  outline-none transition
                  focus:border-primary
                  focus:ring-2
                  focus:ring-primary/10
                "
              >
                {orderStatuses.map(
                  (status) => (
                    <option
                      key={
                        status.value
                      }
                      value={
                        status.value
                      }
                    >
                      {status.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="payment-status"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground"
              >
                Pagamento
              </label>

              <select
                id="payment-status"
                value={
                  paymentStatusFilter
                }
                onChange={(
                  event
                ) =>
                  setPaymentStatusFilter(
                    event.target
                      .value as
                      | PaymentStatus
                      | "ALL"
                  )
                }
                className="
                  h-12 w-full
                  rounded-xl
                  border border-input
                  bg-background px-4
                  text-sm text-foreground
                  outline-none transition
                  focus:border-primary
                  focus:ring-2
                  focus:ring-primary/10
                "
              >
                {paymentStatuses.map(
                  (status) => (
                    <option
                      key={
                        status.value
                      }
                      value={
                        status.value
                      }
                    >
                      {status.label}
                    </option>
                  )
                )}
              </select>
            </div>

          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">

            <p className="text-sm text-muted-foreground">
              <strong className="font-bold text-foreground">
                {filteredOrders.length}
              </strong>{" "}
              de{" "}
              <strong className="font-bold text-foreground">
                {orders.length}
              </strong>{" "}
              pedidos
            </p>

            {(search ||
              orderStatusFilter !==
                "ALL" ||
              paymentStatusFilter !==
                "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setOrderStatusFilter(
                    "ALL"
                  );
                  setPaymentStatusFilter(
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
          <OrdersSkeleton />

        ) : filteredOrders.length ===
          0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <EmptyIcon />
            </div>

            <h2 className="mt-4 text-lg font-bold text-foreground">
              Nenhum pedido encontrado
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Não encontramos pedidos com os filtros selecionados.
            </p>

          </div>

        ) : (
          <section className="mt-6 space-y-3">

            {filteredOrders.map(
              (order) => {
                const createdDate =
                  new Date(
                    order.createdAt
                  );

                const dateLabel =
                  createdDate.toLocaleDateString(
                    "pt-BR"
                  );

                const timeLabel =
                  createdDate.toLocaleTimeString(
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

                const active =
                  [
                    "RECEIVED",
                    "PREPARING",
                    "READY",
                    "OUT_FOR_DELIVERY",
                  ].includes(
                    order.status
                  );

                return (
                  <article
                    key={
                      order.id
                    }
                    className="
                      overflow-hidden
                      rounded-2xl
                      border border-border
                      bg-card
                      transition
                      hover:border-foreground/10
                    "
                  >

                    {/* RESUMO */}

                    <div className="p-5 sm:p-6">

                      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                        <div className="flex min-w-0 flex-wrap items-start gap-x-8 gap-y-4">

                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                              Pedido
                            </p>

                            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                              #{order.id}
                            </p>
                          </div>

                          <div className="min-w-44">
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
                              Criado em
                            </p>

                            <p className="mt-1 font-semibold text-foreground">
                              {dateLabel}
                            </p>

                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {timeLabel}
                            </p>
                          </div>

                        </div>

                        <div className="flex flex-wrap items-center gap-2">

                          <span
                            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${paymentStatusClass(
                              order.paymentStatus
                            )}`}
                          >
                            {paymentStatusName(
                              order.paymentStatus
                            )}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${orderStatusClass(
                              order.status
                            )}`}
                          >
                            {orderStatusName(
                              order.status
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

                      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">

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

                        <Link
                          href={`/admin/pedidos/${order.id}/imprimir`}
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
                          Imprimir
                        </Link>

                        {active && (
                          <Link
                            href="/admin/cozinha"
                            className="
                              inline-flex h-9
                              items-center gap-2
                              rounded-lg
                              bg-foreground
                              px-3.5
                              text-sm font-bold
                              text-background
                              transition
                              hover:opacity-90
                            "
                          >
                            <KitchenIcon />

                            Abrir cozinha
                          </Link>
                        )}

                        <span className="ml-auto text-sm font-medium text-muted-foreground">
                          {paymentMethodName(
                            order.paymentMethod
                          )}
                        </span>

                      </div>

                    </div>

                    {/* DETALHES */}

                    {expanded && (
                      <div className="border-t border-border bg-muted/30 p-5 sm:p-6">

                        <div className="grid gap-6 lg:grid-cols-3">

                          {/* ITENS */}

                          <section className="lg:col-span-2">

                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                              Itens do pedido
                            </p>

                            <div className="mt-3 space-y-2">

                              {order.items.length ===
                              0 ? (
                                <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                                  Nenhum item foi carregado para este pedido.
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

                                      <div className="flex items-start justify-between gap-4">

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
                                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">

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
                                            <p className="text-sm font-bold text-amber-700">
                                              +{" "}
                                              {currency(
                                                item.crustPrice
                                              )}
                                            </p>
                                          )}

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

                          {/* ENTREGA / PAGAMENTO */}

                          <aside>

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
                                {order.city
                                  ? ` · ${order.city}`
                                  : ""}
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

                                {order.deliveryDistanceKm !=
                                  null && (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {Number(
                                      order.deliveryDistanceKm
                                    ).toLocaleString(
                                      "pt-BR",
                                      {
                                        maximumFractionDigits:
                                          2,
                                      }
                                    )}{" "}
                                    km pela rota
                                  </p>
                                )}

                                {order.deliveryRouteUrl && (
                                  <a
                                    href={
                                      order.deliveryRouteUrl
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-3 inline-flex text-xs font-bold text-primary underline underline-offset-2"
                                  >
                                    Abrir rota no Google Maps
                                  </a>
                                )}

                              </div>

                            </div>

                            <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                              Pagamento
                            </p>

                            <div className="mt-3 rounded-xl border border-border bg-card p-4">

                              <p className="font-bold text-foreground">
                                {paymentMethodName(
                                  order.paymentMethod
                                )}
                              </p>

                              <span
                                className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${paymentStatusClass(
                                  order.paymentStatus
                                )}`}
                              >
                                {paymentStatusName(
                                  order.paymentStatus
                                )}
                              </span>

                              {order.paymentExternalId && (
                                <div className="mt-4 border-t border-border pt-4">

                                  <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                                    Referência
                                  </p>

                                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                                    {
                                      order.paymentExternalId
                                    }
                                  </p>

                                </div>
                              )}

                            </div>

                          </aside>

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
"use client";

import {
  useEffect,
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

  createdAt: string;
};

type OrderWithItems =
  Order & {
    items: OrderItem[];
  };

type IconProps = {
  className?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080";

const activeStatuses: OrderStatus[] = [
  "RECEIVED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
];

function statusName(
  status: OrderStatus
) {
  switch (status) {
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

    case "PENDING_PAYMENT":
      return "Aguardando pagamento";

    default:
      return status;
  }
}

function statusClass(
  status: OrderStatus
) {
  switch (status) {
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

function nextStatus(
  status: OrderStatus
): OrderStatus | null {
  switch (status) {
    case "RECEIVED":
      return "PREPARING";

    case "PREPARING":
      return "READY";

    case "READY":
      return "OUT_FOR_DELIVERY";

    case "OUT_FOR_DELIVERY":
      return "DELIVERED";

    default:
      return null;
  }
}

function nextButtonText(
  status: OrderStatus
) {
  switch (status) {
    case "RECEIVED":
      return "Iniciar preparo";

    case "PREPARING":
      return "Marcar como pronto";

    case "READY":
      return "Saiu para entrega";

    case "OUT_FOR_DELIVERY":
      return "Marcar como entregue";

    default:
      return "Avançar";
  }
}

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

function ClockIcon({
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function UserIcon({
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
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function PhoneIcon({
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
      <path d="M6 3h4l2 5-3 2a15 15 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2C10 20 4 14 4 5a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function MapIcon({
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
      <path d="M12 21s6-5 6-11a6 6 0 1 0-12 0c0 6 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  );
}

function CheckIcon({
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
      <path d="m5 12 4 4L19 6" />
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
      <path d="M5 11h14" />
      <path d="M7 11a5 5 0 0 1 10 0" />
      <path d="M4 15h16" />
      <path d="M8 19h8" />
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

function KitchenSkeleton() {
  return (
    <div
      className="mt-6 grid gap-4 lg:grid-cols-2"
      role="status"
      aria-label="Carregando cozinha"
    >
      {[1, 2].map(
        (item) => (
          <div
            key={item}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="animate-pulse">

              <div className="flex items-start justify-between">
                <div>
                  <div className="h-3 w-16 rounded bg-muted" />
                  <div className="mt-2 h-8 w-20 rounded bg-muted" />
                </div>

                <div className="h-7 w-24 rounded-full bg-muted" />
              </div>

              <div className="mt-5 h-px bg-border" />

              <div className="mt-4 space-y-2">
                <div className="h-14 rounded-xl bg-muted" />
                <div className="h-14 rounded-xl bg-muted" />
              </div>

              <div className="mt-5 h-16 rounded-xl bg-muted" />

            </div>
          </div>
        )
      )}
    </div>
  );
}

export default function CozinhaPage() {
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
    updatingId,
    setUpdatingId,
  ] =
    useState<
      number | null
    >(null);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  async function loadOrders() {
    try {
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

      const allOrders:
        Order[] =
        await response.json();

      const activeOrders =
        allOrders.filter(
          (order) =>
            order.paymentStatus ===
              "APPROVED" &&
            activeStatuses.includes(
              order.status
            )
        );

      const ordersWithItems =
        await Promise.all(
          activeOrders.map(
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

                let items:
                  OrderItem[] = [];

                if (
                  itemsResponse.ok
                ) {
                  items =
                    await itemsResponse.json();
                }

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
        "Não foi possível carregar os pedidos da cozinha."
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();

    const interval =
      setInterval(
        () => {
          loadOrders();
        },
        5000
      );

    return () =>
      clearInterval(
        interval
      );
  }, []);

  async function changeStatus(
    order: OrderWithItems
  ) {
    const next =
      nextStatus(
        order.status
      );

    if (!next) {
      return;
    }

    try {
      setUpdatingId(
        order.id
      );

      setErrorMessage("");

      const response =
        await adminFetch(
          `${API_URL}/api/orders/${order.id}/status?status=${next}`,
          {
            method: "PATCH",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Erro ao atualizar pedido"
        );
      }

      await loadOrders();

    } catch {
      setErrorMessage(
        `Não foi possível atualizar o pedido #${order.id}.`
      );

    } finally {
      setUpdatingId(
        null
      );
    }
  }

  return (
    <main className="min-h-screen bg-background">

      <AdminHeader />

      <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">

        <section className="border-b border-border pb-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Operação
              </p>

              <h1 className="mt-2 font-display text-4xl uppercase leading-none tracking-tight text-foreground">
                Cozinha
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Pedidos pagos em andamento aparecem automaticamente aqui.
              </p>
            </div>

            <div className="flex items-end gap-3 rounded-xl border border-border bg-card px-4 py-3">

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Ativos
                </p>

                <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                  {orders.length}
                </p>
              </div>

              <span className="mb-1.5 h-2 w-2 rounded-full bg-emerald-500" />

            </div>

          </div>

        </section>

        {errorMessage && (
          <div
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4"
            role="alert"
          >
            <p className="text-sm font-bold text-red-800">
              Problema ao atualizar a cozinha
            </p>

            <p className="mt-1 text-sm text-red-700">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() =>
                loadOrders()
              }
              className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-800"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {loading ? (
          <KitchenSkeleton />

        ) : orders.length ===
          0 ? (

          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">

            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <EmptyIcon />
            </div>

            <h2 className="mt-4 text-lg font-bold text-foreground">
              Cozinha em dia
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Nenhum pedido pago está aguardando preparo no momento.
            </p>

          </div>

        ) : (

          <section className="mt-6 grid gap-4 lg:grid-cols-2">

            {orders.map(
              (order) => {
                const createdAt =
                  new Date(
                    order.createdAt
                  ).toLocaleTimeString(
                    "pt-BR",
                    {
                      hour:
                        "2-digit",
                      minute:
                        "2-digit",
                    }
                  );

                const isUpdating =
                  updatingId ===
                  order.id;

                return (
                  <article
                    key={
                      order.id
                    }
                    className="overflow-hidden rounded-2xl border border-border bg-card"
                  >

                    <div className="border-b border-border p-4">

                      <div className="flex items-start justify-between gap-4">

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                            Pedido
                          </p>

                          <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                            #{order.id}
                          </h2>

                          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <ClockIcon />
                            {createdAt}
                          </div>
                        </div>

                        <div className="text-right">

                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(
                              order.status
                            )}`}
                          >
                            {statusName(
                              order.status
                            )}
                          </span>

                          <div className="mt-2 flex items-center justify-end gap-1.5 text-xs font-bold text-emerald-700">
                            <CheckIcon />
                            Pago
                          </div>

                        </div>

                      </div>

                    </div>

                    <div className="p-4">

                      <div className="grid gap-3 sm:grid-cols-2">

                        <div className="rounded-xl border border-border bg-background p-3">

                          <div className="flex items-center gap-2 text-muted-foreground">
                            <UserIcon />

                            <p className="text-[10px] font-bold uppercase tracking-[0.14em]">
                              Cliente
                            </p>
                          </div>

                          <p className="mt-2 text-sm font-bold text-foreground">
                            {order.customerName}
                          </p>

                        </div>

                        <div className="rounded-xl border border-border bg-background p-3">

                          <div className="flex items-center gap-2 text-muted-foreground">
                            <PhoneIcon />

                            <p className="text-[10px] font-bold uppercase tracking-[0.14em]">
                              WhatsApp
                            </p>
                          </div>

                          <p className="mt-2 text-sm font-semibold text-foreground">
                            {order.customerPhone}
                          </p>

                        </div>

                      </div>

                      <section className="mt-5">

                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                          Itens
                        </p>

                        <div className="mt-3 space-y-2">

                          {order.items.length ===
                          0 ? (
                            <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                              Nenhum item carregado.
                            </div>

                          ) : (

                            order.items.map(
                              (item) => (
                                <div
                                  key={
                                    item.id
                                  }
                                  className="rounded-xl border border-border bg-background p-3"
                                >

                                  <div className="flex gap-3">

                                    <div className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-foreground px-2 text-xs font-bold text-background">
                                      {item.quantity}x
                                    </div>

                                    <div className="min-w-0 flex-1">

                                      <p className="text-sm font-bold text-foreground">
                                        {
                                          item
                                            .product
                                            .name
                                        }
                                      </p>

                                      {item.crustName && (
                                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">

                                          <div className="flex flex-wrap items-center justify-between gap-2">

                                            <p className="text-xs font-bold text-amber-900">
                                              Borda: {item.crustName}
                                            </p>

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
                                        <div className="mt-2 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2">

                                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                                            Atenção
                                          </p>

                                          <p className="mt-1 text-sm font-semibold leading-5 text-foreground">
                                            {item.observation}
                                          </p>

                                        </div>
                                      )}

                                    </div>

                                  </div>

                                </div>
                              )
                            )
                          )}

                        </div>

                      </section>

                      <section className="mt-5 rounded-xl border border-border bg-background p-3">

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapIcon />

                          <p className="text-[10px] font-bold uppercase tracking-[0.14em]">
                            Entrega
                          </p>
                        </div>

                        <p className="mt-2 text-sm font-bold text-foreground">
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

                      </section>

                      <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                            Total
                          </p>

                          <p className="mt-1 text-xl font-bold tracking-tight text-foreground">
                            {currency(
                              order.total
                            )}
                          </p>
                        </div>

                        {nextStatus(
                          order.status
                        ) && (
                          <button
                            type="button"
                            disabled={
                              isUpdating
                            }
                            onClick={() =>
                              changeStatus(
                                order
                              )
                            }
                            className="
                              inline-flex min-h-10
                              items-center justify-center
                              gap-2 rounded-xl
                              bg-primary px-4
                              text-sm font-bold
                              text-primary-foreground
                              transition
                              hover:-translate-y-0.5
                              hover:shadow-sm
                              disabled:pointer-events-none
                              disabled:opacity-50
                            "
                          >

                            {isUpdating && (
                              <Spinner />
                            )}

                            {isUpdating
                              ? "Atualizando"
                              : nextButtonText(
                                  order.status
                                )}

                          </button>
                        )}

                      </div>

                    </div>

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
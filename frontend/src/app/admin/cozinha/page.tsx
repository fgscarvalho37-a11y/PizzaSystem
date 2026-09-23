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

type OrderItemAddon = {
  id: number;
  sourceAddonId: number | null;
  groupName: string | null;
  addonName: string;
  addonPrice: number;
  sortOrder: number;
};

type OrderItem = {
  id: number;
  quantity: number;
  unitPrice: number;
  observation: string | null;
  crustName: string | null;
  crustPrice: number | null;
  addons?: OrderItemAddon[];
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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080";

const activeStatuses: OrderStatus[] = [
  "RECEIVED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
];

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

function normalizeAddons(
  addons:
    OrderItemAddon[] |
    null |
    undefined
) {
  if (!Array.isArray(addons)) {
    return [];
  }

  return [...addons].sort(
    (a, b) =>
      Number(
        a.sortOrder ?? 0
      ) -
      Number(
        b.sortOrder ?? 0
      )
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
            cache:
              "no-store",
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

                  const rawItems:
                    OrderItem[] =
                    await itemsResponse.json();

                  items =
                    rawItems.map(
                      (
                        item
                      ) => ({
                        ...item,

                        addons:
                          normalizeAddons(
                            item.addons
                          ),
                      })
                    );
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

      setLoading(
        false
      );
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
    order:
      OrderWithItems
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

      setErrorMessage(
        ""
      );

      const response =
        await adminFetch(
          `${API_URL}/api/orders/${order.id}/status?status=${next}`,
          {
            method:
              "PATCH",
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

            <div className="rounded-xl border border-border bg-card px-4 py-3">

              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Ativos
              </p>

              <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                {orders.length}
              </p>

            </div>

          </div>

        </section>

        {errorMessage && (

          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">

            <p className="text-sm font-bold text-red-800">
              Problema ao atualizar a cozinha
            </p>

            <p className="mt-1 text-sm text-red-700">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={
                loadOrders
              }
              className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white"
            >
              Tentar novamente
            </button>

          </div>
        )}

        {loading ? (

          <div className="mt-6 grid gap-4 lg:grid-cols-2">

            {[1, 2].map(
              (
                item
              ) => (

                <div
                  key={
                    item
                  }
                  className="h-72 animate-pulse rounded-2xl border border-border bg-card"
                />

              )
            )}

          </div>

        ) : orders.length ===
          0 ? (

          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">

            <h2 className="text-lg font-bold text-foreground">
              Cozinha em dia
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Nenhum pedido pago está aguardando preparo no momento.
            </p>

          </div>

        ) : (

          <section className="mt-6 grid gap-4 lg:grid-cols-2">

            {orders.map(
              (
                order
              ) => {

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

                          <p className="mt-1 text-xs text-muted-foreground">
                            {createdAt}
                          </p>

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

                          <p className="mt-2 text-xs font-bold text-emerald-700">
                            Pago
                          </p>

                        </div>

                      </div>

                    </div>

                    <div className="p-4">

                      <div className="grid gap-3 sm:grid-cols-2">

                        <div className="rounded-xl border border-border bg-background p-3">

                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                            Cliente
                          </p>

                          <p className="mt-2 text-sm font-bold text-foreground">
                            {order.customerName}
                          </p>

                        </div>

                        <div className="rounded-xl border border-border bg-background p-3">

                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                            WhatsApp
                          </p>

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
                              (
                                item
                              ) => {

                                const addons =
                                  normalizeAddons(
                                    item.addons
                                  );

                                return (

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
                                          {item.product.name}
                                        </p>

                                        {addons.length >
                                          0 && (

                                          <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">

                                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                                              Adicionais
                                            </p>

                                            <div className="mt-2 space-y-1.5">

                                              {addons.map(
                                                (
                                                  addon
                                                ) => (

                                                  <div
                                                    key={
                                                      addon.id
                                                    }
                                                    className="flex items-start justify-between gap-3 text-xs"
                                                  >

                                                    <div className="min-w-0">

                                                      {addon.groupName && (

                                                        <span className="mr-1 text-emerald-700">
                                                          {addon.groupName}:
                                                        </span>

                                                      )}

                                                      <span className="font-bold text-emerald-950">
                                                        {addon.addonName}
                                                      </span>

                                                    </div>

                                                    <span className="shrink-0 font-bold text-emerald-700">
                                                      +{" "}
                                                      {currency(
                                                        addon.addonPrice
                                                      )}
                                                    </span>

                                                  </div>

                                                )
                                              )}

                                            </div>

                                          </div>

                                        )}

                                        {item.crustName && (

                                          <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">

                                            <div className="flex flex-wrap items-center justify-between gap-2">

                                              <p className="text-xs font-bold text-amber-900">
                                                Borda:{" "}
                                                {item.crustName}
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

                                );
                              }
                            )
                          )}

                        </div>

                      </section>

                      <section className="mt-5 rounded-xl border border-border bg-background p-3">

                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                          Entrega
                        </p>

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
                            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                          >
                            {isUpdating
                              ? "Atualizando..."
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

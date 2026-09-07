"use client";

import { useEffect, useState } from "react";
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

type OrderWithItems = Order & {
  items: OrderItem[];
};

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
      return "bg-blue-100 text-blue-800";

    case "PREPARING":
      return "bg-yellow-100 text-yellow-800";

    case "READY":
      return "bg-green-100 text-green-800";

    case "OUT_FOR_DELIVERY":
      return "bg-purple-100 text-purple-800";

    case "DELIVERED":
      return "bg-emerald-100 text-emerald-800";

    case "CANCELLED":
      return "bg-red-100 text-red-800";

    default:
      return "bg-gray-100 text-gray-700";
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

export default function CozinhaPage() {
  const [orders, setOrders] =
    useState<OrderWithItems[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  // =========================
  // CARREGAR PEDIDOS
  // =========================

  async function loadOrders() {
    try {
      setErrorMessage("");

     const response =
  await adminFetch(
    "http://localhost:8080/api/orders",
    {
      cache: "no-store",
      credentials: "include",
    }
  );

      if (!response.ok) {
        throw new Error(
          "Erro ao carregar pedidos"
        );
      }

      const allOrders: Order[] =
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
              const itemsResponse =
  await adminFetch(
    `http://localhost:8080/api/orders/${order.id}/items`,
    {
      cache:
        "no-store",
      credentials:
        "include",
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
      setInterval(() => {
        loadOrders();
      }, 5000);

    return () =>
      clearInterval(interval);
  }, []);

  // =========================
  // ALTERAR STATUS
  // =========================

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
    `http://localhost:8080/api/orders/${order.id}/status?status=${next}`,
    {
      method: "PATCH",
      credentials: "include",
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

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100">
        <div className="mx-auto max-w-7xl p-6">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <p className="font-semibold text-gray-600">
              Carregando cozinha...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // =========================
  // TELA
  // =========================

  return (
    <main className="min-h-screen bg-gray-100">

      <AdminHeader
        title="Cozinha"
      />

      {/* =========================
          CONTEÚDO
          ========================= */}

      <div className="mx-auto max-w-7xl p-6">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Operação
            </p>

            <h2 className="mt-1 text-3xl font-bold text-gray-900">
              Cozinha
            </h2>

            <p className="mt-2 text-gray-600">
              Pedidos pagos em andamento aparecem automaticamente aqui.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
            <p className="text-sm text-gray-500">
              Pedidos ativos
            </p>

            <p className="mt-1 text-3xl font-bold text-gray-900">
              {orders.length}
            </p>
          </div>

        </div>

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

            <button
              type="button"
              onClick={() =>
                loadOrders()
              }
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Tentar novamente
            </button>

          </div>
        )}

        {/* =========================
            SEM PEDIDOS
            ========================= */}

        {orders.length === 0 ? (

          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-gray-200 bg-gray-50">
              <span className="h-5 w-5 rounded-full border-4 border-gray-300" />
            </div>

            <h3 className="mt-4 text-xl font-bold text-gray-900">
              Nenhum pedido na cozinha
            </h3>

            <p className="mt-2 text-gray-500">
              Assim que um pagamento for aprovado, o pedido aparecerá aqui automaticamente.
            </p>

          </div>

        ) : (

          /* =========================
              PEDIDOS
              ========================= */

          <div className="mt-8 grid gap-6 lg:grid-cols-2">

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

                return (
                  <article
                    key={order.id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                  >

                    {/* CABEÇALHO PEDIDO */}

                    <div className="border-b border-gray-100 p-5">

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <p className="text-sm text-gray-500">
                            Pedido
                          </p>

                          <h3 className="text-3xl font-bold text-gray-900">
                            #{order.id}
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            Criado às{" "}
                            {createdAt}
                          </p>

                        </div>

                        <div className="text-right">

                          <span
                            className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${statusClass(
                              order.status
                            )}`}
                          >
                            {statusName(
                              order.status
                            )}
                          </span>

                          <p className="mt-2 text-sm font-semibold text-green-600">
                            Pagamento aprovado
                          </p>

                        </div>

                      </div>
                    </div>

                    <div className="p-5">

                      {/* CLIENTE */}

                      <div className="grid gap-4 sm:grid-cols-2">

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Cliente
                          </p>

                          <p className="mt-1 font-bold text-gray-900">
                            {order.customerName}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            WhatsApp
                          </p>

                          <p className="mt-1 font-semibold text-gray-700">
                            {order.customerPhone}
                          </p>
                        </div>

                      </div>

                      {/* ITENS */}

                      <div className="mt-6">

                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Itens do pedido
                        </p>

                        <div className="mt-3 space-y-3">

                          {order.items.length ===
                          0 ? (

                            <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                              Nenhum item carregado.
                            </div>

                          ) : (

                            order.items.map(
                              (item) => (

                                <div
                                  key={item.id}
                                  className="rounded-xl bg-gray-50 p-4"
                                >

                                  <div className="flex gap-3">

                                    <span className="text-xl font-bold text-gray-900">
                                      {item.quantity}x
                                    </span>

                                    <div className="min-w-0 flex-1">

                                      <p className="text-lg font-bold text-gray-900">
                                        {
                                          item
                                            .product
                                            .name
                                        }
                                      </p>

                                      {item.crustName && (
                                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                                          <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                                            Borda
                                          </p>

                                          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                                            <p className="text-sm font-bold text-amber-900">
                                              {item.crustName}
                                            </p>

                                            {item.crustPrice !== null && (
                                              <p className="text-xs font-semibold text-amber-700">
                                                + R${" "}
                                                {Number(
                                                  item.crustPrice
                                                )
                                                  .toFixed(2)
                                                  .replace(
                                                    ".",
                                                    ","
                                                  )}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {item.observation && (

                                        <div className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2">

                                          <p className="text-xs font-bold uppercase text-red-700">
                                            Observação
                                          </p>

                                          <p className="mt-1 text-sm font-medium text-red-700">
                                            {
                                              item.observation
                                            }
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

                      </div>

                      {/* ENTREGA */}

                      <div className="mt-6 rounded-xl border border-gray-200 p-4">

                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Entrega
                        </p>

                        <p className="mt-2 font-semibold text-gray-900">
                          {order.street},{" "}
                          {order.number}
                        </p>

                        <p className="mt-1 text-sm text-gray-600">
                          {order.neighborhood}
                        </p>

                        {order.complement && (
                          <p className="mt-1 text-sm text-gray-600">
                            {order.complement}
                          </p>
                        )}

                      </div>

                      {/* TOTAL + AÇÃO */}

                      <div className="mt-6 flex flex-col gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                          <p className="text-sm text-gray-500">
                            Total
                          </p>

                          <p className="text-2xl font-bold text-gray-900">
                            R${" "}
                            {Number(
                              order.total
                            )
                              .toFixed(
                                2
                              )
                              .replace(
                                ".",
                                ","
                              )}
                          </p>

                        </div>

                        {nextStatus(
                          order.status
                        ) && (

                          <button
                            type="button"
                            disabled={
                              updatingId ===
                              order.id
                            }
                            onClick={() =>
                              changeStatus(
                                order
                              )
                            }
                            className="rounded-xl bg-black px-5 py-3 font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingId ===
                            order.id
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

          </div>
        )}

      </div>
    </main>
  );
}
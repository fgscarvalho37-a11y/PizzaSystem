"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import AdminHeader from "@/components/AdminHeader";

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

  paymentExternalId?: string | null;

  createdAt: string;
};

type OrderWithItems = Order & {
  items: OrderItem[];
};

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
      return "bg-gray-100 text-gray-700";

    case "RECEIVED":
      return "bg-blue-100 text-blue-700";

    case "PREPARING":
      return "bg-yellow-100 text-yellow-700";

    case "READY":
      return "bg-green-100 text-green-700";

    case "OUT_FOR_DELIVERY":
      return "bg-purple-100 text-purple-700";

    case "DELIVERED":
      return "bg-emerald-100 text-emerald-700";

    case "CANCELLED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
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
      return "bg-green-100 text-green-700";

    case "PENDING":
      return "bg-yellow-100 text-yellow-700";

    case "REJECTED":
      return "bg-red-100 text-red-700";

    case "CANCELLED":
      return "bg-gray-100 text-gray-600";

    case "REFUNDED":
      return "bg-purple-100 text-purple-700";

    default:
      return "bg-gray-100 text-gray-700";
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

export default function AdminPedidosPage() {
  const [
    orders,
    setOrders,
  ] = useState<OrderWithItems[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    orderStatusFilter,
    setOrderStatusFilter,
  ] =
    useState<OrderStatus | "ALL">(
      "ALL"
    );

  const [
    paymentStatusFilter,
    setPaymentStatusFilter,
  ] =
    useState<PaymentStatus | "ALL">(
      "ALL"
    );

  const [
    expandedId,
    setExpandedId,
  ] = useState<number | null>(
    null
  );

  // =========================
  // CARREGAR PEDIDOS
  // =========================

  async function loadOrders() {
    try {
      setErrorMessage("");

      const response =
        await fetch(
          "http://localhost:8080/api/orders",
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
                  await fetch(
                    `http://localhost:8080/api/orders/${order.id}/items`,
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
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  // =========================
  // FILTROS
  // =========================

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

  // =========================
  // RESUMOS
  // =========================

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

  return (
    <main className="min-h-screen bg-gray-100">

      <AdminHeader
        title="Pedidos"
      />

      <div className="mx-auto max-w-7xl p-6">

        {/* =========================
            TÍTULO
            ========================= */}

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Operação
            </p>

            <h2 className="mt-1 text-3xl font-bold text-gray-900">
              Todos os pedidos
            </h2>

            <p className="mt-2 max-w-3xl text-gray-600">
              Consulte pedidos, pagamentos, clientes, itens e andamento da operação.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              loadOrders()
            }
            className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            Atualizar pedidos
          </button>

        </div>

        {/* =========================
            RESUMOS
            ========================= */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Pedidos cadastrados
            </p>

            <p className="mt-1 text-3xl font-bold text-gray-900">
              {orders.length}
            </p>

          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Em andamento
            </p>

            <p className="mt-1 text-3xl font-bold text-blue-700">
              {activeCount}
            </p>

          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Pagamentos aprovados
            </p>

            <p className="mt-1 text-3xl font-bold text-green-700">
              {approvedCount}
            </p>

          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Pendentes / recusados
            </p>

            <p className="mt-1 text-3xl font-bold text-gray-900">
              {pendingCount +
                rejectedCount}
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

          </div>
        )}

        {/* =========================
            FILTROS
            ========================= */}

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Buscar pedido
              </label>

              <input
                type="text"
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
                placeholder="Número, cliente, telefone, bairro..."
                className="h-12 w-full rounded-xl border border-gray-300 px-4 outline-none transition focus:border-black"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Status do pedido
              </label>

              <select
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
                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 outline-none transition focus:border-black"
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

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Pagamento
              </label>

              <select
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
                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 outline-none transition focus:border-black"
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

          <p className="mt-4 text-sm text-gray-500">
            Mostrando{" "}
            <strong>
              {
                filteredOrders.length
              }
            </strong>{" "}
            de{" "}
            <strong>
              {orders.length}
            </strong>{" "}
            pedidos.
          </p>

        </section>

        {/* =========================
            LISTA
            ========================= */}

        {loading ? (

          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

            <p className="font-semibold text-gray-600">
              Carregando pedidos...
            </p>

          </div>

        ) : filteredOrders.length ===
          0 ? (

          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

            <p className="text-5xl">
              📦
            </p>

            <h3 className="mt-4 text-xl font-bold text-gray-900">
              Nenhum pedido encontrado
            </h3>

            <p className="mt-2 text-gray-500">
              Altere os filtros ou aguarde novos pedidos.
            </p>

          </div>

        ) : (

          <div className="mt-8 space-y-4">

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
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                  >

                    {/* RESUMO */}

                    <div className="p-5">

                      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                        <div className="flex flex-wrap items-start gap-6">

                          <div>

                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              Pedido
                            </p>

                            <p className="mt-1 text-2xl font-bold text-gray-900">
                              #{order.id}
                            </p>

                          </div>

                          <div>

                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              Cliente
                            </p>

                            <p className="mt-1 font-bold text-gray-900">
                              {
                                order.customerName
                              }
                            </p>

                            <p className="text-sm text-gray-500">
                              {
                                order.customerPhone
                              }
                            </p>

                          </div>

                          <div>

                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              Data
                            </p>

                            <p className="mt-1 font-semibold text-gray-700">
                              {dateLabel}
                            </p>

                            <p className="text-sm text-gray-500">
                              {timeLabel}
                            </p>

                          </div>

                        </div>

                        <div className="flex flex-wrap items-center gap-3">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${paymentStatusClass(
                              order.paymentStatus
                            )}`}
                          >
                            {paymentStatusName(
                              order.paymentStatus
                            )}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${orderStatusClass(
                              order.status
                            )}`}
                          >
                            {orderStatusName(
                              order.status
                            )}
                          </span>

                          <p className="min-w-28 text-right text-xl font-bold text-gray-900">
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

                      </div>

                      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(
                              expanded
                                ? null
                                : order.id
                            )
                          }
                          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          {expanded
                            ? "Ocultar detalhes"
                            : "Ver detalhes"}
                        </button>

                        {active && (
                          <Link
                            href="/admin/cozinha"
                            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
                          >
                            Abrir cozinha
                          </Link>
                        )}

                        <span className="ml-auto text-sm text-gray-500">
                          {paymentMethodName(
                            order.paymentMethod
                          )}
                        </span>

                      </div>

                    </div>

                    {/* DETALHES */}

                    {expanded && (

                      <div className="border-t border-gray-100 bg-gray-50 p-5">

                        <div className="grid gap-6 lg:grid-cols-3">

                          {/* ITENS */}

                          <section className="lg:col-span-2">

                            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                              Itens
                            </p>

                            <div className="mt-3 space-y-3">

                              {order.items.length ===
                              0 ? (

                                <div className="rounded-xl bg-white p-4 text-sm text-gray-500">
                                  Nenhum item carregado.
                                </div>

                              ) : (

                                order.items.map(
                                  (item) => (

                                    <div
                                      key={
                                        item.id
                                      }
                                      className="rounded-xl border border-gray-200 bg-white p-4"
                                    >

                                      <div className="flex items-start justify-between gap-4">

                                        <div>

                                          <p className="font-bold text-gray-900">
                                            {item.quantity}x{" "}
                                            {
                                              item
                                                .product
                                                .name
                                            }
                                          </p>

                                          <p className="mt-1 text-sm text-gray-500">
                                            R${" "}
                                            {Number(
                                              item.unitPrice
                                            )
                                              .toFixed(
                                                2
                                              )
                                              .replace(
                                                ".",
                                                ","
                                              )}{" "}
                                            cada
                                          </p>

                                        </div>

                                        <p className="font-bold text-gray-900">
                                          R${" "}
                                          {(
                                            Number(
                                              item.unitPrice
                                            ) *
                                            item.quantity
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

                                      {item.observation && (

                                        <div className="mt-3 rounded-lg bg-red-50 p-3">

                                          <p className="text-xs font-bold uppercase text-red-700">
                                            Observação
                                          </p>

                                          <p className="mt-1 text-sm text-red-700">
                                            {
                                              item.observation
                                            }
                                          </p>

                                        </div>

                                      )}

                                    </div>

                                  )
                                )
                              )}

                            </div>

                          </section>

                          {/* CLIENTE / ENTREGA */}

                          <section>

                            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                              Entrega
                            </p>

                            <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4">

                              <p className="font-semibold text-gray-900">
                                {order.street},{" "}
                                {order.number}
                              </p>

                              <p className="mt-1 text-sm text-gray-600">
                                {
                                  order.neighborhood
                                }
                              </p>

                              {order.complement && (
                                <p className="mt-1 text-sm text-gray-600">
                                  {
                                    order.complement
                                  }
                                </p>
                              )}

                              <div className="mt-4 border-t border-gray-100 pt-4">

                                <p className="text-xs text-gray-500">
                                  Taxa de entrega
                                </p>

                                <p className="mt-1 font-semibold">
                                  R${" "}
                                  {Number(
                                    order.deliveryFee
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

                            </div>

                            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-gray-500">
                              Pagamento
                            </p>

                            <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4">

                              <p className="font-semibold text-gray-900">
                                {paymentMethodName(
                                  order.paymentMethod
                                )}
                              </p>

                              <p className="mt-1 text-sm text-gray-500">
                                {paymentStatusName(
                                  order.paymentStatus
                                )}
                              </p>

                              {order.paymentExternalId && (
                                <p className="mt-3 break-all text-xs text-gray-400">
                                  ID externo:{" "}
                                  {
                                    order.paymentExternalId
                                  }
                                </p>
                              )}

                            </div>

                          </section>

                        </div>

                      </div>

                    )}

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
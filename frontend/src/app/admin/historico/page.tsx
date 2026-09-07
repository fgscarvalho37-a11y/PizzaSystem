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

type OrderWithItems = Order & {
  items: OrderItem[];
};

type HistoryFilter =
  | "ALL"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED";

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

function statusClass(
  status: OrderStatus
) {
  switch (status) {
    case "DELIVERED":
      return "bg-green-100 text-green-700";

    case "CANCELLED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function AdminHistoricoPage() {
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
    filter,
    setFilter,
  ] =
    useState<HistoryFilter>(
      "ALL"
    );

  const [
    expandedId,
    setExpandedId,
  ] = useState<number | null>(
    null
  );

  // =========================
  // CARREGAR HISTÓRICO
  // =========================

  async function loadHistory() {
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

      const data: Order[] =
        await response.json();

      /*
       * Histórico:
       *
       * - entregues
       * - cancelados
       * - pagamentos recusados
       *
       * Pedidos ativos continuam
       * na área de Pedidos/Cozinha.
       */
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
    `http://localhost:8080/api/orders/${order.id}/items`,
    {
      cache:
        "no-store",
      credentials:
        "include",
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
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  // =========================
  // FILTROS
  // =========================

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

  // =========================
  // RESUMO
  // =========================

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
    <main className="min-h-screen bg-gray-100">

      <AdminHeader
        title="Histórico"
      />

      <div className="mx-auto max-w-7xl p-6">

        {/* =========================
            CABEÇALHO
            ========================= */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Operação
            </p>

            <h2 className="mt-1 text-3xl font-bold text-gray-900">
              Histórico de pedidos
            </h2>

            <p className="mt-2 max-w-3xl text-gray-600">
              Consulte pedidos finalizados, cancelados e pagamentos recusados.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              loadHistory()
            }
            className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            Atualizar histórico
          </button>

        </div>

        {/* =========================
            CARDS
            ========================= */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Entregues
            </p>

            <p className="mt-1 text-3xl font-bold text-green-700">
              {deliveredCount}
            </p>

          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Cancelados
            </p>

            <p className="mt-1 text-3xl font-bold text-red-700">
              {cancelledCount}
            </p>

          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Pagamentos recusados
            </p>

            <p className="mt-1 text-3xl font-bold text-gray-900">
              {rejectedCount}
            </p>

          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Valor entregue
            </p>

            <p className="mt-1 text-3xl font-bold text-gray-900">
              R${" "}
              {deliveredRevenue
                .toFixed(2)
                .replace(
                  ".",
                  ","
                )}
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

          <div className="grid gap-4 lg:grid-cols-[1fr_240px]">

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Buscar
              </label>

              <input
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
                className="h-12 w-full rounded-xl border border-gray-300 px-4 outline-none transition focus:border-black"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Tipo
              </label>

              <select
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
                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 outline-none transition focus:border-black"
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

          <p className="mt-4 text-sm text-gray-500">
            {filteredOrders.length}{" "}
            {filteredOrders.length ===
            1
              ? "registro encontrado"
              : "registros encontrados"}
          </p>

        </section>

        {/* =========================
            LISTA
            ========================= */}

        {loading ? (

          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

            <p className="font-semibold text-gray-600">
              Carregando histórico...
            </p>

          </div>

        ) : filteredOrders.length ===
          0 ? (

          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-gray-200 bg-gray-50">
              <div className="h-6 w-5 rounded-sm border-2 border-gray-300" />
            </div>

            <h3 className="mt-4 text-xl font-bold text-gray-900">
              Nenhum registro encontrado
            </h3>

            <p className="mt-2 text-gray-500">
              Pedidos finalizados, cancelados ou recusados aparecerão aqui.
            </p>

          </div>

        ) : (

          <div className="mt-8 space-y-4">

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
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                  >

                    <div className="p-5">

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        <div className="flex flex-wrap gap-6">

                          <div>

                            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                              Pedido
                            </p>

                            <p className="mt-1 text-2xl font-bold text-gray-900">
                              #{order.id}
                            </p>

                          </div>

                          <div>

                            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
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

                            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                              Data
                            </p>

                            <p className="mt-1 font-semibold text-gray-700">
                              {date}
                            </p>

                            <p className="text-sm text-gray-500">
                              {time}
                            </p>

                          </div>

                        </div>

                        <div className="flex flex-wrap items-center gap-3">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(
                              order.status
                            )}`}
                          >
                            {orderStatusName(
                              order.status
                            )}
                          </span>

                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                            {paymentStatusName(
                              order.paymentStatus
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

                      <div className="mt-5 flex items-center border-t border-gray-100 pt-4">

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

                        <span className="ml-auto text-sm text-gray-500">
                          {paymentMethodName(
                            order.paymentMethod
                          )}
                        </span>

                      </div>

                    </div>

                    {expanded && (

                      <div className="border-t border-gray-100 bg-gray-50 p-5">

                        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">

                          {/* ITENS */}

                          <section>

                            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                              Itens do pedido
                            </p>

                            <div className="mt-3 space-y-3">

                              {order.items.length ===
                              0 ? (

                                <div className="rounded-xl bg-white p-4 text-sm text-gray-500">
                                  Nenhum item encontrado.
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

                                      <div className="flex justify-between gap-4">

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

                                      {item.crustName && (

                                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">

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
                                                  .toFixed(
                                                    2
                                                  )
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

                          {/* ENDEREÇO */}

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

                                <p className="text-sm text-gray-500">
                                  Taxa de entrega
                                </p>

                                <p className="mt-1 font-bold text-gray-900">
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
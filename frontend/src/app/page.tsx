"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Product = {
  id: number;
  name: string;
  price: number;
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
  status: string;
  createdAt: string;
};

const statusLabels: Record<string, string> = {
  RECEIVED: "Recebidos",
  PREPARING: "Preparando",
  READY: "Prontos",
  OUT_FOR_DELIVERY: "Saiu para entrega",
};

const nextStatus: Record<string, string> = {
  RECEIVED: "PREPARING",
  PREPARING: "READY",
  READY: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<
    Record<number, OrderItem[]>
  >({});
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    try {
      const response = await fetch(
        "http://localhost:8080/api/orders"
      );

      const data: Order[] = await response.json();

      setOrders(data);

      const itemsMap: Record<number, OrderItem[]> = {};

      for (const order of data) {
        const itemsResponse = await fetch(
          `http://localhost:8080/api/orders/${order.id}/items`
        );

        const items: OrderItem[] = await itemsResponse.json();

        itemsMap[order.id] = items;
      }

      setOrderItems(itemsMap);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function advanceStatus(order: Order) {
    const newStatus = nextStatus[order.status];

    if (!newStatus) {
      return;
    }

    await fetch(
      `http://localhost:8080/api/orders/${order.id}/status?status=${newStatus}`,
      {
        method: "PATCH",
      }
    );

    loadOrders();
  }

  const activeStatuses = [
    "RECEIVED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY",
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <p>Carregando pedidos...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Painel da Pizzaria
        </h1>

        <Link
          href="/historico"
          className="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800"
        >
          Histórico
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {activeStatuses.map((status) => {
          const filteredOrders = orders.filter(
            (order) => order.status === status
          );

          return (
            <section
              key={status}
              className="rounded-xl bg-gray-200 p-4"
            >
              <h2 className="mb-4 text-xl font-bold">
                {statusLabels[status]}
              </h2>

              <div className="space-y-4">
                {filteredOrders.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Nenhum pedido
                  </p>
                )}

                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl bg-white p-4 shadow"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold">
                        Pedido #{order.id}
                      </h3>

                      <span className="font-semibold">
                        R$ {Number(order.total).toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="font-medium">
                        {order.customerName}
                      </p>

                      <p className="text-sm text-gray-600">
                        {order.customerPhone}
                      </p>
                    </div>

                    <div className="mt-4 border-t pt-3">
                      <p className="mb-2 text-sm font-bold">
                        Itens
                      </p>

                      <div className="space-y-3">
                        {orderItems[order.id]?.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg bg-gray-50 p-3"
                          >
                            <p className="font-medium">
                              {item.quantity}x {item.product.name}
                            </p>

                            <p className="text-sm text-gray-600">
                              R$ {Number(item.unitPrice).toFixed(2)} cada
                            </p>

                            {item.observation && (
                              <p className="mt-1 text-sm font-medium text-red-600">
                                Obs: {item.observation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 border-t pt-3">
                      <p className="text-sm text-gray-600">
                        {order.street}, {order.number}
                      </p>

                      <p className="text-sm text-gray-600">
                        {order.neighborhood}
                      </p>

                      {order.complement && (
                        <p className="text-sm text-gray-600">
                          {order.complement}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 border-t pt-3">
                      <div className="flex justify-between text-sm">
                        <span>Taxa de entrega</span>

                        <span>
                          R$ {Number(order.deliveryFee ?? 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="mt-2 flex justify-between font-bold">
                        <span>Total</span>

                        <span>
                          R$ {Number(order.total).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {nextStatus[order.status] && (
                      <button
                        onClick={() => advanceStatus(order)}
                        className="mt-4 w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                      >
                        Avançar pedido
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function HistoricoPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8080/api/orders")
      .then((response) => response.json())
      .then((data: Order[]) => {
        const finishedOrders = data.filter(
          (order) =>
            order.status === "DELIVERED" ||
            order.status === "CANCELLED"
        );

        setOrders(finishedOrders);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erro ao buscar histórico:", error);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Histórico de Pedidos
        </h1>

        <Link
          href="/"
          className="rounded-lg bg-black px-4 py-2 text-white"
        >
          Voltar ao painel
        </Link>
      </div>

      {loading && <p>Carregando histórico...</p>}

      {!loading && orders.length === 0 && (
        <p className="text-gray-500">
          Nenhum pedido finalizado ainda.
        </p>
      )}

      <div className="grid gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-xl bg-white p-5 shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">
                  Pedido #{order.id}
                </h2>

                <p className="text-sm text-gray-600">
                  {order.customerName}
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold">
                  R$ {Number(order.total).toFixed(2)}
                </p>

                <p className="text-sm text-gray-600">
                  {order.status === "DELIVERED"
                    ? "Entregue"
                    : "Cancelado"}
                </p>
              </div>
            </div>

            <div className="mt-4 border-t pt-3">
              <p className="text-sm text-gray-600">
                {order.street}, {order.number} -{" "}
                {order.neighborhood}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
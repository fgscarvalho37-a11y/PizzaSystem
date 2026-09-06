"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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
  paymentStatus?: string;
  createdAt: string;
};

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: "Aguardando pagamento",
  RECEIVED: "Pedido recebido",
  PREPARING: "Em preparo",
  READY: "Pronto",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

const statusMessages: Record<string, string> = {
  PENDING_PAYMENT: "Estamos aguardando a confirmação do pagamento.",
  RECEIVED: "Seu pedido foi recebido pela pizzaria.",
  PREPARING: "Seu pedido está sendo preparado.",
  READY: "Seu pedido está pronto e será enviado em breve.",
  OUT_FOR_DELIVERY: "Seu pedido saiu para entrega.",
  DELIVERED: "Pedido entregue. Bom apetite!",
  CANCELLED: "Este pedido foi cancelado.",
};

const statusSteps = [
  "RECEIVED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export default function PedidoPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadOrder() {
    try {
      const response = await fetch(
        `http://localhost:8080/api/orders/${id}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Pedido não encontrado");
      }

      const data: Order = await response.json();

      setOrder(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();

    const interval = setInterval(() => {
      loadOrder();
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <p>Carregando pedido...</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-xl rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">
            Pedido não encontrado
          </h1>

          <button
            onClick={() => router.push("/cardapio")}
            className="mt-5 rounded-lg bg-black px-5 py-3 font-semibold text-white"
          >
            Voltar ao cardápio
          </button>
        </div>
      </main>
    );
  }

  const currentStep = statusSteps.indexOf(order.status);

  const isCancelled = order.status === "CANCELLED";
  const isDelivered = order.status === "DELIVERED";
  const isPendingPayment =
    order.status === "PENDING_PAYMENT";

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-xl">
        <div className="rounded-xl bg-white p-7 shadow-sm">
          <div className="text-center">
            <div className="text-5xl">
              {isDelivered
                ? "🏠"
                : isCancelled
                  ? "❌"
                  : isPendingPayment
                    ? "💳"
                    : "🍕"}
            </div>

            <h1 className="mt-4 text-3xl font-bold">
              Pedido #{order.id}
            </h1>

            <p className="mt-2 text-gray-600">
              Acompanhe o andamento do seu pedido.
            </p>
          </div>

          <div className="mt-7 rounded-xl bg-gray-100 p-5">
            <div className="text-center">
              <span
                className={`inline-block rounded-full px-4 py-2 text-sm font-semibold text-white ${
                  isCancelled
                    ? "bg-red-600"
                    : isDelivered
                      ? "bg-green-600"
                      : isPendingPayment
                        ? "bg-yellow-600"
                        : "bg-black"
                }`}
              >
                {statusLabels[order.status] ?? order.status}
              </span>

              <p className="mt-3 text-sm text-gray-600">
                {statusMessages[order.status] ??
                  "Status atualizado."}
              </p>
            </div>

            {!isCancelled && !isPendingPayment && (
              <div className="mt-7 space-y-4">
                {statusSteps.map((status, index) => {
                  const completed =
                    currentStep >= 0 &&
                    index <= currentStep;

                  const current =
                    index === currentStep;

                  return (
                    <div
                      key={status}
                      className="flex items-center gap-3"
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                          completed
                            ? "bg-black text-white"
                            : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        {completed ? "✓" : index + 1}
                      </div>

                      <div>
                        <p
                          className={
                            completed
                              ? "font-semibold"
                              : "text-gray-500"
                          }
                        >
                          {statusLabels[status]}
                        </p>

                        {current && !isDelivered && (
                          <p className="text-xs text-gray-500">
                            Status atual
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {isPendingPayment && (
              <div className="mt-6 rounded-lg bg-yellow-50 p-4 text-center">
                <p className="font-semibold text-yellow-800">
                  Pagamento ainda não confirmado
                </p>

                <p className="mt-1 text-sm text-yellow-700">
                  Assim que o pagamento for aprovado,
                  o pedido entra automaticamente na cozinha.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push(`/pagamento/${order.id}`)
                  }
                  className="mt-4 rounded-lg bg-black px-5 py-3 font-semibold text-white"
                >
                  Voltar ao pagamento
                </button>
              </div>
            )}

            <div className="mt-7 border-t pt-5">
              <p>
                <strong>Cliente:</strong>{" "}
                {order.customerName}
              </p>

              <p className="mt-2">
                <strong>Entrega:</strong>{" "}
                {order.street}, {order.number} -{" "}
                {order.neighborhood}
              </p>

              {order.complement && (
                <p className="mt-2">
                  <strong>Complemento:</strong>{" "}
                  {order.complement}
                </p>
              )}
            </div>

            <div className="mt-5 border-t pt-4">
              <div className="flex justify-between">
                <span>Taxa de entrega</span>

                <span>
                  R${" "}
                  {Number(order.deliveryFee ?? 0)
                    .toFixed(2)
                    .replace(".", ",")}
                </span>
              </div>

              <div className="mt-2 flex justify-between text-xl font-bold">
                <span>Total</span>

                <span>
                  R${" "}
                  {Number(order.total)
                    .toFixed(2)
                    .replace(".", ",")}
                </span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-gray-500">
            O status é atualizado automaticamente.
          </p>

          <button
            type="button"
            onClick={() => router.push("/cardapio")}
            className="mt-6 w-full rounded-lg border border-black px-4 py-3 font-semibold"
          >
            Voltar ao cardápio
          </button>
        </div>
      </div>
    </main>
  );
}
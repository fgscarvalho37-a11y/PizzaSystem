"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Order = {
  id: number;
  total: number;
  paymentStatus: string;
  status: string;
};

export default function PaymentSuccessPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const response = await fetch(
          `http://localhost:8080/api/orders/${id}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Pedido não encontrado"
          );
        }

        const data: Order =
          await response.json();

        setOrder(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <p>Carregando...</p>
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
        </div>
      </main>
    );
  }

  const approved =
    order.paymentStatus === "APPROVED";

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-xl">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">

          <div className="text-6xl">
            {approved ? "✅" : "⏳"}
          </div>

          <h1 className="mt-5 text-3xl font-bold">
            {approved
              ? "Pagamento aprovado!"
              : "Pagamento em processamento"}
          </h1>

          <p className="mt-3 text-gray-600">
            {approved
              ? "Seu pedido foi recebido pela pizzaria."
              : "Estamos aguardando a confirmação do pagamento."}
          </p>

          <div className="mt-6 rounded-xl bg-gray-50 p-5">
            <p className="text-sm text-gray-500">
              Pedido
            </p>

            <p className="mt-1 text-2xl font-bold">
              #{order.id}
            </p>

            <p className="mt-4 text-sm text-gray-500">
              Total
            </p>

            <p className="mt-1 text-2xl font-bold">
              R${" "}
              {Number(order.total)
                .toFixed(2)
                .replace(".", ",")}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/pedido/${order.id}`
              )
            }
            className="mt-6 w-full rounded-lg bg-black px-5 py-3 font-semibold text-white"
          >
            Acompanhar pedido
          </button>

          <button
            type="button"
            onClick={() =>
              router.push("/cardapio")
            }
            className="mt-3 w-full rounded-lg border border-black px-5 py-3 font-semibold"
          >
            Voltar ao cardápio
          </button>
        </div>
      </div>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type PixPayment = {
  id: string;
  amount: string;
  status: string;
  status_detail: string;
  payment_method: {
    id: string;
    type: string;
    ticket_url?: string;
    qr_code?: string;
    qr_code_base64?: string;
  };
};

type MercadoPagoOrder = {
  id: string;
  status: string;
  status_detail: string;
  total_amount: string;
  external_reference: string;
  transactions: {
    payments: PixPayment[];
  };
};

type LocalOrder = {
  id: number;
  paymentStatus: string;
  status: string;
  total: number;
};

export default function PagamentoPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [data, setData] =
    useState<MercadoPagoOrder | null>(null);

  const [localOrder, setLocalOrder] =
    useState<LocalOrder | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [copied, setCopied] =
    useState(false);

  async function loadData() {
    try {
      const [pixResponse, orderResponse] =
        await Promise.all([
          fetch(
            `http://localhost:8080/api/payments/${id}/pix`,
            {
              cache: "no-store",
            }
          ),

          fetch(
            `http://localhost:8080/api/orders/${id}`,
            {
              cache: "no-store",
            }
          ),
        ]);

      if (!pixResponse.ok) {
        throw new Error(
          "Erro ao carregar Pix"
        );
      }

      if (!orderResponse.ok) {
        throw new Error(
          "Erro ao carregar pedido"
        );
      }

      const pixData: MercadoPagoOrder =
        await pixResponse.json();

      const orderData: LocalOrder =
        await orderResponse.json();

      setData(pixData);
      setLocalOrder(orderData);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <p>Carregando pagamento...</p>
      </main>
    );
  }

  if (!data || !localOrder) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-xl rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">
            Não foi possível carregar o pagamento
          </h1>

          <button
            onClick={() =>
              router.push("/cardapio")
            }
            className="mt-5 rounded-lg bg-black px-5 py-3 font-semibold text-white"
          >
            Voltar ao cardápio
          </button>
        </div>
      </main>
    );
  }

  const payment =
    data.transactions?.payments?.[0];

  const qrCode =
    payment?.payment_method?.qr_code ?? "";

  const qrBase64 =
    payment?.payment_method?.qr_code_base64 ?? "";

  const approved =
    localOrder.paymentStatus === "APPROVED";

  async function copyPix() {
    if (!qrCode) {
      return;
    }

    await navigator.clipboard.writeText(
      qrCode
    );

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  if (approved) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-xl">
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <div className="text-6xl">
              ✅
            </div>

            <h1 className="mt-5 text-3xl font-bold text-green-600">
              Pagamento aprovado!
            </h1>

            <p className="mt-3 text-gray-600">
              Seu pedido foi recebido pela pizzaria.
            </p>

            <div className="mt-6 rounded-xl bg-green-50 p-5">
              <p className="text-sm text-green-700">
                Pedido
              </p>

              <p className="mt-1 text-2xl font-bold text-green-800">
                #{localOrder.id}
              </p>

              <p className="mt-3 text-sm text-green-700">
                Status
              </p>

              <p className="mt-1 font-semibold text-green-800">
                RECEBIDO
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/pedido/${localOrder.id}`
                )
              }
              className="mt-6 w-full rounded-lg bg-black px-5 py-3 font-semibold text-white"
            >
              Acompanhar pedido
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-xl">
        <div className="rounded-xl bg-white p-7 shadow-sm">
          <div className="text-center">
            <h1 className="text-3xl font-bold">
              Pagamento via Pix
            </h1>

            <p className="mt-2 text-gray-600">
              Escaneie o QR Code ou copie o código Pix.
            </p>

            <p className="mt-5 text-3xl font-bold">
              R${" "}
              {Number(data.total_amount)
                .toFixed(2)
                .replace(".", ",")}
            </p>
          </div>

          {qrBase64 && (
            <div className="mt-6 flex justify-center">
              <img
                src={`data:image/png;base64,${qrBase64}`}
                alt="QR Code Pix"
                className="h-64 w-64"
              />
            </div>
          )}

          <div className="mt-6">
            <label className="mb-2 block text-sm font-semibold">
              Pix copia e cola
            </label>

            <textarea
              readOnly
              value={qrCode}
              rows={5}
              className="w-full resize-none rounded-lg border bg-gray-50 p-3 text-xs"
            />

            <button
              type="button"
              onClick={copyPix}
              className="mt-3 w-full rounded-lg bg-black px-4 py-3 font-semibold text-white"
            >
              {copied
                ? "Pix copiado!"
                : "Copiar Pix"}
            </button>
          </div>

          <div className="mt-6 rounded-xl bg-yellow-50 p-4 text-center">
            <p className="font-semibold text-yellow-800">
              Aguardando pagamento
            </p>

            <p className="mt-1 text-sm text-yellow-700">
              Esta página verifica automaticamente quando o pagamento for aprovado.
            </p>
          </div>

          {payment?.payment_method?.ticket_url && (
            <a
              href={
                payment.payment_method.ticket_url
              }
              target="_blank"
              rel="noreferrer"
              className="mt-4 block text-center text-sm font-semibold underline"
            >
              Abrir pagamento no Mercado Pago
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
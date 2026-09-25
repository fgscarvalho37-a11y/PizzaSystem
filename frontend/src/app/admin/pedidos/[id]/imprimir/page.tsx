"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import {
  useParams,
} from "next/navigation";

import { adminFetch } from "@/lib/adminFetch";
import { downloadSimplePdf } from "@/lib/simplePdf";

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
  city?: string | null;
  neighborhood: string;
  complement: string | null;
  deliveryFee: number;
  deliveryDistanceKm?: number | null;
  deliveryRouteUrl?: string | null;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentExternalId?: string | null;
  createdAt: string;
};

type StoreProfile = {
  name: string;
  whatsapp?: string | null;
  phone?: string | null;
};

function money(
  value: number | null | undefined
) {
  return Number(
    value ?? 0
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

function paymentName(
  value: string
) {
  switch (value) {
    case "PIX":
      return "PIX";

    case "CREDIT_CARD":
      return "Cartão de crédito";

    case "DEBIT_CARD":
      return "Cartão de débito";

    default:
      return value;
  }
}

export default function PrintOrderPage() {
  const params =
    useParams<{
      id: string;
    }>();

  const [
    order,
    setOrder,
  ] =
    useState<Order | null>(
      null
    );

  const [
    items,
    setItems,
  ] =
    useState<OrderItem[]>(
      []
    );

  const [
    store,
    setStore,
  ] =
    useState<StoreProfile | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const [
          orderResponse,
          itemsResponse,
          storeResponse,
        ] =
          await Promise.all([
            adminFetch(
              `/api/orders/${params.id}`,
              {
                cache: "no-store",
              }
            ),
            adminFetch(
              `/api/orders/${params.id}/items`,
              {
                cache: "no-store",
              }
            ),
            adminFetch(
              "/api/store/profile",
              {
                cache: "no-store",
              }
            ),
          ]);

        if (
          !orderResponse.ok ||
          !itemsResponse.ok
        ) {
          throw new Error(
            "Não foi possível carregar o pedido."
          );
        }

        setOrder(
          await orderResponse.json()
        );

        setItems(
          await itemsResponse.json()
        );

        if (
          storeResponse.ok
        ) {
          setStore(
            await storeResponse.json()
          );
        }

      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar o pedido."
        );

      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [params.id]);

  function downloadPdf() {
    if (!order) {
      return;
    }

    const lines: string[] = [
      store?.name ??
        "PizzaSystem",
      `Pedido #${order.id}`,
      `Data: ${new Date(
        order.createdAt
      ).toLocaleString(
        "pt-BR"
      )}`,
      "",
      `Cliente: ${order.customerName}`,
      `Telefone: ${order.customerPhone}`,
      `Endereco: ${order.street}, ${order.number} - ${order.neighborhood}${order.city ? ` - ${order.city}` : ""}`,
      order.complement
        ? `Complemento: ${order.complement}`
        : "",
      "",
      "ITENS",
    ];

    for (
      const item
      of items
    ) {
      lines.push(
        `${item.quantity}x ${item.product.name} - ${money(
          Number(
            item.unitPrice
          ) *
            item.quantity
        )}`
      );

      if (
        item.crustName
      ) {
        lines.push(
          `  Borda: ${item.crustName}${
            item.crustPrice != null
              ? ` (+ ${money(
                  item.crustPrice
                )})`
              : ""
          }`
        );
      }

      if (
        item.observation
      ) {
        lines.push(
          `  Obs: ${item.observation}`
        );
      }
    }

    lines.push(
      "",
      `Taxa de entrega: ${money(
        order.deliveryFee
      )}`,
      order.deliveryDistanceKm != null
        ? `Distancia da rota: ${Number(
            order.deliveryDistanceKm
          ).toLocaleString(
            "pt-BR",
            {
              maximumFractionDigits:
                2,
            }
          )} km`
        : "",
      `TOTAL: ${money(
        order.total
      )}`,
      `Pagamento: ${paymentName(
        order.paymentMethod
      )}`,
      `Status pagamento: ${order.paymentStatus}`,
      "",
      "COMPROVANTE NAO FISCAL",
      "A emissao de NFC-e/NF-e depende da integracao fiscal do estabelecimento."
    );

    downloadSimplePdf(
      `pedido-${order.id}.pdf`,
      "PizzaSystem - Comprovante do Pedido",
      lines.filter(
        Boolean
      )
    );
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-white text-black">
        <p className="text-sm">
          Carregando pedido...
        </p>
      </main>
    );
  }

  if (
    error ||
    !order
  ) {
    return (
      <main className="grid min-h-screen place-items-center bg-white px-6 text-black">
        <div className="text-center">
          <p className="font-bold">
            Não foi possível abrir o comprovante.
          </p>

          <p className="mt-2 text-sm text-black/60">
            {error}
          </p>

          <Link
            href="/admin/pedidos"
            className="mt-5 inline-block underline"
          >
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-100 py-8 text-black print:bg-white print:py-0">
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 4mm;
          }

          body {
            background: white !important;
          }

          .print-controls {
            display: none !important;
          }

          .receipt {
            width: 72mm !important;
            max-width: 72mm !important;
            box-shadow: none !important;
            border: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="print-controls mx-auto mb-4 flex max-w-[80mm] flex-wrap gap-2 px-4 sm:px-0">
        <Link
          href="/admin/pedidos"
          className="inline-flex h-10 items-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-bold"
        >
          Voltar
        </Link>

        <button
          type="button"
          onClick={() =>
            window.print()
          }
          className="inline-flex h-10 items-center rounded-lg bg-black px-4 text-sm font-bold text-white"
        >
          Imprimir
        </button>

        <button
          type="button"
          onClick={
            downloadPdf
          }
          className="inline-flex h-10 items-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-bold"
        >
          Baixar PDF
        </button>
      </div>

      <article className="receipt mx-auto w-[80mm] max-w-[calc(100vw-24px)] bg-white p-5 font-mono text-[12px] leading-5 shadow-sm">
        <header className="text-center">
          <h1 className="text-base font-bold">
            {store?.name ??
              "PizzaSystem"}
          </h1>

          {(store?.phone ||
            store?.whatsapp) && (
            <p className="mt-1 text-[11px]">
              {store.phone ??
                store.whatsapp}
            </p>
          )}

          <div className="my-4 border-t border-dashed border-black" />

          <p className="font-bold">
            PEDIDO #{order.id}
          </p>

          <p>
            {new Date(
              order.createdAt
            ).toLocaleString(
              "pt-BR"
            )}
          </p>
        </header>

        <div className="my-4 border-t border-dashed border-black" />

        <section>
          <p className="font-bold">
            CLIENTE
          </p>

          <p>
            {order.customerName}
          </p>

          <p>
            {order.customerPhone}
          </p>

          <p className="mt-2">
            {order.street},{" "}
            {order.number}
          </p>

          <p>
            {order.neighborhood}
            {order.city
              ? ` · ${order.city}`
              : ""}
          </p>

          {order.complement && (
            <p>
              {order.complement}
            </p>
          )}
        </section>

        <div className="my-4 border-t border-dashed border-black" />

        <section>
          <p className="font-bold">
            ITENS
          </p>

          <div className="mt-2 space-y-3">
            {items.map(
              (item) => (
                <div
                  key={
                    item.id
                  }
                >
                  <div className="flex justify-between gap-3">
                    <span>
                      {item.quantity}x{" "}
                      {item.product.name}
                    </span>

                    <span className="shrink-0">
                      {money(
                        Number(
                          item.unitPrice
                        ) *
                          item.quantity
                      )}
                    </span>
                  </div>

                  {item.crustName && (
                    <p className="pl-3 text-[11px]">
                      Borda:{" "}
                      {item.crustName}
                    </p>
                  )}

                  {item.observation && (
                    <p className="pl-3 text-[11px]">
                      Obs:{" "}
                      {item.observation}
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        </section>

        <div className="my-4 border-t border-dashed border-black" />

        <section className="space-y-1">
          <div className="flex justify-between gap-4">
            <span>
              Entrega
            </span>

            <span>
              {money(
                order.deliveryFee
              )}
            </span>
          </div>

          {order.deliveryDistanceKm !=
            null && (
            <div className="flex justify-between gap-4 text-[11px]">
              <span>
                Distância
              </span>

              <span>
                {Number(
                  order.deliveryDistanceKm
                ).toLocaleString(
                  "pt-BR",
                  {
                    maximumFractionDigits:
                      2,
                  }
                )}{" "}
                km
              </span>
            </div>
          )}

          <div className="flex justify-between gap-4 text-sm font-bold">
            <span>
              TOTAL
            </span>

            <span>
              {money(
                order.total
              )}
            </span>
          </div>

          <p className="pt-2">
            Pagamento:{" "}
            {paymentName(
              order.paymentMethod
            )}
          </p>

          <p>
            Status:{" "}
            {order.paymentStatus}
          </p>
        </section>

        <div className="my-4 border-t border-dashed border-black" />

        <footer className="text-center text-[10px] leading-4">
          <p className="font-bold">
            COMPROVANTE NÃO FISCAL
          </p>

          <p className="mt-1">
            A emissão de NFC-e/NF-e exige integração fiscal própria do estabelecimento.
          </p>

          <p className="mt-3">
            Gerado pelo PizzaSystem
          </p>
        </footer>
      </article>
    </main>
  );
}

"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageProvider";

const API_URL = "";

type CheckoutResponse = {
  id: string;
  url: string;
  status: string;
};

export default function PayPalPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { text } = useLanguage();

  const id = params.id as string;
  const tokenFromUrl = searchParams.get("token");
  const storeSlug = searchParams.get("store") ?? "";
  const cancelled = searchParams.get("cancelled") === "1";

  const [accessToken, setAccessToken] =
    useState<string | null>(null);
  const [tokenReady, setTokenReady] =
    useState(false);
  const [loading, setLoading] =
    useState(!cancelled);
  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    const storageKey =
      `pizzasystem-order-token:${id}`;

    if (tokenFromUrl) {
      sessionStorage.setItem(
        storageKey,
        tokenFromUrl
      );
      setAccessToken(tokenFromUrl);
      setTokenReady(true);
      return;
    }

    setAccessToken(
      sessionStorage.getItem(storageKey)
    );
    setTokenReady(true);
  }, [
    id,
    tokenFromUrl,
  ]);

  async function openPayPalCheckout() {
    if (
      !accessToken ||
      !id
    ) {
      setError(
        text(
          "Não foi possível validar este pedido.",
          "We could not validate this order."
        )
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const encodedToken =
        encodeURIComponent(accessToken);

      const response =
        await fetch(
          `${API_URL}/api/payments/${id}/paypal/checkout?token=${encodedToken}`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              returnOrigin:
                window.location.origin,
            }),
          }
        );

      if (!response.ok) {
        let message =
          text(
            "Não foi possível abrir o PayPal.",
            "We could not open PayPal."
          );

        try {
          const data =
            await response.json();

          message =
            data.message ??
            data.detail ??
            data.error ??
            message;
        } catch {
        }

        throw new Error(message);
      }

      const data:
        CheckoutResponse =
        await response.json();

      if (!data.url) {
        throw new Error(
          text(
            "O PayPal não retornou a página de pagamento.",
            "PayPal did not return a payment page."
          )
        );
      }

      window.location.assign(
        data.url
      );

    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : text(
              "Não foi possível abrir o PayPal.",
              "We could not open PayPal."
            )
      );
      setLoading(false);
    }
  }

  useEffect(() => {
    if (
      !tokenReady ||
      cancelled
    ) {
      return;
    }

    void openPayPalCheckout();
  }, [
    tokenReady,
    cancelled,
  ]);

  function goBackToStore() {
    if (storeSlug) {
      router.push(
        `/cardapio/${encodeURIComponent(
          storeSlug
        )}`
      );
      return;
    }

    router.push("/");
  }

  if (
    !tokenReady ||
    loading
  ) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-5 text-foreground">
        <div className="w-full max-w-lg rounded-[28px] border border-border bg-card p-8 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />

          <h1 className="mt-6 font-display text-3xl tracking-tight">
            {text(
              "Abrindo PayPal",
              "Opening PayPal"
            )}
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {text(
              "Você será redirecionado para concluir o pagamento na conta PayPal da loja.",
              "You will be redirected to complete payment through the store's PayPal account."
            )}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground">
      <div className="mx-auto max-w-lg">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        <section className="mt-6 rounded-[28px] border border-border bg-card p-7 text-center sm:p-8">
          <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            PayPal
          </p>

          <h1 className="mt-3 font-display text-4xl tracking-tight">
            {cancelled
              ? text(
                  "Pagamento cancelado",
                  "Payment canceled"
                )
              : text(
                  "Não foi possível abrir o pagamento",
                  "Could not open payment"
                )}
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {cancelled
              ? text(
                  "Seu pedido continua aguardando pagamento. Você pode tentar novamente.",
                  "Your order is still awaiting payment. You can try again."
                )
              : error ||
                text(
                  "Tente novamente em alguns instantes.",
                  "Try again in a moment."
                )}
          </p>

          <button
            type="button"
            onClick={() =>
              void openPayPalCheckout()
            }
            className="brand-button mt-7 w-full rounded-2xl px-5 py-3.5"
          >
            {text(
              "Tentar PayPal novamente",
              "Try PayPal again"
            )}
          </button>

          <button
            type="button"
            onClick={
              goBackToStore
            }
            className="mt-3 w-full rounded-2xl border-2 border-foreground px-5 py-3.5 text-sm font-bold transition-colors hover:bg-foreground hover:text-cream"
          >
            {text(
              "Voltar ao cardápio",
              "Back to menu"
            )}
          </button>
        </section>
      </div>
    </main>
  );
}

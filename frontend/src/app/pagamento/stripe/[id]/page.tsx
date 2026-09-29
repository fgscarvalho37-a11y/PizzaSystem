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
  paymentStatus: string;
};

export default function StripePaymentPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const {
    text,
  } =
    useLanguage();

  const id =
    params.id as string;

  const tokenFromUrl =
    searchParams.get(
      "token"
    );

  const storeSlug =
    searchParams.get(
      "store"
    ) ?? "";

  const cancelled =
    searchParams.get(
      "cancelled"
    ) === "1";

  const [
    accessToken,
    setAccessToken,
  ] =
    useState<string | null>(
      null
    );

  const [
    tokenReady,
    setTokenReady,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(
      !cancelled
    );

  const [
    error,
    setError,
  ] =
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

      setAccessToken(
        tokenFromUrl
      );

      setTokenReady(
        true
      );

      return;
    }

    const storedToken =
      sessionStorage.getItem(
        storageKey
      );

    setAccessToken(
      storedToken
    );

    setTokenReady(
      true
    );
  }, [
    id,
    tokenFromUrl,
  ]);

  async function openStripeCheckout() {
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

      setLoading(
        false
      );

      return;
    }

    try {
      setLoading(
        true
      );

      setError(
        ""
      );

      const encodedToken =
        encodeURIComponent(
          accessToken
        );

      const response =
        await fetch(
          `${API_URL}/api/payments/${id}/stripe/checkout?token=${encodedToken}`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                returnOrigin:
                  window.location.origin,
              }),
          }
        );

      if (!response.ok) {
        let message =
          text(
            "Não foi possível abrir o pagamento.",
            "We could not open the payment page."
          );

        try {
          const data =
            await response.json();

          if (
            typeof data?.message ===
              "string" &&
            data.message
          ) {
            message =
              data.message;
          } else if (
            typeof data?.detail ===
              "string" &&
            data.detail
          ) {
            message =
              data.detail;
          }
        } catch {
          // mantém mensagem padrão
        }

        throw new Error(
          message
        );
      }

      const data:
        CheckoutResponse =
        await response.json();

      if (
        !data.url
      ) {
        throw new Error(
          text(
            "A Stripe não retornou a página de pagamento.",
            "Stripe did not return a payment page."
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
              "Não foi possível abrir o pagamento.",
              "We could not open the payment page."
            )
      );

      setLoading(
        false
      );
    }
  }

  useEffect(() => {
    if (
      !tokenReady ||
      cancelled
    ) {
      return;
    }

    void openStripeCheckout();
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

    router.push(
      "/"
    );
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
              "Abrindo pagamento seguro",
              "Opening secure checkout"
            )}
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {text(
              "Você será redirecionado para a Stripe para concluir o pagamento.",
              "You will be redirected to Stripe to complete your payment."
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
            Stripe Checkout
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
                  "Seu pedido continua aguardando pagamento. Você pode tentar novamente sem criar outro pedido.",
                  "Your order is still awaiting payment. You can try again without creating another order."
                )
              : error ||
                text(
                  "Tente novamente em alguns instantes.",
                  "Try again in a moment."
                )}
          </p>

          {error && cancelled && (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() =>
              void openStripeCheckout()
            }
            className="brand-button mt-7 w-full rounded-2xl px-5 py-3.5"
          >
            {text(
              "Tentar pagamento novamente",
              "Try payment again"
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

"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Script from "next/script";

import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageProvider";

const API_URL = "";

type WalletConfig = {
  publishableKey: string;
  amount: number;
  currency: string;
};

type WalletIntentResponse = {
  intentId: string;
  clientSecret: string;
  status: string;
};

type StripeError = {
  message?: string;
};

type StripeExpressCheckoutElement = {
  mount(selector: string): void;
  destroy(): void;
  on(
    event: "confirm",
    handler: () => void
  ): void;
};

type StripeElements = {
  create(
    type: "expressCheckout",
    options?: Record<string, unknown>
  ): StripeExpressCheckoutElement;
  submit(): Promise<{
    error?: StripeError;
  }>;
};

type StripeClient = {
  elements(
    options: Record<string, unknown>
  ): StripeElements;
  confirmPayment(options: {
    elements: StripeElements;
    clientSecret: string;
    confirmParams: {
      return_url: string;
    };
  }): Promise<{
    error?: StripeError;
  }>;
};

declare global {
  interface Window {
    Stripe?: (
      publishableKey: string
    ) => StripeClient;
  }
}

type HostedCheckoutResponse = {
  id: string;
  url: string;
  status: string;
  paymentStatus: string;
};

export default function StripePaymentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { text } = useLanguage();

  const id = params.id as string;
  const tokenFromUrl =
    searchParams.get("token");
  const storeSlug =
    searchParams.get("store") ?? "";
  const cancelled =
    searchParams.get("cancelled") === "1";

  const [
    accessToken,
    setAccessToken,
  ] =
    useState<string | null>(null);

  const [
    tokenReady,
    setTokenReady,
  ] =
    useState(false);

  const [
    walletConfig,
    setWalletConfig,
  ] =
    useState<WalletConfig | null>(
      null
    );

  const [
    walletConfigLoading,
    setWalletConfigLoading,
  ] =
    useState(true);

  const [
    stripeScriptReady,
    setStripeScriptReady,
  ] =
    useState(false);

  const [
    walletProcessing,
    setWalletProcessing,
  ] =
    useState(false);

  const [
    cardLoading,
    setCardLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const walletElementRef =
    useRef<StripeExpressCheckoutElement | null>(
      null
    );

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
      setTokenReady(true);
      return;
    }

    setAccessToken(
      sessionStorage.getItem(
        storageKey
      )
    );
    setTokenReady(true);
  }, [
    id,
    tokenFromUrl,
  ]);

  useEffect(() => {
    if (
      typeof window !==
        "undefined" &&
      window.Stripe
    ) {
      setStripeScriptReady(true);
    }
  }, []);

  useEffect(() => {
    if (
      !tokenReady ||
      !accessToken ||
      !id
    ) {
      if (tokenReady) {
        setWalletConfigLoading(false);
      }
      return;
    }

    let active = true;

    async function loadWalletConfig() {
      try {
        setWalletConfigLoading(true);

        const encodedToken =
          encodeURIComponent(
            accessToken as string
          );

        const response =
          await fetch(
            `${API_URL}/api/payments/${id}/stripe/wallet-config?token=${encodedToken}`,
            {
              cache: "no-store",
            }
          );

        if (!response.ok) {
          if (active) {
            setWalletConfig(null);
          }
          return;
        }

        const data:
          WalletConfig =
          await response.json();

        if (active) {
          setWalletConfig(data);
        }
      } catch {
        if (active) {
          setWalletConfig(null);
        }
      } finally {
        if (active) {
          setWalletConfigLoading(false);
        }
      }
    }

    void loadWalletConfig();

    return () => {
      active = false;
    };
  }, [
    id,
    accessToken,
    tokenReady,
  ]);

  useEffect(() => {
    if (
      !stripeScriptReady ||
      !walletConfig ||
      !accessToken ||
      !id ||
      !window.Stripe
    ) {
      return;
    }

    const stripe =
      window.Stripe(
        walletConfig.publishableKey
      );

    const elements =
      stripe.elements({
        mode: "payment",
        amount:
          walletConfig.amount,
        currency:
          walletConfig.currency,
        allowedPaymentMethodTypes: [
          "card",
        ],
        appearance: {
          theme: "stripe",
          variables: {
            borderRadius:
              "14px",
          },
        },
      });

    const express =
      elements.create(
        "expressCheckout",
        {
          buttonHeight: 50,
          buttonType: {
            applePay:
              "check-out",
            googlePay:
              "checkout",
          },
          layout: {
            maxColumns: 1,
            maxRows: 2,
          },
        }
      );

    walletElementRef.current =
      express;

    express.on(
      "confirm",
      () => {
        void (async () => {
          try {
            setWalletProcessing(
              true
            );
            setError("");

            const submitted =
              await elements.submit();

            if (
              submitted.error
            ) {
              throw new Error(
                submitted.error
                  .message ||
                  text(
                    "Não foi possível validar a carteira.",
                    "Could not validate the wallet."
                  )
              );
            }

            const encodedToken =
              encodeURIComponent(
                accessToken
              );

            const response =
              await fetch(
                `${API_URL}/api/payments/${id}/stripe/wallet-intent?token=${encodedToken}`,
                {
                  method:
                    "POST",
                }
              );

            if (!response.ok) {
              let message =
                text(
                  "Não foi possível iniciar o pagamento.",
                  "Could not start the payment."
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

              throw new Error(
                message
              );
            }

            const intent:
              WalletIntentResponse =
              await response.json();

            const returnUrl =
              `${window.location.origin}/pagamento/sucesso/${id}?token=${encodedToken}&store=${encodeURIComponent(
                storeSlug
              )}&stripe_intent=success`;

            const confirmed =
              await stripe.confirmPayment({
                elements,
                clientSecret:
                  intent.clientSecret,
                confirmParams: {
                  return_url:
                    returnUrl,
                },
              });

            if (
              confirmed.error
            ) {
              throw new Error(
                confirmed.error
                  .message ||
                  text(
                    "O pagamento não foi concluído.",
                    "The payment was not completed."
                  )
              );
            }

          } catch (caught) {
            setError(
              caught instanceof Error
                ? caught.message
                : text(
                    "Não foi possível concluir o pagamento.",
                    "Could not complete the payment."
                  )
            );
            setWalletProcessing(
              false
            );
          }
        })();
      }
    );

    express.mount(
      "#stripe-express-checkout"
    );

    return () => {
      try {
        express.destroy();
      } catch {
      }

      walletElementRef.current =
        null;
    };
  }, [
    stripeScriptReady,
    walletConfig,
    accessToken,
    id,
    storeSlug,
    text,
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
      return;
    }

    try {
      setCardLoading(true);
      setError("");

      const encodedToken =
        encodeURIComponent(
          accessToken
        );

      const response =
        await fetch(
          `${API_URL}/api/payments/${id}/stripe/checkout?token=${encodedToken}`,
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
            "Não foi possível abrir o pagamento com cartão.",
            "Could not open card payment."
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

        throw new Error(
          message
        );
      }

      const data:
        HostedCheckoutResponse =
        await response.json();

      if (!data.url) {
        throw new Error(
          text(
            "A página segura de cartão não foi retornada.",
            "The secure card page was not returned."
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
              "Could not open payment."
            )
      );
      setCardLoading(false);
    }
  }

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

  if (!tokenReady) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-5 text-foreground">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </main>
    );
  }

  return (
    <>
      <Script
        src="https://js.stripe.com/v3/"
        strategy="afterInteractive"
        onLoad={() =>
          setStripeScriptReady(
            true
          )
        }
      />

      <main className="min-h-screen bg-background px-5 py-10 text-foreground">
        <div className="mx-auto max-w-lg">
          <div className="flex justify-end">
            <LanguageSwitcher />
          </div>

          <section className="mt-6 rounded-[28px] border border-border bg-card p-7 sm:p-8">
            <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              {text(
                "Pagamento",
                "Payment"
              )}
            </p>

            <h1 className="mt-3 font-display text-4xl tracking-tight">
              {cancelled
                ? text(
                    "Pagamento cancelado",
                    "Payment canceled"
                  )
                : text(
                    "Escolha como pagar",
                    "Choose how to pay"
                  )}
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {text(
                "Use Apple Pay ou Google Pay quando aparecerem no seu aparelho, ou continue com cartão.",
                "Use Apple Pay or Google Pay when available on your device, or continue with card."
              )}
            </p>

            {error && (
              <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">
                {error}
              </p>
            )}

            {walletConfig && (
              <div className="mt-7">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold">
                    Apple Pay / Google Pay
                  </p>

                  {walletProcessing && (
                    <span className="text-xs text-muted-foreground">
                      {text(
                        "Processando...",
                        "Processing..."
                      )}
                    </span>
                  )}
                </div>

                <div
                  id="stripe-express-checkout"
                  className={
                    walletProcessing
                      ? "pointer-events-none opacity-60"
                      : ""
                  }
                />

                <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                  {text(
                    "A Stripe mostra somente as carteiras compatíveis com este aparelho, navegador e conta.",
                    "Stripe only shows wallets compatible with this device, browser, and account."
                  )}
                </p>
              </div>
            )}

            {walletConfigLoading && (
              <div className="mt-7 rounded-2xl border border-border bg-secondary/50 p-4 text-xs text-muted-foreground">
                {text(
                  "Verificando Apple Pay e Google Pay...",
                  "Checking Apple Pay and Google Pay..."
                )}
              </div>
            )}

            <div className="mt-6 border-t border-border pt-6">
              <button
                type="button"
                onClick={() =>
                  void openStripeCheckout()
                }
                disabled={
                  cardLoading ||
                  walletProcessing
                }
                className="brand-button w-full rounded-2xl px-5 py-3.5 disabled:opacity-50"
              >
                {cardLoading
                  ? text(
                      "Abrindo cartão...",
                      "Opening card payment..."
                    )
                  : text(
                      "Pagar com cartão",
                      "Pay by card"
                    )}
              </button>

              <button
                type="button"
                onClick={
                  goBackToStore
                }
                disabled={
                  walletProcessing
                }
                className="mt-3 w-full rounded-2xl border-2 border-foreground px-5 py-3.5 text-sm font-bold transition-colors hover:bg-foreground hover:text-cream disabled:opacity-50"
              >
                {text(
                  "Voltar ao cardápio",
                  "Back to menu"
                )}
              </button>
            </div>

            <p className="mt-5 text-center text-[11px] leading-5 text-muted-foreground">
              {text(
                "Pagamento processado com segurança pela conta Stripe da própria loja.",
                "Payment is securely processed by the store's own Stripe account."
              )}
            </p>
          </section>
        </div>
      </main>
    </>
  );
}

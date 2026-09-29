"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import AdminHeader from "@/components/AdminHeader";
import { adminFetch } from "@/lib/adminFetch";
import { useLanguage } from "@/i18n/LanguageProvider";

type StoreProfile = {
  id: number;
  name: string;
  countryCode: string;
  currencyCode: string;
  defaultLocale: "pt-BR" | "en-US";
};

type MercadoPagoStatus = {
  connected: boolean;
  cardPaymentsReady?: boolean;
  mercadoPagoUserId?: string | null;
};

type StripeStatus = {
  connected: boolean;
  provider: "STRIPE";
  countryCode: string;
  currencyCode: string;
  recommended: boolean;
  automaticConnection: boolean;
  connectionMode: "CONNECT" | "LEGACY" | "NONE";
  stripeAccountId?: string | null;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  paymentDomainRegistered: boolean;
  walletsReady: boolean;
  connectedAt?: string | null;
  webhookPath: string;
  webhookUrl: string;
};

type PayPalStatus = {
  connected: boolean;
  provider: "PAYPAL";
  countryCode: string;
  currencyCode: string;
  recommended: boolean;
  clientIdLast4?: string | null;
  connectedAt?: string | null;
  sandbox: boolean;
};

const API_URL = "";

export default function AdminPaymentsPage() {
  const { text } =
    useLanguage();

  const searchParams =
    useSearchParams();

  const [profile, setProfile] =
    useState<StoreProfile | null>(
      null
    );

  const [
    mercadoPagoStatus,
    setMercadoPagoStatus,
  ] =
    useState<MercadoPagoStatus | null>(
      null
    );

  const [
    stripeStatus,
    setStripeStatus,
  ] =
    useState<StripeStatus | null>(
      null
    );

  const [
    payPalStatus,
    setPayPalStatus,
  ] =
    useState<PayPalStatus | null>(
      null
    );

  const [
    restrictedApiKey,
    setRestrictedApiKey,
  ] = useState("");

  const [
    webhookSecret,
    setWebhookSecret,
  ] = useState("");

  const [
    publishableKey,
    setPublishableKey,
  ] = useState("");

  const [
    payPalClientId,
    setPayPalClientId,
  ] = useState("");

  const [
    payPalClientSecret,
    setPayPalClientSecret,
  ] = useState("");

  const [
    payPalSandbox,
    setPayPalSandbox,
  ] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    savingWallets,
    setSavingWallets,
  ] = useState(false);

  const [
    savingPayPal,
    setSavingPayPal,
  ] = useState(false);

  const [
    disconnecting,
    setDisconnecting,
  ] = useState(false);

  const [
    disconnectingPayPal,
    setDisconnectingPayPal,
  ] = useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");

      const [
        profileResponse,
        mercadoPagoResponse,
        stripeResponse,
        payPalResponse,
      ] =
        await Promise.all([
          adminFetch(
            `${API_URL}/api/store/profile`,
            {
              cache: "no-store",
            }
          ),
          adminFetch(
            `${API_URL}/api/admin/mercadopago/status`,
            {
              cache: "no-store",
            }
          ),
          adminFetch(
            `${API_URL}/api/admin/stripe-payment/status`,
            {
              cache: "no-store",
            }
          ),
          adminFetch(
            `${API_URL}/api/admin/paypal-payment/status`,
            {
              cache: "no-store",
            }
          ),
        ]);

      if (!profileResponse.ok) {
        throw new Error(
          text(
            "Não foi possível carregar a loja.",
            "Could not load the store."
          )
        );
      }

      const profileData:
        StoreProfile =
        await profileResponse.json();

      setProfile(
        profileData
      );

      if (
        mercadoPagoResponse.ok
      ) {
        setMercadoPagoStatus(
          await mercadoPagoResponse.json()
        );
      }

      if (
        stripeResponse.ok
      ) {
        setStripeStatus(
          await stripeResponse.json()
        );
      }

      if (
        payPalResponse.ok
      ) {
        setPayPalStatus(
          await payPalResponse.json()
        );
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : text(
              "Não foi possível carregar os pagamentos.",
              "Could not load payment settings."
            )
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const stripeResult =
      searchParams.get(
        "stripe"
      );

    if (
      stripeResult ===
      "connected"
    ) {
      setMessage(
        text(
          "Conta Stripe conectada com sucesso. Cartão, Apple Pay e Google Pay passam a usar automaticamente a conta da própria loja.",
          "Stripe account connected successfully. Card, Apple Pay, and Google Pay now automatically use the store's own account."
        )
      );

      void load();
    }

    if (
      stripeResult ===
      "error"
    ) {
      setError(
        text(
          "A conexão com a Stripe não foi concluída. Tente novamente.",
          "Stripe connection was not completed. Try again."
        )
      );
    }
  }, [
    searchParams,
  ]);

  async function connectStripe() {
    setError("");
    setMessage("");

    try {
      setSaving(true);

      const response =
        await adminFetch(
          `${API_URL}/api/admin/stripe-payment/connect`,
          {
            method: "POST",
          }
        );

      if (!response.ok) {
        let detail =
          text(
            "Não foi possível iniciar a conexão com a Stripe.",
            "Could not start Stripe connection."
          );

        try {
          const data =
            await response.json();

          detail =
            data.message ??
            data.detail ??
            data.error ??
            detail;
        } catch {
        }

        throw new Error(
          detail
        );
      }

      const data: {
        authorizationUrl?: string;
      } =
        await response.json();

      if (!data.authorizationUrl) {
        throw new Error(
          text(
            "A Stripe não retornou a página de conexão.",
            "Stripe did not return the connection page."
          )
        );
      }

      window.location.assign(
        data.authorizationUrl
      );

    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : text(
              "Não foi possível conectar a Stripe.",
              "Could not connect Stripe."
            )
      );
      setSaving(false);
    }
  }

  async function disconnectStripe() {
    if (
      !window.confirm(
        text(
          "Desconectar a Stripe desta loja?",
          "Disconnect Stripe from this store?"
        )
      )
    ) {
      return;
    }

    try {
      setDisconnecting(true);
      setError("");
      setMessage("");

      const response =
        await adminFetch(
          `${API_URL}/api/admin/stripe-payment/disconnect`,
          {
            method: "POST",
          }
        );

      if (!response.ok) {
        throw new Error(
          text(
            "Não foi possível desconectar a Stripe.",
            "Could not disconnect Stripe."
          )
        );
      }

      await load();

      setMessage(
        text(
          "Stripe desconectada.",
          "Stripe disconnected."
        )
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : text(
              "Não foi possível desconectar.",
              "Could not disconnect."
            )
      );
    } finally {
      setDisconnecting(false);
    }
  }

  async function connectPayPal(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (
      !payPalClientId.trim() ||
      !payPalClientSecret.trim()
    ) {
      setError(
        text(
          "Informe o Client ID e o Client Secret do PayPal.",
          "Enter the PayPal Client ID and Client Secret."
        )
      );
      return;
    }

    try {
      setSavingPayPal(true);

      const response =
        await adminFetch(
          `${API_URL}/api/admin/paypal-payment/connect`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              clientId:
                payPalClientId.trim(),
              clientSecret:
                payPalClientSecret.trim(),
              sandbox:
                payPalSandbox,
            }),
          }
        );

      if (!response.ok) {
        let detail =
          text(
            "Não foi possível conectar o PayPal.",
            "Could not connect PayPal."
          );

        try {
          const data =
            await response.json();

          detail =
            data.message ??
            data.detail ??
            data.error ??
            detail;
        } catch {
        }

        throw new Error(detail);
      }

      setPayPalStatus(
        await response.json()
      );
      setPayPalClientId("");
      setPayPalClientSecret("");

      setMessage(
        text(
          "PayPal conectado. Os pagamentos vão para a conta PayPal da própria loja.",
          "PayPal connected. Payments go to the store's own PayPal account."
        )
      );

    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : text(
              "Não foi possível conectar o PayPal.",
              "Could not connect PayPal."
            )
      );
    } finally {
      setSavingPayPal(false);
    }
  }

  async function disconnectPayPal() {
    if (
      !window.confirm(
        text(
          "Desconectar o PayPal desta loja?",
          "Disconnect PayPal from this store?"
        )
      )
    ) {
      return;
    }

    try {
      setDisconnectingPayPal(true);
      setError("");
      setMessage("");

      const response =
        await adminFetch(
          `${API_URL}/api/admin/paypal-payment/disconnect`,
          {
            method: "POST",
          }
        );

      if (!response.ok) {
        throw new Error(
          text(
            "Não foi possível desconectar o PayPal.",
            "Could not disconnect PayPal."
          )
        );
      }

      await load();

      setMessage(
        text(
          "PayPal desconectado.",
          "PayPal disconnected."
        )
      );

    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : text(
              "Não foi possível desconectar.",
              "Could not disconnect."
            )
      );
    } finally {
      setDisconnectingPayPal(false);
    }
  }

  async function copyWebhook() {
    if (
      !stripeStatus?.webhookUrl
    ) {
      return;
    }

    await navigator.clipboard.writeText(
      stripeStatus.webhookUrl
    );

    setMessage(
      text(
        "URL do webhook copiada.",
        "Webhook URL copied."
      )
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <AdminHeader />
        <div className="mx-auto max-w-[1120px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-border bg-card p-8">
            <p className="text-sm text-muted-foreground">
              {text(
                "Carregando pagamentos...",
                "Loading payments..."
              )}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const isBrazil =
    (
      profile?.countryCode ??
      "BR"
    ).toUpperCase() === "BR";

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <AdminHeader />

      <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="border-b border-border pb-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            {text(
              "Recebimentos",
              "Payments"
            )}
          </p>

          <h1 className="mt-2 font-display text-4xl uppercase tracking-tight">
            {text(
              "Pagamentos da loja",
              "Store payments"
            )}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            {text(
              "Configure onde o dinheiro dos pedidos dos seus clientes será recebido. O valor das vendas vai para a conta do próprio estabelecimento.",
              "Configure where customer order payments are received. Sales revenue goes to the store's own payment account."
            )}
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <section className="mt-6 rounded-[26px] border border-border bg-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {text(
                  "Roteamento",
                  "Routing"
                )}
              </p>

              <h2 className="mt-1 text-xl font-bold">
                {profile?.name}
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                {profile?.countryCode} ·{" "}
                {profile?.currencyCode}
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full border border-border bg-background px-4 py-2 text-xs font-bold">
              {isBrazil
                ? "Mercado Pago + Dinheiro"
                : "Stripe + PayPal + Dinheiro"}
            </span>
          </div>

          <p className="mt-5 rounded-2xl bg-secondary/70 p-4 text-xs leading-6 text-muted-foreground">
            {isBrazil
              ? text(
                  "Lojas brasileiras continuam usando Mercado Pago e Pix. A Stripe fica disponível para a operação internacional.",
                  "Brazilian stores continue using Mercado Pago and Pix. Stripe is available for international operations."
                )
              : text(
                  "A loja pode conectar Stripe para cartões e carteiras, PayPal como alternativa e também aceitar dinheiro. Cada gateway usa a conta do próprio estabelecimento.",
                  "The store can connect Stripe for cards and wallets, use PayPal as an alternative, and also accept cash. Each gateway uses the store's own account."
                )}
          </p>
        </section>

        <section className="mt-6 rounded-[26px] border border-border bg-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Brasil
              </p>

              <h2 className="mt-1 font-display text-3xl uppercase tracking-tight">
                Mercado Pago
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {text(
                  "Pix e cartão para estabelecimentos brasileiros.",
                  "Pix and card payments for Brazilian stores."
                )}
              </p>
            </div>

            <StatusBadge
              connected={
                !!mercadoPagoStatus
                  ?.connected
              }
              connectedText={text(
                "Conectado",
                "Connected"
              )}
              disconnectedText={text(
                "Não conectado",
                "Not connected"
              )}
            />
          </div>

          <p className="mt-5 text-xs leading-5 text-muted-foreground">
            {text(
              "A conexão Mercado Pago continua disponível em Configurações para não alterar o fluxo brasileiro que já funciona.",
              "The existing Mercado Pago connection remains available in Settings so the current Brazilian flow is unchanged."
            )}
          </p>
        </section>

        <section className="mt-6 rounded-[26px] border border-border bg-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                International
              </p>

              <h2 className="mt-1 font-display text-3xl uppercase tracking-tight">
                Stripe
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {text(
                  "Conecte a conta Stripe da própria pizzaria. O dono entra na Stripe, autoriza o PizzaSystem e volta para cá sem copiar nenhuma chave.",
                  "Connect the restaurant's own Stripe account. The owner signs in to Stripe, authorizes PizzaSystem, and returns here without copying any API keys."
                )}
              </p>
            </div>

            <StatusBadge
              connected={
                !!stripeStatus?.connected
              }
              connectedText={text(
                "Conta conectada",
                "Account connected"
              )}
              disconnectedText={text(
                "Não conectada",
                "Not connected"
              )}
            />
          </div>

          {stripeStatus?.connected ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-sm font-bold text-emerald-800">
                {text(
                  "Stripe Connect ativa",
                  "Stripe Connect active"
                )}
              </p>

              <p className="mt-1 text-xs leading-5 text-emerald-700">
                {stripeStatus.stripeAccountId
                  ? text(
                      `Conta ${stripeStatus.stripeAccountId}. Os pagamentos vão diretamente para esta conta.`,
                      `Account ${stripeStatus.stripeAccountId}. Payments go directly to this account.`
                    )
                  : text(
                      "A integração Stripe desta loja está conectada.",
                      "This store's Stripe integration is connected."
                    )}
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <ConnectionCheck
                  ok={
                    stripeStatus.chargesEnabled
                  }
                  label={text(
                    "Recebimentos",
                    "Payments"
                  )}
                />

                <ConnectionCheck
                  ok={
                    stripeStatus.detailsSubmitted
                  }
                  label={text(
                    "Cadastro Stripe",
                    "Stripe onboarding"
                  )}
                />

                <ConnectionCheck
                  ok={
                    stripeStatus.walletsReady
                  }
                  label="Apple Pay / Google Pay"
                />
              </div>

              {!stripeStatus.chargesEnabled && (
                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                  {text(
                    "A conta foi vinculada, mas a Stripe ainda não liberou cobranças. O dono deve concluir os dados pendentes na própria Stripe.",
                    "The account is linked, but Stripe has not enabled charges yet. The owner must complete any pending Stripe requirements."
                  )}
                </p>
              )}

              {!stripeStatus.paymentDomainRegistered && (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                  {text(
                    "O domínio das carteiras ainda não foi confirmado. Cartão continua disponível, mas Apple Pay/Google Pay podem não aparecer até o registro do domínio ser concluído.",
                    "The wallet domain is not confirmed yet. Card remains available, but Apple Pay/Google Pay may not appear until domain registration is complete."
                  )}
                </p>
              )}

              <button
                type="button"
                onClick={
                  disconnectStripe
                }
                disabled={
                  disconnecting
                }
                className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-700 disabled:opacity-50"
              >
                {disconnecting
                  ? text(
                      "Desconectando...",
                      "Disconnecting..."
                    )
                  : text(
                      "Desconectar Stripe",
                      "Disconnect Stripe"
                    )}
              </button>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-border bg-background p-5">
              <p className="text-sm font-bold">
                {text(
                  "Conexão automática",
                  "Automatic connection"
                )}
              </p>

              <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground">
                {text(
                  "Ao clicar abaixo, você será redirecionado para a Stripe. Entre em uma conta existente ou crie uma conta, autorize o PizzaSystem e pronto. Nenhuma chave API da pizzaria é solicitada.",
                  "Click below to go to Stripe. Sign in to an existing account or create one, authorize PizzaSystem, and you're done. No restaurant API keys are requested."
                )}
              </p>

              <button
                type="button"
                onClick={() =>
                  void connectStripe()
                }
                disabled={
                  saving
                }
                className="mt-5 h-11 rounded-xl bg-[#635BFF] px-6 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving
                  ? text(
                      "Abrindo Stripe...",
                      "Opening Stripe..."
                    )
                  : text(
                      "Conectar com Stripe",
                      "Connect with Stripe"
                    )}
              </button>

              <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
                {text(
                  "Depois da conexão, Cartão, Apple Pay e Google Pay usam automaticamente a conta conectada quando disponíveis.",
                  "After connecting, Card, Apple Pay, and Google Pay automatically use the connected account when available."
                )}
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-[26px] border border-border bg-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                International
              </p>

              <h2 className="mt-1 font-display text-3xl uppercase tracking-tight">
                PayPal
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {text(
                  "Alternativa à Stripe. A loja usa as credenciais da própria conta PayPal Business e recebe diretamente nela.",
                  "An alternative to Stripe. The store uses credentials from its own PayPal Business account and receives payments directly."
                )}
              </p>
            </div>

            <StatusBadge
              connected={
                !!payPalStatus?.connected
              }
              connectedText={text(
                "Pronto para receber",
                "Ready to accept payments"
              )}
              disconnectedText={text(
                "Configuração pendente",
                "Setup required"
              )}
            />
          </div>

          {payPalStatus?.connected ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-sm font-bold text-emerald-800">
                {text(
                  "PayPal conectado",
                  "PayPal connected"
                )}
              </p>

              <p className="mt-1 text-xs leading-5 text-emerald-700">
                {text(
                  `Client ID terminando em •••• ${payPalStatus.clientIdLast4 ?? "----"} · ${payPalStatus.sandbox ? "Sandbox" : "Live"}.`,
                  `Client ID ending in •••• ${payPalStatus.clientIdLast4 ?? "----"} · ${payPalStatus.sandbox ? "Sandbox" : "Live"}.`
                )}
              </p>

              <button
                type="button"
                onClick={
                  disconnectPayPal
                }
                disabled={
                  disconnectingPayPal
                }
                className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-700 disabled:opacity-50"
              >
                {disconnectingPayPal
                  ? text(
                      "Desconectando...",
                      "Disconnecting..."
                    )
                  : text(
                      "Desconectar PayPal",
                      "Disconnect PayPal"
                    )}
              </button>
            </div>
          ) : (
            <form
              onSubmit={
                connectPayPal
              }
              className="mt-6 grid gap-4"
            >
              <label>
                <span className="text-xs font-bold">
                  Client ID
                </span>

                <input
                  type="text"
                  autoComplete="off"
                  value={
                    payPalClientId
                  }
                  onChange={(
                    event
                  ) =>
                    setPayPalClientId(
                      event.target.value
                    )
                  }
                  placeholder="PayPal Client ID"
                  className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary"
                />
              </label>

              <label>
                <span className="text-xs font-bold">
                  Client Secret
                </span>

                <input
                  type="password"
                  autoComplete="off"
                  value={
                    payPalClientSecret
                  }
                  onChange={(
                    event
                  ) =>
                    setPayPalClientSecret(
                      event.target.value
                    )
                  }
                  placeholder="PayPal Client Secret"
                  className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={
                    payPalSandbox
                  }
                  onChange={(
                    event
                  ) =>
                    setPayPalSandbox(
                      event.target.checked
                    )
                  }
                />
                {text(
                  "Usar Sandbox para testes",
                  "Use Sandbox for testing"
                )}
              </label>

              <button
                type="submit"
                disabled={
                  savingPayPal
                }
                className="h-11 w-fit rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {savingPayPal
                  ? text(
                      "Validando...",
                      "Validating..."
                    )
                  : text(
                      "Conectar PayPal",
                      "Connect PayPal"
                    )}
              </button>
            </form>
          )}
        </section>

        <section className="mt-6 rounded-[26px] border border-border bg-card p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                {text(
                  "Sem gateway",
                  "No gateway"
                )}
              </p>

              <h2 className="mt-1 font-display text-3xl uppercase tracking-tight">
                {text(
                  "Dinheiro",
                  "Cash"
                )}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {text(
                  "Disponível no checkout sem Stripe, PayPal ou Mercado Pago. O pedido entra imediatamente para a loja e fica com pagamento pendente até o recebimento.",
                  "Available at checkout without Stripe, PayPal, or Mercado Pago. The order is sent to the store immediately and payment remains pending until cash is received."
                )}
              </p>
            </div>

            <StatusBadge
              connected={true}
              connectedText={text(
                "Disponível",
                "Available"
              )}
              disconnectedText=""
            />
          </div>
        </section>

        <section className="mt-6 rounded-[26px] border border-border bg-card p-6">
          <h2 className="text-sm font-bold">
            {text(
              "Como o pedido internacional funciona",
              "How international checkout works"
            )}
          </h2>

          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            {text(
              "O PizzaSystem cria uma página de pagamento hospedada pela Stripe usando a conta do próprio estabelecimento. Após a confirmação, o webhook marca o pedido como pago e ele entra automaticamente em Recebidos/Cozinha. O PizzaSystem não recebe o valor da venda.",
              "PizzaSystem creates a Stripe-hosted payment page using the store's own Stripe account. After confirmation, the webhook marks the order as paid and it automatically enters the Received/Kitchen flow. PizzaSystem does not receive the sale proceeds."
            )}
          </p>
        </section>
      </div>
    </main>
  );
}

function ConnectionCheck({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <div
      className={
        ok
          ? "rounded-xl border border-emerald-200 bg-white/70 px-3 py-2 text-xs font-bold text-emerald-800"
          : "rounded-xl border border-amber-200 bg-white/70 px-3 py-2 text-xs font-bold text-amber-800"
      }
    >
      {ok
        ? "✓ "
        : "• "}
      {label}
    </div>
  );
}

function StatusBadge({
  connected,
  connectedText,
  disconnectedText,
}: {
  connected: boolean;
  connectedText: string;
  disconnectedText: string;
}) {
  return (
    <span
      className={
        connected
          ? "inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700"
          : "inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700"
      }
    >
      <span
        className={
          connected
            ? "h-2 w-2 rounded-full bg-emerald-500"
            : "h-2 w-2 rounded-full bg-amber-500"
        }
      />

      {connected
        ? connectedText
        : disconnectedText}
    </span>
  );
}

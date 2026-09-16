"use client";

import {
  FormEvent,
  Suspense,
  useEffect,
  useState,
} from "react";

import { useRouter, useSearchParams } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080";

type Customer = {
  authenticated: boolean;
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  profileImageUrl?: string | null;
  emailVerified: boolean;
  googleConnected: boolean;
};

type CustomerOrder = {
  id: number;
  storeId: number | null;
  storeName: string | null;
  storeSlug: string | null;
  customerName: string;
  customerPhone: string;
  total: number | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  createdAt: string;
  publicAccessToken: string;
};

function ContaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawStoreSlug =
    searchParams.get("store");

  const storeSlug =
    rawStoreSlug?.trim() || null;

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

  const [mode, setMode] =
    useState<"login" | "register">(
      "login"
    );

  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [loadingSession, setLoadingSession] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [orders, setOrders] =
    useState<CustomerOrder[]>([]);

  const [ordersOpen, setOrdersOpen] =
    useState(false);

  const [loadingOrders, setLoadingOrders] =
    useState(false);

  const [ordersError, setOrdersError] =
    useState("");

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [password, setPassword] =
    useState("");

  function formatMoney(
    value: number | null
  ) {
    return new Intl.NumberFormat(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    ).format(value ?? 0);
  }

  function formatOrderDate(
    value: string
  ) {
    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        dateStyle: "short",
        timeStyle: "short",
      }
    ).format(date);
  }

  function orderStatusLabel(
    status: string
  ) {
    const labels:
      Record<string, string> = {
        PENDING_PAYMENT:
          "Aguardando pagamento",
        RECEIVED:
          "Pedido recebido",
        PREPARING:
          "Em preparo",
        READY:
          "Pronto",
        OUT_FOR_DELIVERY:
          "Saiu para entrega",
        DELIVERED:
          "Entregue",
        CANCELLED:
          "Cancelado",
      };

    return labels[status] ?? status;
  }

  async function loadOrders() {
    if (loadingOrders) {
      return;
    }

    setOrdersOpen(true);
    setLoadingOrders(true);
    setOrdersError("");

    try {
      const response =
        await fetch(
          `${API_URL}/api/customer/orders`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ??
            "Não foi possível carregar seus pedidos."
        );
      }

      setOrders(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (error) {
      setOrdersError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar seus pedidos."
      );

    } finally {
      setLoadingOrders(false);
    }
  }

  function openOrder(
    order: CustomerOrder
  ) {
    const token =
      order.publicAccessToken;

    if (!token) {
      setOrdersError(
        "Este pedido não possui acesso público disponível."
      );
      return;
    }

    router.push(
      `/pedido/${order.id}?token=${encodeURIComponent(
        token
      )}`
    );
  }

  // =========================
  // CARREGAR SESSÃO
  // =========================

  async function loadSession() {
    try {
      const response =
        await fetch(
          `${API_URL}/api/customer-auth/me`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

      if (!response.ok) {
        setCustomer(null);
        return;
      }

      const data =
        await response.json();

      if (data?.authenticated) {
        setCustomer(data);
      } else {
        setCustomer(null);
      }

    } catch {
      setCustomer(null);

    } finally {
      setLoadingSession(false);
    }
  }

  useEffect(() => {
    void loadSession();
  }, []);

  // =========================
  // LOGIN
  // =========================

  async function handleLogin(
    event: FormEvent
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/api/customer-auth/login`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              email,
              password,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ??
            "Não foi possível entrar."
        );
      }

      setCustomer(data);

      setPassword("");

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar."
      );

    } finally {
      setSubmitting(false);
    }
  }

  // =========================
  // CADASTRO
  // =========================

  async function handleRegister(
    event: FormEvent
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/api/customer-auth/register`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              name,
              email,
              phone,
              password,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ??
            "Não foi possível criar a conta."
        );
      }

      setCustomer(data);

      setPassword("");

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível criar a conta."
      );

    } finally {
      setSubmitting(false);
    }
  }

  // =========================
  // LOGOUT
  // =========================

  async function handleLogout() {
    try {
      await fetch(
        `${API_URL}/api/customer-auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );
    } finally {
      setCustomer(null);
      setMode("login");
    }
  }

  // =========================
  // CARREGANDO
  // =========================

  if (loadingSession) {
    return (
      <main className="min-h-screen bg-background px-4 py-12 text-foreground">
        <div className="mx-auto max-w-4xl">
          <div className="skeleton h-10 w-48 rounded-xl" />

          <div className="mt-8 grid gap-6 md:grid-cols-[1fr_360px]">
            <div className="skeleton h-72 rounded-[28px]" />
            <div className="skeleton h-72 rounded-[28px]" />
          </div>
        </div>
      </main>
    );
  }

  // =========================
  // CLIENTE LOGADO
  // =========================

  if (customer) {
    return (
      <main className="min-h-screen bg-background pb-16 text-foreground">
        <header className="border-b border-border bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={
                goBackToStore
              }
              className="text-sm font-bold"
            >
              ← Voltar ao cardápio
            </button>

            <span className="font-display text-2xl tracking-tight">
              Minha conta
            </span>

            <button
              type="button"
              onClick={() =>
                void handleLogout()
              }
              className="text-sm font-bold text-primary"
            >
              Sair
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <section className="rounded-[30px] border border-border bg-card p-6 shadow-[0_18px_60px_-30px] shadow-foreground/40 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-3xl font-bold text-primary-foreground">
                {customer.profileImageUrl ? (
                  <img
                    src={
                      customer.profileImageUrl
                    }
                    alt={customer.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  customer.name
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>

              <div>
                <p className="font-mono-brand text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Cliente
                </p>

                <h1 className="mt-1 font-display text-4xl tracking-tight sm:text-5xl">
                  Olá,{" "}
                  {customer.name}
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                  {customer.email}
                </p>
              </div>
            </div>
          </section>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <button
              type="button"
              onClick={() =>
                void loadOrders()
              }
              className="rounded-[26px] border border-border bg-card p-6 text-left shadow-[0_14px_45px_-30px] shadow-foreground/40 transition-transform hover:-translate-y-0.5"
            >
              <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Histórico
              </p>

              <h2 className="mt-2 font-display text-2xl tracking-tight">
                Meus pedidos
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Acompanhe pedidos feitos com sua conta.
              </p>
            </button>

            <button
              type="button"
              className="rounded-[26px] border border-border bg-card p-6 text-left shadow-[0_14px_45px_-30px] shadow-foreground/40 transition-transform hover:-translate-y-0.5"
            >
              <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Fidelidade
              </p>

              <h2 className="mt-2 font-display text-2xl tracking-tight">
                Selos
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Veja seus benefícios em cada loja.
              </p>
            </button>

            <button
              type="button"
              className="rounded-[26px] border border-border bg-card p-6 text-left shadow-[0_14px_45px_-30px] shadow-foreground/40 transition-transform hover:-translate-y-0.5"
            >
              <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Perfil
              </p>

              <h2 className="mt-2 font-display text-2xl tracking-tight">
                Meus dados
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Nome, telefone, endereços e preferências.
              </p>
            </button>
          </div>

          {ordersOpen && (
            <section className="mt-6 rounded-[28px] border border-border bg-card p-6 sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Histórico
                  </p>

                  <h2 className="mt-1 font-display text-3xl tracking-tight">
                    Meus pedidos
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setOrdersOpen(false)
                  }
                  className="self-start rounded-full border border-border px-4 py-2 text-sm font-bold transition-colors hover:bg-secondary"
                >
                  Fechar
                </button>
              </div>

              {loadingOrders ? (
                <div className="mt-6 space-y-3">
                  <div className="skeleton h-28 rounded-2xl" />
                  <div className="skeleton h-28 rounded-2xl" />
                </div>
              ) : ordersError ? (
                <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-primary">
                    {ordersError}
                  </p>
                </div>
              ) : orders.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-secondary p-5">
                  <p className="font-bold">
                    Você ainda não tem pedidos vinculados a esta conta.
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Os próximos pedidos feitos enquanto você estiver logado aparecerão aqui.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {orders.map(
                    (order) => (
                      <article
                        key={order.id}
                        className="rounded-2xl border border-border bg-background p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-foreground px-3 py-1 font-mono-brand text-[10px] font-bold uppercase tracking-wider text-background">
                                Pedido #{order.id}
                              </span>

                              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">
                                {orderStatusLabel(
                                  order.status
                                )}
                              </span>
                            </div>

                            <h3 className="mt-3 truncate font-display text-2xl tracking-tight">
                              {order.storeName ??
                                "Loja"}
                            </h3>

                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatOrderDate(
                                order.createdAt
                              )}
                            </p>
                          </div>

                          <div className="sm:text-right">
                            <p className="font-display text-2xl tracking-tight text-primary">
                              {formatMoney(
                                order.total
                              )}
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                openOrder(
                                  order
                                )
                              }
                              className="mt-3 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-transform active:scale-95"
                            >
                              Ver pedido
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  )}
                </div>
              )}
            </section>
          )}

          <section className="mt-6 rounded-[28px] border border-border bg-card p-6">
            <h2 className="font-display text-2xl tracking-tight">
              Status da conta
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-secondary p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  E-mail
                </p>

                <p className="mt-1 font-semibold">
                  {customer.emailVerified
                    ? "Verificado"
                    : "Ainda não verificado"}
                </p>
              </div>

              <div className="rounded-2xl bg-secondary p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Google
                </p>

                <p className="mt-1 font-semibold">
                  {customer.googleConnected
                    ? "Conectado"
                    : "Não conectado"}
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // =========================
  // LOGIN / CADASTRO
  // =========================

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <div className="mx-auto max-w-lg">
        <button
          type="button"
          onClick={
            goBackToStore
          }
          className="text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Voltar ao cardápio
        </button>

        <div className="mt-6 rounded-[30px] border border-border bg-card p-6 shadow-[0_18px_60px_-30px] shadow-foreground/40 sm:p-8">
          <p className="font-mono-brand text-xs font-bold uppercase tracking-[0.18em] text-primary">
            PizzaSystem
          </p>

          <h1 className="mt-2 font-display text-4xl tracking-tight">
            {mode === "login"
              ? "Entrar na sua conta"
              : "Criar sua conta"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            A conta é opcional. Você pode continuar comprando sem login normalmente.
          </p>

          <div className="mt-6 grid grid-cols-2 rounded-2xl bg-secondary p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                mode === "login"
                  ? "bg-card shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Entrar
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                mode === "register"
                  ? "bg-card shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Criar conta
            </button>
          </div>

          <form
            onSubmit={
              mode === "login"
                ? handleLogin
                : handleRegister
            }
            className="mt-6 space-y-4"
          >
            {mode === "register" && (
              <>
                <div>
                  <label className="text-sm font-bold">
                    Nome
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value
                      )
                    }
                    required
                    className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none transition focus:border-primary"
                    placeholder="Seu nome"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold">
                    Telefone
                  </label>

                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(
                        event.target.value
                      )
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none transition focus:border-primary"
                    placeholder="(19) 99999-9999"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-bold">
                E-mail
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                required
                className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none transition focus:border-primary"
                placeholder="voce@email.com"
              />
            </div>

            <div>
              <label className="text-sm font-bold">
                Senha
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                required
                minLength={8}
                className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none transition focus:border-primary"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm font-semibold text-primary">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="brand-button min-h-12 w-full rounded-2xl px-5 py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Aguarde..."
                : mode === "login"
                  ? "Entrar"
                  : "Criar conta"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              ou
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            disabled
            className="flex min-h-12 w-full items-center justify-center rounded-2xl border-2 border-border px-5 text-sm font-bold opacity-60"
          >
            Continuar com Google
          </button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Login com Google entra na próxima etapa.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function ContaPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background px-4 py-12 text-foreground">
          <div className="mx-auto max-w-4xl">
            <div className="skeleton h-10 w-48 rounded-xl" />

            <div className="mt-8 grid gap-6 md:grid-cols-[1fr_360px]">
              <div className="skeleton h-72 rounded-[28px]" />
              <div className="skeleton h-72 rounded-[28px]" />
            </div>
          </div>
        </main>
      }
    >
      <ContaContent />
    </Suspense>
  );
}
"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type IconProps = {
  className?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080";

/* =========================
   ÍCONES
========================= */

function LockIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
      />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function EyeIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle
        cx="12"
        cy="12"
        r="2.5"
      />
    </svg>
  );
}

function EyeOffIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.7 5.2A10 10 0 0 1 12 5c6 0 9.5 7 9.5 7a15 15 0 0 1-2.2 3.1" />
      <path d="M6.2 6.2C3.7 8 2.5 12 2.5 12s3.5 7 9.5 7a9.8 9.8 0 0 0 4-.8" />
      <path d="M9.8 9.8a3 3 0 0 0 4.4 4.4" />
    </svg>
  );
}

function AlertIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />
      <path d="M12 8v5" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function ArrowLeftIcon({
  className = "h-4 w-4",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.2"
      />

      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* =========================
   PÁGINA
========================= */

export default function AdminLoginPage() {
  const router =
    useRouter();

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const normalizedEmail =
      email.trim();

    if (
      !normalizedEmail ||
      !password
    ) {
      setError(
        "Preencha o e-mail e a senha."
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          `${API_URL}/api/auth/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            cache:
              "no-store",

            body:
              JSON.stringify({
                email:
                  normalizedEmail,

                password,
              }),
          }
        );

      if (
        response.status ===
          401 ||
        response.status ===
          403
      ) {
        throw new Error(
          "E-mail ou senha inválidos."
        );
      }

      if (!response.ok) {
        throw new Error(
          "Não foi possível entrar agora. Tente novamente."
        );
      }

      router.replace(
        "/admin"
      );

      router.refresh();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível realizar o login."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">

      {/* FUNDO */}

      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

        <div className="absolute bottom-[-220px] right-[-80px] h-[420px] w-[420px] rounded-full bg-muted blur-3xl" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_45%,hsl(var(--background))_100%)]" />
      </div>

      <div className="relative w-full max-w-[430px]">

        {/* MARCA */}

        <div className="mb-5 flex justify-center">

          <button
            type="button"
            onClick={() =>
              router.push(
                "/"
              )
            }
            className="
              inline-flex items-center gap-2
              rounded-full border border-border
              bg-card px-3.5 py-2
              text-xs font-bold
              text-muted-foreground
              shadow-sm transition
              hover:bg-muted
              hover:text-foreground
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-ring
            "
          >
            <ArrowLeftIcon />

            Voltar ao cardápio
          </button>

        </div>

        {/* CARD */}

        <section className="rounded-[28px] border border-border bg-card/95 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.08)] backdrop-blur sm:p-8">

          <div>

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <span className="font-display text-xl leading-none">
                  P
                </span>
              </div>

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                  PizzaSystem
                </p>

                <p className="mt-0.5 text-sm font-semibold text-muted-foreground">
                  Área administrativa
                </p>

              </div>

            </div>

            <div className="mt-7">

              <h1 className="font-display text-4xl uppercase leading-none tracking-tight text-foreground">
                Bem-vindo
              </h1>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Acesse o painel para gerenciar pedidos, cardápio e operação da pizzaria.
              </p>

            </div>

          </div>

          <form
            onSubmit={
              handleSubmit
            }
            className="mt-7 space-y-5"
          >

            {/* EMAIL */}

            <div>

              <label
                htmlFor="email"
                className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground"
              >
                E-mail
              </label>

              <input
                id="email"
                type="email"
                inputMode="email"
                value={
                  email
                }
                onChange={(
                  event
                ) =>
                  setEmail(
                    event.target.value
                  )
                }
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                disabled={
                  loading
                }
                className="
                  h-12 w-full
                  rounded-xl
                  border border-input
                  bg-background
                  px-4
                  text-sm text-foreground
                  outline-none transition
                  placeholder:text-muted-foreground
                  focus:border-primary
                  focus:ring-2
                  focus:ring-primary/10
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
                placeholder="seu@email.com"
              />

            </div>

            {/* SENHA */}

            <div>

              <label
                htmlFor="password"
                className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground"
              >
                Senha
              </label>

              <div className="relative">

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    password
                  }
                  onChange={(
                    event
                  ) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  autoComplete="current-password"
                  required
                  disabled={
                    loading
                  }
                  className="
                    h-12 w-full
                    rounded-xl
                    border border-input
                    bg-background
                    pl-4 pr-12
                    text-sm text-foreground
                    outline-none transition
                    placeholder:text-muted-foreground
                    focus:border-primary
                    focus:ring-2
                    focus:ring-primary/10
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                  placeholder="Sua senha"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current
                    )
                  }
                  disabled={
                    loading
                  }
                  aria-label={
                    showPassword
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                  className="
                    absolute right-2 top-1/2
                    flex h-8 w-8
                    -translate-y-1/2
                    items-center justify-center
                    rounded-lg
                    text-muted-foreground
                    transition
                    hover:bg-muted
                    hover:text-foreground
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-ring
                    disabled:pointer-events-none
                    disabled:opacity-50
                  "
                >
                  {showPassword ? (
                    <EyeOffIcon />
                  ) : (
                    <EyeIcon />
                  )}
                </button>

              </div>

            </div>

            {/* ERRO */}

            {error && (
              <div
                className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5"
                role="alert"
                aria-live="polite"
              >
                <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />

                <p className="text-sm font-medium leading-5 text-red-700">
                  {error}
                </p>
              </div>
            )}

            {/* ENTRAR */}

            <button
              type="submit"
              disabled={
                loading
              }
              className="
                inline-flex h-12
                w-full items-center
                justify-center gap-2
                rounded-xl
                bg-primary
                px-5
                text-sm font-bold
                text-primary-foreground
                transition
                hover:-translate-y-0.5
                hover:shadow-md
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-ring
                focus-visible:ring-offset-2
                disabled:pointer-events-none
                disabled:opacity-60
              "
            >
              {loading ? (
                <>
                  <Spinner />
                  Entrando
                </>
              ) : (
                <>
                  <LockIcon className="h-4 w-4" />
                  Entrar no painel
                </>
              )}
            </button>

          </form>

          <div className="mt-6 border-t border-border pt-5">

            <div className="flex items-start gap-3">

              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <LockIcon className="h-4 w-4" />
              </div>

              <p className="text-xs leading-5 text-muted-foreground">
                Área restrita à administração. A sessão é mantida por cookie seguro definido pelo servidor.
              </p>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}

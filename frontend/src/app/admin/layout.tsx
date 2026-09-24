"use client";

import {
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

type AdminLayoutProps = {
  children: ReactNode;
};

const API_URL = "";

function PizzaSystemLoader() {
  return (
    <div
      className="flex flex-col items-center"
      role="status"
      aria-live="polite"
      aria-label="Verificando acesso administrativo"
    >
      <div className="relative flex h-14 w-14 items-center justify-center">

        <svg
          viewBox="0 0 64 64"
          className="absolute h-14 w-14 animate-spin text-primary"
          aria-hidden="true"
        >
          <circle
            cx="32"
            cy="32"
            r="27"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="42 128"
          />
        </svg>

        <svg
          viewBox="0 0 48 48"
          className="h-9 w-9 text-foreground"
          aria-hidden="true"
        >
          <circle
            cx="24"
            cy="24"
            r="17"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
          />

          <path
            d="M24 7v34M7 24h34M12 12l24 24M36 12 12 36"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.22"
          />

          <circle
            cx="18"
            cy="17"
            r="2"
            fill="currentColor"
          />

          <circle
            cx="30"
            cy="19"
            r="2"
            fill="currentColor"
          />

          <circle
            cx="23"
            cy="29"
            r="2"
            fill="currentColor"
          />

          <circle
            cx="32"
            cy="31"
            r="1.7"
            fill="currentColor"
          />
        </svg>

      </div>

      <div className="mt-4 text-center">

        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
          PizzaSystem
        </p>

        <p className="mt-1.5 text-sm font-medium text-muted-foreground">
          Verificando acesso
        </p>

      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const router =
    useRouter();

  const pathname =
    usePathname();

  /*
   * Depois que a sessão é validada uma vez,
   * não repetimos /auth/me a cada troca de
   * página dentro do painel.
   *
   * Isso elimina a piscada do loader entre
   * Pedidos -> Cozinha -> Relatórios etc.
   */
  const sessionVerifiedRef =
    useRef(false);

  const [
    checkingAuth,
    setCheckingAuth,
  ] = useState(
    pathname !== "/admin/login"
  );

  /*
   * O loader só aparece se a validação
   * realmente demorar um pouco.
   *
   * Em respostas rápidas, evita aquele flash
   * visual de "Verificando acesso...".
   */
  const [
    showLoader,
    setShowLoader,
  ] = useState(false);

  useEffect(() => {
    if (
      pathname ===
      "/admin/login"
    ) {
      setCheckingAuth(false);
      setShowLoader(false);

      /*
       * Ao voltar para o login, consideramos
       * a sessão local como não validada.
       * Depois de um novo login, a primeira
       * rota protegida será checada novamente.
       */
      sessionVerifiedRef.current =
        false;

      return;
    }

    /*
     * Se a sessão já foi validada neste ciclo
     * do layout, navegar entre páginas do admin
     * não precisa disparar nova verificação.
     */
    if (
      sessionVerifiedRef.current
    ) {
      setCheckingAuth(false);
      setShowLoader(false);
      return;
    }

    setCheckingAuth(true);
    setShowLoader(false);

    const controller =
      new AbortController();

    const loaderTimer =
      window.setTimeout(
        () => {
          setShowLoader(true);
        },
        180
      );

    async function checkAuth() {
      try {
        const response =
          await fetch(
            `${API_URL}/api/auth/me`,
            {
              method: "GET",
              credentials:
                "include",
              cache:
                "no-store",
              signal:
                controller.signal,
              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        if (!response.ok) {
          router.replace(
            "/admin/login"
          );

          return;
        }

        let data:
          | {
              authenticated?: boolean;
            }
          | null = null;

        try {
          data =
            await response.json();

        } catch {
          data = null;
        }

        if (
          !data ||
          data.authenticated !==
            true
        ) {
          router.replace(
            "/admin/login"
          );

          return;
        }

        sessionVerifiedRef.current =
          true;

        setCheckingAuth(false);
        setShowLoader(false);

      } catch (error) {
        if (
          error instanceof
            DOMException &&
          error.name ===
            "AbortError"
        ) {
          return;
        }

        router.replace(
          "/admin/login"
        );

      } finally {
        window.clearTimeout(
          loaderTimer
        );
      }
    }

    checkAuth();

    return () => {
      window.clearTimeout(
        loaderTimer
      );

      controller.abort();
    };
  }, [
    pathname,
    router,
  ]);

  /*
   * Login continua público dentro do
   * agrupamento /admin.
   */
  if (
    pathname ===
    "/admin/login"
  ) {
    return children;
  }

  /*
   * Nunca exibimos conteúdo protegido
   * antes da validação da sessão.
   */
  if (checkingAuth) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(currentColor 1px, transparent 1px)",

            backgroundSize:
              "22px 22px",
          }}
        />

        {showLoader && (
          <div className="relative animate-in fade-in duration-200">
            <PizzaSystemLoader />
          </div>
        )}

      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:pl-20">
      {children}
    </div>
  );
}

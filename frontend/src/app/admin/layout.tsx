"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  useEffect(() => {
    async function checkAuth() {
      /*
       * A página de login precisa ficar pública.
       */
      if (pathname === "/admin/login") {
        setCheckingAuth(false);
        return;
      }

      try {
        const response =
          await fetch(
            "http://localhost:8080/api/auth/me",
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          );

        if (!response.ok) {
          router.replace(
            "/admin/login"
          );

          return;
        }

        const data =
          await response.json();

        if (!data.authenticated) {
          router.replace(
            "/admin/login"
          );

          return;
        }

        setCheckingAuth(false);

      } catch (error) {
        console.error(
          "Erro ao verificar autenticação:",
          error
        );

        router.replace(
          "/admin/login"
        );
      }
    }

    checkAuth();
  }, [
    pathname,
    router,
  ]);

  /*
   * Login precisa renderizar normalmente,
   * sem ficar preso na tela de verificação.
   */
  if (pathname === "/admin/login") {
    return children;
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="rounded-2xl border border-gray-200 bg-white px-8 py-6 shadow-sm">
          <p className="font-semibold text-gray-700">
            Verificando acesso...
          </p>
        </div>
      </main>
    );
  }

  return children;
}
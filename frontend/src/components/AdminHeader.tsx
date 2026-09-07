"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import { useState } from "react";

import {
  clearAdminCsrfToken,
} from "@/lib/adminFetch";

const links = [
  {
    label: "Painel",
    href: "/admin",
  },
  {
    label: "Pedidos",
    href: "/admin/pedidos",
  },
  {
    label: "Cozinha",
    href: "/admin/cozinha",
  },
  {
    label: "Histórico",
    href: "/admin/historico",
  },
  {
    label: "Relatórios",
    href: "/admin/relatorios",
  },
  {
    label: "Caixa",
    href: "/admin/caixa",
  },
  {
    label: "Cupons",
    href: "/admin/cupons",
  },
  {
    label: "Entregas",
    href: "/admin/entregas",
  },
  {
    label: "Cardápio",
    href: "/admin/cardapio",
  },
  {
    label: "Categorias",
    href: "/admin/categorias",
  },
  {
    label: "Bordas",
    href: "/admin/bordas",
  },
  {
    label: "Horários",
    href: "/admin/horarios",
  },
  {
    label: "Configurações",
    href: "/admin/configuracoes",
  },
];

type AdminHeaderProps = {
  title?: string;
};

export default function AdminHeader({
  title = "Painel administrativo",
}: AdminHeaderProps) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      const response =
        await fetch(
          "http://localhost:8080/api/auth/logout",
          {
            method: "POST",
            credentials: "include",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Não foi possível sair."
        );
      }

      clearAdminCsrfToken();

      router.replace(
        "/admin/login"
      );

      router.refresh();

    } catch (error) {
      console.error(
        "Erro ao realizar logout:",
        error
      );

      alert(
        "Não foi possível sair. Tente novamente."
      );

    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="border-b bg-white">

      <div className="mx-auto max-w-7xl px-6 py-5">

        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

          <div>

            <Link
              href="/admin"
              className="text-sm font-semibold text-gray-500 transition hover:text-black"
            >
              PizzaSystem
            </Link>

            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              {title}
            </h1>

          </div>

          <nav className="flex flex-wrap gap-2">

            {links.map(
              (link) => {

                const active =
                  pathname ===
                  link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={
                      active
                        ? "rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
                        : "rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    }
                  >
                    {link.label}
                  </Link>
                );
              }
            )}

            <Link
              href="/cardapio"
              className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
            >
              Ver site
            </Link>

            <button
              type="button"
              onClick={
                handleLogout
              }
              disabled={
                loggingOut
              }
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loggingOut
                ? "Saindo..."
                : "Sair"}
            </button>

          </nav>

        </div>

      </div>

    </header>
  );
}
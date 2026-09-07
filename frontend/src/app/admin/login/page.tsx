"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

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
          data.message ||
            "Não foi possível entrar."
        );
      }

      router.replace("/admin");
      router.refresh();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao realizar login."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">

      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            PizzaSystem
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Painel administrativo
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Entre com suas credenciais para
            acessar o gerenciamento da pizzaria.
          </p>

        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          <div>

            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              E-mail
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              autoComplete="username"
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-gray-500"
              placeholder="admin@pizzasystem.com"
            />

          </div>

          <div>

            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Senha
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-gray-500"
              placeholder="Sua senha"
            />

          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Entrando..."
              : "Entrar"}
          </button>

        </form>

        <div className="mt-6 border-t border-gray-100 pt-6 text-center">

          <button
            type="button"
            onClick={() =>
              router.push("/cardapio")
            }
            className="text-sm font-semibold text-gray-500 transition hover:text-gray-900"
          >
            ← Voltar para o cardápio
          </button>

        </div>

      </div>

    </main>
  );
}
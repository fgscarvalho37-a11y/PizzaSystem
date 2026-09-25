"use client";

import {
  useEffect,
} from "react";

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      "Erro inesperado no checkout:",
      error
    );
  }, [
    error,
  ]);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 py-10 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">

        <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          Checkout
        </p>

        <h1 className="mt-2 font-display text-3xl tracking-tight">
          Não foi possível abrir o checkout
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Houve uma falha temporária ao carregar esta etapa. Tente novamente.
        </p>

        <button
          type="button"
          onClick={
            reset
          }
          className="brand-button mt-6 min-h-11 w-full rounded-xl px-5"
        >
          Tentar novamente
        </button>

        <button
          type="button"
          onClick={() =>
            window.history.back()
          }
          className="mt-3 min-h-11 w-full rounded-xl border border-border px-5 text-sm font-bold"
        >
          Voltar ao cardápio
        </button>

      </div>
    </main>
  );
}

"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import AdminHeader from "@/components/AdminHeader";
import { useLanguage } from "@/i18n/LanguageProvider";
import { adminFetch } from "@/lib/adminFetch";

type Storefront = {
  slug: string;
  publicUrl: string;
  baseDomain: string | null;
  hostedSubdomainEnabled: boolean;
};

export default function LojaOnlinePage() {
  const { text } = useLanguage();
  const [
    storefront,
    setStorefront,
  ] = useState<Storefront | null>(
    null
  );

  const [
    slug,
    setSlug,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  async function loadStorefront() {
    try {
      setLoading(true);
      setError("");

      const response =
        await adminFetch(
          "/api/store/storefront",
          {
            method: "GET",
            cache: "no-store",
          }
        );

      if (!response.ok) {
        throw new Error(
          text("Não foi possível carregar o endereço da loja.", "Could not load the store address.")
        );
      }

      const data:
        Storefront =
        await response.json();

      setStorefront(
        data
      );

      setSlug(
        data.slug
      );

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar a loja."
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStorefront();
  }, []);

  async function save(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response =
        await adminFetch(
          "/api/store/storefront",
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                slug,
              }),
          }
        );

      const responseText =
        await response.text();

      let data:
        Storefront | {
          message?: string;
        } | null =
        null;

      try {
        data =
          responseText
            ? JSON.parse(
                responseText
              )
            : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        const message =
          data &&
          "message" in data
            ? data.message
            : null;

        throw new Error(
          message ||
            text(`Não foi possível salvar o endereço. Código ${response.status}.`, `Could not save address. Code ${response.status}.`)
        );
      }

      if (
        !data ||
        !("slug" in data)
      ) {
        throw new Error(
          text("O servidor não retornou o endereço salvo.", "The server did not return a saved address.")
        );
      }

      setStorefront(
        data
      );

      setSlug(
        data.slug
      );

      setMessage(
        text("Endereço da loja salvo.", "Store address saved.")
      );

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : text("Não foi possível salvar.", "Could not save.")
      );

    } finally {
      setSaving(false);
    }
  }

  async function copyUrl() {
    if (!storefront?.publicUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        storefront.publicUrl
      );

      setMessage(
        "Link copiado."
      );

    } catch {
      setError(
        text("Não foi possível copiar o link.", "Could not copy the link.")
      );
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <AdminHeader />

      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:px-8">

        <div className="flex flex-col gap-3 border-b border-border pb-7">

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Loja online
          </p>

          <h1 className="font-display text-4xl uppercase leading-none tracking-tight text-foreground sm:text-5xl">
            {text("Endereço do cardápio", "Menu address")}
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {text("Escolha um endereço simples para compartilhar com seus clientes. O cardápio continua hospedado pelo PizzaSystem.", "Choose a simple web address to share with customers. Your menu stays hosted by PizzaSystem.")}
          </p>

        </div>

        <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">

          {loading ? (
            <div className="h-44 animate-pulse rounded-2xl bg-muted" />
          ) : (
            <>
              <form
                onSubmit={save}
                className="space-y-5"
              >

                <div>
                  <label
                    htmlFor="store-slug"
                    className="text-xs font-bold text-foreground"
                  >
                    {text("Endereço da loja", "Store address")}
                  </label>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {text("Use o nome da pizzaria sem espaços. Exemplo: pizzaria-do-joao.", "Use your restaurant name without spaces. Example: my-pizza-place.")}
                  </p>

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">

                    <input
                      id="store-slug"
                      value={slug}
                      onChange={(event) =>
                        setSlug(
                          event.target.value
                        )
                      }
                      autoCapitalize="none"
                      spellCheck={false}
                      maxLength={60}
                      className="h-12 flex-1 rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                      placeholder="minha-pizzaria"
                    />

                    <button
                      type="submit"
                      disabled={
                        saving
                      }
                      className="h-12 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                    >
                      {saving
                        ? "Salvando..."
                        : "Criar endereço"}
                    </button>

                  </div>
                </div>

              </form>

              {storefront && (
                <div className="mt-6 rounded-2xl border border-border bg-background p-5">

                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    {text("Link público", "Public link")}
                  </p>

                  <p className="mt-2 break-all text-sm font-semibold text-foreground">
                    {storefront.publicUrl}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">

                    <a
                      href={
                        storefront.publicUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
                    >
                      Abrir loja
                    </a>

                    <button
                      type="button"
                      onClick={
                        copyUrl
                      }
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-bold text-foreground transition hover:bg-muted"
                    >
                      Copiar link
                    </button>

                    <Link
                      href="/admin/cardapio"
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-bold text-foreground transition hover:bg-muted"
                    >
                      Cadastrar produtos
                    </Link>

                  </div>

                </div>
              )}

              <div className="mt-5 rounded-2xl border border-border bg-muted/35 p-5">

                <p className="text-sm font-bold text-foreground">
                  {text("Endereço hospedado", "Hosted address")}
                </p>

                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {storefront?.hostedSubdomainEnabled
                    ? `Seu endereço está usando o domínio hospedado .${storefront.baseDomain}. Você não precisa comprar um domínio próprio para usar esse link.`
                    : "Enquanto o domínio hospedado da Orbitta não estiver ativado, o cardápio usa o endereço principal do PizzaSystem. O link continua funcionando normalmente."}
                </p>

              </div>

              {(message ||
                error) && (
                <div
                  className={`mt-5 rounded-xl border p-4 text-sm font-medium ${
                    error
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {error ||
                    message}
                </div>
              )}
            </>
          )}

        </section>

      </div>
    </main>
  );
}

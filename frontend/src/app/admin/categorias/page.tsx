"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import AdminHeader from "@/components/AdminHeader";
import { adminFetch } from "@/lib/adminFetch";

const API_URL = "";

type Category = {
  id: number;
  name: string;
};

export default function AdminCategoriasPage() {
  const [
    categories,
    setCategories,
  ] = useState<Category[]>([]);

  const [
    name,
    setName,
  ] = useState("");

  const [
    editingId,
    setEditingId,
  ] = useState<number | null>(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  // =========================
  // CARREGAR CATEGORIAS
  // =========================

  async function loadCategories() {
    try {
      setErrorMessage("");

      const response =
        await adminFetch(
          `${API_URL}/api/categories`,
          {
            cache: "no-store",
            credentials: "include",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Erro ao carregar categorias"
        );
      }

      const data: Category[] =
        await response.json();

      setCategories(data);

    } catch {
      setErrorMessage(
        "Não foi possível carregar as categorias."
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  // =========================
  // EDITAR
  // =========================

  function editCategory(
    category: Category
  ) {
    setEditingId(
      category.id
    );

    setName(
      category.name
    );

    setErrorMessage("");
    setSuccessMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =========================
  // CANCELAR EDIÇÃO
  // =========================

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setErrorMessage("");
  }

  // =========================
  // SALVAR
  // =========================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!name.trim()) {
      setErrorMessage(
        "Informe o nome da categoria."
      );

      return;
    }

    try {
      setSaving(true);

      const url =
        editingId
          ? `${API_URL}/api/categories/${editingId}`
          : `${API_URL}/api/categories`;

      const method =
        editingId
          ? "PUT"
          : "POST";

      const response =
        await adminFetch(
          url,
          {
            method,

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials: "include",

            body:
              JSON.stringify({
                name:
                  name.trim(),
              }),
          }
        );

      if (!response.ok) {
        throw new Error(
          "Erro ao salvar categoria"
        );
      }

      setSuccessMessage(
        editingId
          ? "Categoria atualizada com sucesso."
          : "Categoria cadastrada com sucesso."
      );

      setName("");
      setEditingId(null);

      await loadCategories();

    } catch {
      setErrorMessage(
        "Não foi possível salvar a categoria."
      );

    } finally {
      setSaving(false);
    }
  }

  // =========================
  // TELA
  // =========================

  return (
    <main className="min-h-screen bg-background">

      <AdminHeader />

      <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 lg:px-8">

        <div className="mb-6 border-b border-border pb-6">

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Cardápio
          </p>

          <h2 className="mt-2 font-display text-4xl uppercase leading-none tracking-tight text-foreground">
            Categorias
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Organize os produtos do cardápio em grupos como pizzas, esfihas, bebidas e outros itens.
          </p>

        </div>

        {/* =========================
            MENSAGENS
            ========================= */}

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">

            <p className="font-semibold text-red-700">
              Atenção
            </p>

            <p className="mt-1 text-sm text-red-600">
              {errorMessage}
            </p>

          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">

            <p className="font-semibold text-emerald-700">
              Tudo certo
            </p>

            <p className="mt-1 text-sm text-emerald-700">
              {successMessage}
            </p>

          </div>
        )}

        {/* =========================
            FORMULÁRIO
            ========================= */}

        <form
          onSubmit={handleSubmit}
          className="rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
        >

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h3 className="font-display text-2xl uppercase tracking-tight text-foreground">
                {editingId
                  ? "Editar categoria"
                  : "Nova categoria"}
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                {editingId
                  ? "Altere o nome da categoria selecionada."
                  : "Crie uma nova categoria para organizar o cardápio."}
              </p>

            </div>

            {editingId && (
              <button
                type="button"
                onClick={
                  cancelEdit
                }
                className="h-9 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 transition hover:bg-red-100"
              >
                Cancelar edição
              </button>
            )}

          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">

            <input
              required
              value={
                name
              }
              onChange={(
                event
              ) =>
                setName(
                  event.target.value
                )
              }
              placeholder="Ex: Bebidas"
              className="h-12 flex-1 rounded-xl border border-input px-4 outline-none transition focus:border-border"
            />

            <button
              type="submit"
              disabled={
                saving
              }
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-sm disabled:pointer-events-none disabled:opacity-50"
            >
              {saving
                ? "Salvando..."
                : editingId
                  ? "Salvar alterações"
                  : "Cadastrar categoria"}
            </button>

          </div>

        </form>

        {/* =========================
            LISTA
            ========================= */}

        <section className="mt-6 rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h3 className="font-display text-2xl uppercase tracking-tight text-foreground">
                Categorias cadastradas
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                {categories.length}{" "}
                {categories.length === 1
                  ? "categoria cadastrada"
                  : "categorias cadastradas"}
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                loadCategories()
              }
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-background"
            >
              Atualizar
            </button>

          </div>

          {!loading && categories.length > 0 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Total de categorias
                </p>

                <p className="mt-1 text-2xl font-bold text-foreground">
                  {categories.length}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Organização
                </p>

                <p className="mt-1 text-sm font-bold text-foreground">
                  Estrutura do cardápio
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Use nomes curtos e fáceis de identificar.
                </p>
              </div>
            </div>
          )}

          {loading ? (

            <div className="mt-6 rounded-2xl border border-dashed border-border bg-background p-10 text-center">

              <p className="text-muted-foreground">
                Carregando categorias...
              </p>

            </div>

          ) : categories.length === 0 ? (

            <div className="mt-6 rounded-2xl border border-dashed border-border bg-background p-10 text-center">

             <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-border bg-card text-muted-foreground">
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
    aria-hidden="true"
  >
    <path d="M3 7h6l2 2h10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    <path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v2" />
  </svg>
</div>

              <h4 className="mt-3 font-bold text-foreground">
                Nenhuma categoria cadastrada
              </h4>

              <p className="mt-1 text-sm text-muted-foreground">
                Cadastre a primeira categoria para organizar os produtos.
              </p>

            </div>

          ) : (

            <div className="mt-6 space-y-3">

              {categories.map(
                (category) => (

                  <div
                    key={category.id}
                    className="group flex flex-col gap-4 rounded-[18px] border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:border-foreground/10 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div>

                      <p className="text-base font-bold tracking-tight text-foreground">
                        {category.name}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Categoria #{category.id}
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        editCategory(
                          category
                        )
                      }
                      className="rounded-lg border border-border px-4 py-2 text-sm font-semibold transition hover:bg-background"
                    >
                      Editar
                    </button>

                  </div>
                )
              )}

            </div>
          )}

        </section>

      </div>

    </main>
  );
}
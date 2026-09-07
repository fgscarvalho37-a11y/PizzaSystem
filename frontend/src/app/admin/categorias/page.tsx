"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import AdminHeader from "@/components/AdminHeader";
import { adminFetch } from "@/lib/adminFetch";

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
          "http://localhost:8080/api/categories",
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
          ? `http://localhost:8080/api/categories/${editingId}`
          : "http://localhost:8080/api/categories";

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
    <main className="min-h-screen bg-gray-100">

      <AdminHeader
        title="Gerenciar categorias"
      />

      <div className="mx-auto max-w-5xl p-6">

        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Cardápio
          </p>

          <h2 className="mt-1 text-3xl font-bold text-gray-900">
            Categorias
          </h2>

          <p className="mt-2 max-w-2xl text-gray-600">
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
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">

            <p className="font-semibold text-green-700">
              Tudo certo
            </p>

            <p className="mt-1 text-sm text-green-600">
              {successMessage}
            </p>

          </div>
        )}

        {/* =========================
            FORMULÁRIO
            ========================= */}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h3 className="text-xl font-bold text-gray-900">
                {editingId
                  ? "Editar categoria"
                  : "Nova categoria"}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
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
                className="text-sm font-semibold text-red-600 transition hover:text-red-700"
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
              className="h-12 flex-1 rounded-xl border border-gray-300 px-4 outline-none transition focus:border-black"
            />

            <button
              type="submit"
              disabled={
                saving
              }
              className="h-12 rounded-xl bg-black px-6 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
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

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h3 className="text-xl font-bold text-gray-900">
                Categorias cadastradas
              </h3>

              <p className="mt-1 text-sm text-gray-500">
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
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Atualizar
            </button>

          </div>

          {loading ? (

            <div className="mt-6 rounded-xl bg-gray-50 p-6 text-center">

              <p className="text-gray-500">
                Carregando categorias...
              </p>

            </div>

          ) : categories.length === 0 ? (

            <div className="mt-6 rounded-xl bg-gray-50 p-8 text-center">

              <p className="text-4xl">
                🗂️
              </p>

              <h4 className="mt-3 font-bold text-gray-900">
                Nenhuma categoria cadastrada
              </h4>

              <p className="mt-1 text-sm text-gray-500">
                Cadastre a primeira categoria para organizar os produtos.
              </p>

            </div>

          ) : (

            <div className="mt-6 space-y-3">

              {categories.map(
                (category) => (

                  <div
                    key={category.id}
                    className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div>

                      <p className="font-semibold text-gray-900">
                        {category.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
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
                      className="rounded-lg border border-black px-4 py-2 text-sm font-semibold transition hover:bg-gray-50"
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
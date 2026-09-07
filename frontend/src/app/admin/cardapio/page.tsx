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

type Product = {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  price: number;
  available: boolean;
  category: Category;
};

export default function AdminCardapioPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [imageUrl, setImageUrl] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  // =========================
  // CARREGAR DADOS
  // =========================

  async function loadData() {
    try {
      setErrorMessage("");

      const [
        productsResponse,
        categoriesResponse,
      ] = await Promise.all([
        adminFetch(
  "http://localhost:8080/api/products",
  {
    cache: "no-store",
    credentials: "include",
  }
),

        adminFetch(
          "http://localhost:8080/api/categories",
          {
            cache: "no-store",
            credentials: "include",
          }
        ),
      ]);

      if (!productsResponse.ok) {
        throw new Error(
          "Erro ao carregar produtos"
        );
      }

      if (!categoriesResponse.ok) {
        throw new Error(
          "Erro ao carregar categorias"
        );
      }

      const productsData: Product[] =
        await productsResponse.json();

      const categoriesData: Category[] =
        await categoriesResponse.json();

      setProducts(productsData);
      setCategories(categoriesData);

    } catch {
      setErrorMessage(
        "Não foi possível carregar o cardápio."
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // =========================
  // LIMPAR FORMULÁRIO
  // =========================

  function clearForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setImageUrl("");
    setCategoryId("");
  }

  // =========================
  // EDITAR PRODUTO
  // =========================

  function editProduct(
    product: Product
  ) {
    setEditingId(
      product.id
    );

    setName(
      product.name
    );

    setDescription(
      product.description ?? ""
    );

    setPrice(
      String(
        product.price
      )
    );

    setImageUrl(
      product.imageUrl ?? ""
    );

    setCategoryId(
      String(
        product.category.id
      )
    );

    setErrorMessage("");
    setSuccessMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =========================
  // SALVAR PRODUTO
  // =========================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!name.trim()) {
      setErrorMessage(
        "Informe o nome do produto."
      );

      return;
    }

    if (!categoryId) {
      setErrorMessage(
        "Selecione uma categoria."
      );

      return;
    }

    const parsedPrice =
      Number(price);

    if (
      Number.isNaN(parsedPrice) ||
      parsedPrice < 0
    ) {
      setErrorMessage(
        "Informe um preço válido."
      );

      return;
    }

    const body = {
      name:
        name.trim(),

      description:
        description.trim(),

      price:
        parsedPrice,

      imageUrl:
        imageUrl.trim()
          ? imageUrl.trim()
          : null,

      available: true,

      category: {
        id:
          Number(
            categoryId
          ),
      },
    };

    try {
      setSaving(true);

      const url =
        editingId
          ? `http://localhost:8080/api/products/${editingId}`
          : "http://localhost:8080/api/products";

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
              JSON.stringify(
                body
              ),
          }
        );

      if (!response.ok) {
        throw new Error(
          "Erro ao salvar produto"
        );
      }

      setSuccessMessage(
        editingId
          ? "Produto atualizado com sucesso."
          : "Produto cadastrado com sucesso."
      );

      clearForm();

      await loadData();

    } catch {
      setErrorMessage(
        "Não foi possível salvar o produto."
      );

    } finally {
      setSaving(false);
    }
  }

  // =========================
  // DISPONIBILIDADE
  // =========================

  async function toggleAvailability(
    product: Product
  ) {
    try {
      setUpdatingId(
        product.id
      );

      setErrorMessage("");
      setSuccessMessage("");

      const response =
        await adminFetch(
          `http://localhost:8080/api/products/${product.id}/availability?available=${!product.available}`,
          {
            method: "PATCH",
            credentials: "include",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Erro ao alterar produto"
        );
      }

      setSuccessMessage(
        product.available
          ? `${product.name} foi desativado.`
          : `${product.name} foi ativado.`
      );

      await loadData();

    } catch {
      setErrorMessage(
        "Não foi possível alterar a disponibilidade."
      );

    } finally {
      setUpdatingId(
        null
      );
    }
  }

  // =========================
  // TELA
  // =========================

  return (
    <main className="min-h-screen bg-gray-100">

      <AdminHeader
        title="Gerenciar cardápio"
      />

      <div className="mx-auto max-w-6xl p-6">

        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Cardápio
          </p>

          <h2 className="mt-1 text-3xl font-bold text-gray-900">
            Produtos
          </h2>

          <p className="mt-2 max-w-2xl text-gray-600">
            Cadastre produtos, altere preços, organize por categoria e controle a disponibilidade no site.
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
                  ? "Editar produto"
                  : "Novo produto"}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {editingId
                  ? "Altere os dados do produto selecionado."
                  : "Preencha os dados para adicionar um novo item ao cardápio."}
              </p>

            </div>

            {editingId && (
              <button
                type="button"
                onClick={
                  clearForm
                }
                className="text-sm font-semibold text-red-600 transition hover:text-red-700"
              >
                Cancelar edição
              </button>
            )}

          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            {/* NOME */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Nome
              </label>

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
                className="h-12 w-full rounded-xl border border-gray-300 px-4 outline-none transition focus:border-black"
                placeholder="Ex: Pizza de Calabresa"
              />

            </div>

            {/* CATEGORIA */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Categoria
              </label>

              <select
                required
                value={
                  categoryId
                }
                onChange={(
                  event
                ) =>
                  setCategoryId(
                    event.target.value
                  )
                }
                className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 outline-none transition focus:border-black"
              >
                <option value="">
                  Selecione uma categoria
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  )
                )}
              </select>

            </div>

            {/* PREÇO */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Preço
              </label>

              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={
                  price
                }
                onChange={(
                  event
                ) =>
                  setPrice(
                    event.target.value
                  )
                }
                className="h-12 w-full rounded-xl border border-gray-300 px-4 outline-none transition focus:border-black"
                placeholder="45.00"
              />

            </div>

            {/* IMAGEM */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                URL da imagem
              </label>

              <input
                value={
                  imageUrl
                }
                onChange={(
                  event
                ) =>
                  setImageUrl(
                    event.target.value
                  )
                }
                className="h-12 w-full rounded-xl border border-gray-300 px-4 outline-none transition focus:border-black"
                placeholder="https://..."
              />

            </div>

            {/* DESCRIÇÃO */}

            <div className="md:col-span-2">

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Descrição / ingredientes
              </label>

              <textarea
                value={
                  description
                }
                onChange={(
                  event
                ) =>
                  setDescription(
                    event.target.value
                  )
                }
                rows={4}
                className="w-full resize-none rounded-xl border border-gray-300 p-4 outline-none transition focus:border-black"
                placeholder="Ex: Calabresa, mussarela e cebola"
              />

            </div>

          </div>

          <button
            type="submit"
            disabled={
              saving
            }
            className="mt-6 rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Salvando..."
              : editingId
                ? "Salvar alterações"
                : "Cadastrar produto"}
          </button>

        </form>

        {/* =========================
            PRODUTOS
            ========================= */}

        <section className="mt-8">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h3 className="text-2xl font-bold text-gray-900">
                Produtos cadastrados
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {products.length}{" "}
                {products.length === 1
                  ? "produto cadastrado"
                  : "produtos cadastrados"}
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                loadData()
              }
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Atualizar
            </button>

          </div>

          {loading ? (

            <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">

              <p className="text-gray-500">
                Carregando produtos...
              </p>

            </div>

          ) : products.length === 0 ? (

            <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

              <p className="text-4xl">
                🍕
              </p>

              <h4 className="mt-3 text-lg font-bold text-gray-900">
                Nenhum produto cadastrado
              </h4>

              <p className="mt-1 text-sm text-gray-500">
                Cadastre o primeiro item para começar a montar o cardápio.
              </p>

            </div>

          ) : (

            <div className="mt-5 grid gap-5 md:grid-cols-2">

              {products.map(
                (product) => (

                  <article
                    key={product.id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                  >

                    {/* IMAGEM */}

                    {product.imageUrl && (
                      <div className="aspect-[16/8] overflow-hidden bg-gray-100">

                        <img
                          src={
                            product.imageUrl
                          }
                          alt={
                            product.name
                          }
                          className="h-full w-full object-cover"
                        />

                      </div>
                    )}

                    <div className="p-5">

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <p className="text-sm font-semibold text-gray-500">
                            {
                              product
                                .category
                                .name
                            }
                          </p>

                          <h4 className="mt-1 text-xl font-bold text-gray-900">
                            {product.name}
                          </h4>

                        </div>

                        <span
                          className={`h-fit rounded-full px-3 py-1 text-xs font-bold ${
                            product.available
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {product.available
                            ? "Disponível"
                            : "Indisponível"}
                        </span>

                      </div>

                      {product.description && (
                        <p className="mt-3 text-sm leading-6 text-gray-600">
                          {product.description}
                        </p>
                      )}

                      <p className="mt-4 text-2xl font-bold text-gray-900">
                        R${" "}
                        {Number(
                          product.price
                        )
                          .toFixed(2)
                          .replace(
                            ".",
                            ","
                          )}
                      </p>

                      <div className="mt-5 flex gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            editProduct(
                              product
                            )
                          }
                          disabled={
                            updatingId ===
                            product.id
                          }
                          className="flex-1 rounded-xl border border-black px-4 py-2.5 font-semibold transition hover:bg-gray-50 disabled:opacity-50"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          disabled={
                            updatingId ===
                            product.id
                          }
                          onClick={() =>
                            toggleAvailability(
                              product
                            )
                          }
                          className={`flex-1 rounded-xl px-4 py-2.5 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            product.available
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-green-600 hover:bg-green-700"
                          }`}
                        >
                          {updatingId ===
                          product.id
                            ? "Atualizando..."
                            : product.available
                              ? "Desativar"
                              : "Ativar"}
                        </button>

                      </div>

                    </div>

                  </article>
                )
              )}

            </div>
          )}

        </section>

      </div>

    </main>
  );
}
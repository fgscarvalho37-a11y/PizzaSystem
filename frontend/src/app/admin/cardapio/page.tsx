"use client";

import {
  ChangeEvent,
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

  const [
    uploadingImage,
    setUploadingImage,
  ] =
    useState(false);

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
  `${API_URL}/api/products`,
  {
    cache: "no-store",
    credentials: "include",
  }
),

        adminFetch(
          `${API_URL}/api/categories`,
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
  // IMAGEM DO PRODUTO
  // =========================

  async function uploadProductImage(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    event.target.value =
      "";

    if (!file) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setErrorMessage(
        "A imagem deve ter no máximo 5 MB."
      );

      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setErrorMessage(
        "Use uma imagem JPG, PNG ou WebP."
      );

      return;
    }

    try {
      setUploadingImage(
        true
      );

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const response =
        await adminFetch(
          `${API_URL}/api/store/images/product`,
          {
            method:
              "POST",
            body:
              formData,
          }
        );

      if (!response.ok) {
        throw new Error(
          "Erro ao enviar imagem"
        );
      }

      const data:
        {
          url?: string;
        } =
        await response.json();

      if (!data.url) {
        throw new Error(
          "Upload sem URL"
        );
      }

      setImageUrl(
        data.url
      );

      setSuccessMessage(
        "Imagem enviada. Salve o produto para concluir."
      );

    } catch {
      setErrorMessage(
        "Não foi possível enviar a imagem do produto."
      );

    } finally {
      setUploadingImage(
        false
      );
    }
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
          ? `${API_URL}/api/products/${editingId}`
          : `${API_URL}/api/products`;

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
          `${API_URL}/api/products/${product.id}/availability?available=${!product.available}`,
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
    <main className="min-h-screen bg-background">

      <AdminHeader />

      <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 lg:px-8">

        <div className="mb-6 border-b border-border pb-6">

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Cardápio
          </p>

          <h2 className="mt-2 font-display text-4xl uppercase leading-none tracking-tight text-foreground">
            Produtos
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Cadastre produtos, altere preços, organize por categoria e controle a disponibilidade no site.
          </p>

        </div>

        {/* =========================
            MENSAGENS
            ========================= */}

        {errorMessage && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">

            <p className="font-semibold text-red-700">
              Atenção
            </p>

            <p className="mt-1 text-sm text-red-600">
              {errorMessage}
            </p>

          </div>
        )}

        {successMessage && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">

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
                  ? "Editar produto"
                  : "Novo produto"}
              </h3>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
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
                className="h-9 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 transition hover:bg-red-100"
              >
                Cancelar edição
              </button>
            )}

          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            {/* NOME */}

            <div>

              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
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
                className="h-12 w-full rounded-xl border border-input px-4 outline-none transition focus:border-border"
                placeholder="Ex: Pizza de Calabresa"
              />

            </div>

            {/* CATEGORIA */}

            <div>

              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
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
                className="h-12 w-full rounded-xl border border-input bg-card px-4 outline-none transition focus:border-border"
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

              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
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
                className="h-12 w-full rounded-xl border border-input px-4 outline-none transition focus:border-border"
                placeholder="45.00"
              />

            </div>

            {/* IMAGEM */}

            <div>

              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                Imagem do produto
              </label>

              <div className="flex gap-2">

                <label
                  className={[
                    "inline-flex h-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-bold text-foreground transition hover:bg-muted",
                    uploadingImage
                      ? "pointer-events-none opacity-60"
                      : "",
                  ].join(
                    " "
                  )}
                >
                  {uploadingImage
                    ? "Enviando..."
                    : "Enviar foto"}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={
                      uploadProductImage
                    }
                    className="hidden"
                    disabled={
                      uploadingImage
                    }
                  />
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
                  className="h-12 min-w-0 flex-1 rounded-xl border border-input px-4 outline-none transition focus:border-border"
                  placeholder="ou cole uma URL"
                />

              </div>

              {imageUrl && (
                <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-muted/20">
                  <img
                    src={
                      imageUrl
                    }
                    alt="Prévia do produto"
                    className="aspect-[16/9] w-full object-cover"
                  />
                </div>
              )}

            </div>

            {/* DESCRIÇÃO */}

            <div className="md:col-span-2">

              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
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
                className="w-full resize-none rounded-xl border border-input p-4 outline-none transition focus:border-border"
                placeholder="Ex: Calabresa, mussarela e cebola"
              />

            </div>

          </div>

          <button
            type="submit"
            disabled={
              saving
            }
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-sm disabled:pointer-events-none disabled:opacity-50"
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

        <section className="mt-6 rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h3 className="font-display text-2xl uppercase tracking-tight text-foreground">
                Produtos cadastrados
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
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
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/40"
            >
              Atualizar
            </button>

          </div>

          {!loading && products.length > 0 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Produtos
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {products.length}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Disponíveis
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">
                  {products.filter((product) => product.available).length}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Categorias em uso
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {new Set(products.map((product) => product.category.id)).size}
                </p>
              </div>
            </div>
          )}

          {loading ? (

            <div className="mt-5 rounded-2xl border border-dashed border-border bg-background p-10 text-center">

              <p className="text-muted-foreground">
                Carregando produtos...
              </p>

            </div>

          ) : products.length === 0 ? (

            <div className="mt-5 rounded-2xl border border-dashed border-border bg-background p-10 text-center">

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
    <path d="M4 19 12 3l8 16H4Z" />
    <circle cx="11" cy="10" r="1" />
    <circle cx="15" cy="14" r="1" />
    <path d="M6.5 16.5h11" />
  </svg>
</div>

              <h4 className="mt-3 text-lg font-bold text-foreground">
                Nenhum produto cadastrado
              </h4>

              <p className="mt-1 text-sm text-muted-foreground">
                Cadastre o primeiro item para começar a montar o cardápio.
              </p>

            </div>

          ) : (

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

              {products.map(
                (product) => (

                  <article
                    key={product.id}
                    className="group overflow-hidden rounded-[20px] border border-border bg-background transition hover:-translate-y-0.5 hover:border-foreground/10 hover:shadow-md"
                  >

                    {/* IMAGEM */}

                    {product.imageUrl && (
                      <div className="aspect-[16/9] overflow-hidden bg-muted">

                        <img
                          src={
                            product.imageUrl
                          }
                          alt={
                            product.name
                          }
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
                        />

                      </div>
                    )}

                    <div className="p-4">

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                            {
                              product
                                .category
                                .name
                            }
                          </p>

                          <h4 className="mt-1 text-lg font-bold tracking-tight text-foreground">
                            {product.name}
                          </h4>

                        </div>

                        <span
                          className={`h-fit rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                            product.available
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {product.available
                            ? "Disponível"
                            : "Indisponível"}
                        </span>

                      </div>

                      {product.description && (
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {product.description}
                        </p>
                      )}

                      <p className="mt-4 text-xl font-bold tracking-tight text-foreground">
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
                          className="flex-1 rounded-xl border border-border px-4 py-2.5 font-semibold transition hover:bg-muted/40 disabled:opacity-50"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          disabled={updatingId === product.id}
                          onClick={() => toggleAvailability(product)}
                          className="flex h-10 flex-1 items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 text-sm font-bold text-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                          aria-pressed={product.available}
                        >
                          <span>
                            {updatingId === product.id
                              ? "Atualizando..."
                              : product.available
                                ? "Disponível"
                                : "Indisponível"}
                          </span>

                          <span
                            className={`relative h-5 w-9 shrink-0 rounded-full transition ${
                              product.available
                                ? "bg-primary"
                                : "bg-muted-foreground/25"
                            }`}
                          >
                            <span
                              className={`absolute top-1 h-3 w-3 rounded-full bg-white shadow-sm transition-all ${
                                product.available
                                  ? "left-5"
                                  : "left-1"
                              }`}
                            />
                          </span>
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
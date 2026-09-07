"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import AdminHeader from "@/components/AdminHeader";
import { adminFetch } from "@/lib/adminFetch";

type Crust = {
  id: number;
  name: string;
  price: number;
  active: boolean;
  sortOrder: number;
};

type Product = {
  id: number;
  name: string;
  available: boolean;
  allowCrust: boolean;
  category: {
    id: number;
    name: string;
  };
};

function formatMoney(
  value: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(value);
}

export default function AdminBordasPage() {
  const [
    crusts,
    setCrusts,
  ] = useState<Crust[]>([]);

  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadingProducts,
    setLoadingProducts,
  ] = useState(true);

  const [
    updatingProductId,
    setUpdatingProductId,
  ] = useState<number | null>(
    null
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    updatingId,
    setUpdatingId,
  ] = useState<number | null>(
    null
  );

  const [
    editingId,
    setEditingId,
  ] = useState<number | null>(
    null
  );

  const [
    name,
    setName,
  ] = useState("");

  const [
    price,
    setPrice,
  ] = useState("");

  const [
    sortOrder,
    setSortOrder,
  ] = useState("0");

  const [
    active,
    setActive,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  // =========================
  // CARREGAR BORDAS
  // =========================

  async function loadCrusts() {
    try {
      setErrorMessage("");

      const response =
        await adminFetch(
          "http://localhost:8080/api/crusts",
          {
            method: "GET",
            cache: "no-store",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Erro ao carregar bordas"
        );
      }

      const data:
        Crust[] =
        await response.json();

      setCrusts(
        data
      );

    } catch (error) {
      console.error(
        error
      );

      setErrorMessage(
        "Não foi possível carregar as bordas."
      );

    } finally {
      setLoading(
        false
      );
    }
  }

  async function loadProducts() {
    try {
      const response =
        await adminFetch(
          "http://localhost:8080/api/products",
          {
            method: "GET",
            cache: "no-store",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Erro ao carregar produtos"
        );
      }

      const data:
        Product[] =
        await response.json();

      setProducts(
        [...data].sort(
          (a, b) => {
            const categoryCompare =
              a.category.name.localeCompare(
                b.category.name,
                "pt-BR"
              );

            if (categoryCompare !== 0) {
              return categoryCompare;
            }

            return a.name.localeCompare(
              b.name,
              "pt-BR"
            );
          }
        )
      );

    } catch (error) {
      console.error(
        error
      );

      setErrorMessage(
        "Não foi possível carregar os produtos."
      );

    } finally {
      setLoadingProducts(
        false
      );
    }
  }

  useEffect(() => {
    loadCrusts();
    loadProducts();
  }, []);

  // =========================
  // LIMPAR FORMULÁRIO
  // =========================

  function clearForm() {
    setEditingId(
      null
    );

    setName(
      ""
    );

    setPrice(
      ""
    );

    setSortOrder(
      "0"
    );

    setActive(
      true
    );
  }

  // =========================
  // EDITAR
  // =========================

  function startEdit(
    crust: Crust
  ) {
    setEditingId(
      crust.id
    );

    setName(
      crust.name
    );

    setPrice(
      String(
        crust.price
      )
    );

    setSortOrder(
      String(
        crust.sortOrder
      )
    );

    setActive(
      crust.active
    );

    setErrorMessage(
      ""
    );

    setSuccessMessage(
      ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =========================
  // SALVAR
  // =========================

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage(
      ""
    );

    setSuccessMessage(
      ""
    );

    if (
      !name.trim()
    ) {
      setErrorMessage(
        "Informe o nome da borda."
      );

      return;
    }

    const parsedPrice =
      Number(
        price
      );

    if (
      Number.isNaN(
        parsedPrice
      ) ||
      parsedPrice < 0
    ) {
      setErrorMessage(
        "Informe um preço válido."
      );

      return;
    }

    const parsedSortOrder =
      Number(
        sortOrder
      );

    if (
      Number.isNaN(
        parsedSortOrder
      ) ||
      parsedSortOrder < 0
    ) {
      setErrorMessage(
        "Informe uma ordem válida."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      const url =
        editingId ===
        null
          ? "http://localhost:8080/api/crusts"
          : `http://localhost:8080/api/crusts/${editingId}`;

      const method =
        editingId ===
        null
          ? "POST"
          : "PUT";

      const response =
        await adminFetch(
          url,
          {
            method,

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name:
                  name.trim(),

                price:
                  parsedPrice,

                active,

                sortOrder:
                  parsedSortOrder,
              }),
          }
        );

      if (!response.ok) {
        const text =
          await response.text();

        let message =
          "Não foi possível salvar a borda.";

        try {
          const data =
            JSON.parse(
              text
            );

          if (
            typeof data?.message ===
              "string" &&
            data.message
          ) {
            message =
              data.message;
          }
        } catch {
          // mantém mensagem padrão
        }

        throw new Error(
          message
        );
      }

      setSuccessMessage(
        editingId ===
        null
          ? "Borda criada com sucesso."
          : "Borda atualizada com sucesso."
      );

      clearForm();

      await loadCrusts();

    } catch (error) {
      console.error(
        error
      );

      if (
        error instanceof
        Error
      ) {
        setErrorMessage(
          error.message
        );
      } else {
        setErrorMessage(
          "Não foi possível salvar a borda."
        );
      }

    } finally {
      setSaving(
        false
      );
    }
  }

  // =========================
  // ATIVAR / DESATIVAR
  // =========================

  async function toggleActive(
    crust: Crust
  ) {
    try {
      setUpdatingId(
        crust.id
      );

      setErrorMessage(
        ""
      );

      setSuccessMessage(
        ""
      );

      const response =
        await adminFetch(
          `http://localhost:8080/api/crusts/${crust.id}/active?active=${!crust.active}`,
          {
            method: "PATCH",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Não foi possível alterar o status da borda."
        );
      }

      setSuccessMessage(
        crust.active
          ? `${crust.name} foi desativada.`
          : `${crust.name} foi ativada.`
      );

      await loadCrusts();

    } catch (error) {
      console.error(
        error
      );

      setErrorMessage(
        "Não foi possível alterar o status da borda."
      );

    } finally {
      setUpdatingId(
        null
      );
    }
  }

  // =========================
  // PRODUTO ACEITA BORDA
  // =========================

  async function toggleProductCrust(
    product: Product
  ) {
    try {
      setUpdatingProductId(
        product.id
      );

      setErrorMessage(
        ""
      );

      setSuccessMessage(
        ""
      );

      const newValue =
        !product.allowCrust;

      const response =
        await adminFetch(
          `http://localhost:8080/api/products/${product.id}/allow-crust?allowCrust=${newValue}`,
          {
            method: "PATCH",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Não foi possível alterar a configuração do produto."
        );
      }

      setProducts(
        (current) =>
          current.map(
            (item) =>
              item.id === product.id
                ? {
                    ...item,
                    allowCrust:
                      newValue,
                  }
                : item
          )
      );

      setSuccessMessage(
        newValue
          ? `${product.name} agora aceita borda recheada.`
          : `${product.name} não aceita mais borda recheada.`
      );

    } catch (error) {
      console.error(
        error
      );

      setErrorMessage(
        "Não foi possível alterar a configuração de borda do produto."
      );

    } finally {
      setUpdatingProductId(
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
        title="Bordas"
      />

      <div className="mx-auto max-w-6xl p-6">

        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Cardápio
          </p>

          <h2 className="mt-1 text-3xl font-bold text-gray-900">
            Bordas recheadas
          </h2>

          <p className="mt-2 max-w-3xl text-gray-600">
            Cadastre as opções de borda que podem ser escolhidas nas pizzas marcadas como compatíveis.
          </p>

        </div>

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

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">

          {/* =========================
              FORMULÁRIO
              ========================= */}

          <section className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Cadastro
            </p>

            <h3 className="mt-1 text-2xl font-bold text-gray-900">
              {editingId ===
              null
                ? "Nova borda"
                : "Editar borda"}
            </h3>

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-6 space-y-4"
            >

              <div>

                <label className="mb-1 block text-sm font-semibold text-gray-700">
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
                  placeholder="Ex: Catupiry"
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none transition focus:border-black"
                />

              </div>

              <div>

                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Preço adicional
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
                  placeholder="Ex: 6.00"
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none transition focus:border-black"
                />

              </div>

              <div>

                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Ordem de exibição
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    sortOrder
                  }
                  onChange={(
                    event
                  ) =>
                    setSortOrder(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none transition focus:border-black"
                />

                <p className="mt-1 text-xs text-gray-400">
                  Números menores aparecem primeiro.
                </p>

              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">

                <input
                  type="checkbox"
                  checked={
                    active
                  }
                  onChange={(
                    event
                  ) =>
                    setActive(
                      event.target.checked
                    )
                  }
                />

                <div>

                  <p className="font-semibold text-gray-800">
                    Borda ativa
                  </p>

                  <p className="text-xs text-gray-500">
                    Quando desativada, não aparece para o cliente.
                  </p>

                </div>

              </label>

              <button
                type="submit"
                disabled={
                  saving
                }
                className="w-full rounded-xl bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {saving
                  ? "Salvando..."
                  : editingId ===
                      null
                    ? "Cadastrar borda"
                    : "Salvar alterações"}
              </button>

              {editingId !==
                null && (
                <button
                  type="button"
                  onClick={
                    clearForm
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancelar edição
                </button>
              )}

            </form>

          </section>

          {/* =========================
              LISTA
              ========================= */}

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="flex items-end justify-between gap-4">

              <div>

                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Cadastradas
                </p>

                <h3 className="mt-1 text-2xl font-bold text-gray-900">
                  Opções disponíveis
                </h3>

              </div>

              <button
                type="button"
                onClick={
                  loadCrusts
                }
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Atualizar
              </button>

            </div>

            {loading ? (
              <div className="mt-6 rounded-xl bg-gray-50 p-6 text-center text-gray-500">
                Carregando bordas...
              </div>

            ) : crusts.length ===
              0 ? (
              <div className="mt-6 rounded-xl bg-gray-50 p-6 text-center text-gray-500">
                Nenhuma borda cadastrada.
              </div>

            ) : (
              <div className="mt-6 space-y-3">

                {crusts.map(
                  (crust) => (
                    <article
                      key={
                        crust.id
                      }
                      className="rounded-2xl border border-gray-200 p-5"
                    >

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                          <div className="flex flex-wrap items-center gap-2">

                            <h4 className="text-lg font-bold text-gray-900">
                              {crust.name}
                            </h4>

                            <span
                              className={
                                crust.active
                                  ? "rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700"
                                  : "rounded-full bg-gray-200 px-3 py-1 text-xs font-bold text-gray-600"
                              }
                            >
                              {crust.active
                                ? "Ativa"
                                : "Inativa"}
                            </span>

                          </div>

                          <p className="mt-2 text-xl font-bold text-gray-900">
                            {formatMoney(
                              Number(
                                crust.price
                              )
                            )}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            Ordem:{" "}
                            {crust.sortOrder}
                          </p>

                        </div>

                        <div className="flex flex-wrap gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              startEdit(
                                crust
                              )
                            }
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            disabled={
                              updatingId ===
                              crust.id
                            }
                            onClick={() =>
                              toggleActive(
                                crust
                              )
                            }
                            className={
                              crust.active
                                ? "rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                                : "rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-50"
                            }
                          >
                            {updatingId ===
                            crust.id
                              ? "Atualizando..."
                              : crust.active
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

        {/* =========================
            PRODUTOS COM BORDA
            ========================= */}

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Aplicação
              </p>

              <h3 className="mt-1 text-2xl font-bold text-gray-900">
                Produtos que aceitam borda
              </h3>

              <p className="mt-2 max-w-3xl text-sm text-gray-600">
                Marque somente as pizzas em que o cliente pode escolher uma borda recheada. Produtos desmarcados não mostrarão essa opção no cardápio.
              </p>

            </div>

            <button
              type="button"
              onClick={
                loadProducts
              }
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Atualizar produtos
            </button>

          </div>

          {loadingProducts ? (
            <div className="mt-6 rounded-xl bg-gray-50 p-6 text-center text-gray-500">
              Carregando produtos...
            </div>

          ) : products.length === 0 ? (
            <div className="mt-6 rounded-xl bg-gray-50 p-6 text-center text-gray-500">
              Nenhum produto cadastrado.
            </div>

          ) : (
            <div className="mt-6 grid gap-3 md:grid-cols-2">

              {products.map(
                (product) => {

                  const updating =
                    updatingProductId ===
                    product.id;

                  return (
                    <button
                      key={
                        product.id
                      }
                      type="button"
                      disabled={
                        updating
                      }
                      onClick={() =>
                        toggleProductCrust(
                          product
                        )
                      }
                      className={
                        product.allowCrust
                          ? "flex items-center justify-between gap-4 rounded-2xl border-2 border-black bg-gray-50 p-4 text-left transition hover:bg-gray-100 disabled:cursor-wait disabled:opacity-60"
                          : "flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60"
                      }
                    >

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <p className="truncate font-bold text-gray-900">
                            {product.name}
                          </p>

                          {!product.available && (
                            <span className="rounded-full bg-gray-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                              Produto inativo
                            </span>
                          )}

                        </div>

                        <p className="mt-1 text-xs text-gray-500">
                          {product.category.name}
                        </p>

                      </div>

                      <div
                        className={
                          product.allowCrust
                            ? "relative h-7 w-12 shrink-0 rounded-full bg-black transition"
                            : "relative h-7 w-12 shrink-0 rounded-full bg-gray-300 transition"
                        }
                      >
                        <span
                          className={
                            product.allowCrust
                              ? "absolute left-6 top-1 h-5 w-5 rounded-full bg-white shadow transition"
                              : "absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition"
                          }
                        />
                      </div>

                    </button>
                  );
                }
              )}

            </div>
          )}

        </section>

      </div>

    </main>
  );
}
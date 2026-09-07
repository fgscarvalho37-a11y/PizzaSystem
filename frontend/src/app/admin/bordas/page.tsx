"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import AdminHeader from "@/components/AdminHeader";
import { adminFetch } from "@/lib/adminFetch";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080";

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
          `${API_URL}/api/crusts`,
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
          `${API_URL}/api/products`,
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
          ? `${API_URL}/api/crusts`
          : `${API_URL}/api/crusts/${editingId}`;

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
          `${API_URL}/api/crusts/${crust.id}/active?active=${!crust.active}`,
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
          `${API_URL}/api/products/${product.id}/allow-crust?allowCrust=${newValue}`,
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
    <main className="min-h-screen bg-background">

      <AdminHeader />

      <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 lg:px-8">

        <div className="mb-6 border-b border-border pb-6">

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Cardápio
          </p>

          <h2 className="mt-2 font-display text-4xl uppercase leading-none tracking-tight text-foreground">
            Bordas recheadas
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
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
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">

            <p className="font-semibold text-emerald-700">
              Tudo certo
            </p>

            <p className="mt-1 text-sm text-emerald-700">
              {successMessage}
            </p>

          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">

          {/* =========================
              FORMULÁRIO
              ========================= */}

          <section className="h-fit rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">

            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              Cadastro
            </p>

            <h3 className="mt-1 font-display text-2xl uppercase tracking-tight text-foreground">
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
                  placeholder="Ex: Catupiry"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
                />

              </div>

              <div>

                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
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
                  className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
                />

              </div>

              <div>

                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
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
                  className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
                />

                <p className="mt-1 text-xs text-muted-foreground">
                  Números menores aparecem primeiro.
                </p>

              </div>

              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border bg-background p-4">
                <div>
                  <p className="text-sm font-bold text-foreground">Borda ativa</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Quando desativada, não aparece para o cliente.
                  </p>
                </div>

                <div className="relative inline-flex h-7 w-12 shrink-0 items-center">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(event) => setActive(event.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 rounded-full bg-muted-foreground/25 transition peer-checked:bg-primary" />
                  <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                </div>
              </label>

              <button
                type="submit"
                disabled={
                  saving
                }
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-sm disabled:pointer-events-none disabled:opacity-50"
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
                  className="w-full rounded-xl border border-input bg-card px-5 py-3 font-semibold text-foreground transition hover:bg-background"
                >
                  Cancelar edição
                </button>
              )}

            </form>

          </section>

          {/* =========================
              LISTA
              ========================= */}

          <section className="rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">

            <div className="flex items-end justify-between gap-4">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  Cadastradas
                </p>

                <h3 className="mt-1 font-display text-2xl uppercase tracking-tight text-foreground">
                  Opções disponíveis
                </h3>

              </div>

              <button
                type="button"
                onClick={
                  loadCrusts
                }
                className="rounded-xl border border-input bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-background"
              >
                Atualizar
              </button>

            </div>

            {!loading && crusts.length > 0 && (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Bordas</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{crusts.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Ativas</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-700">
                    {crusts.filter((crust) => crust.active).length}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Preço médio</p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {formatMoney(crusts.reduce((total, crust) => total + Number(crust.price), 0) / crusts.length)}
                  </p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="mt-6 rounded-2xl border border-dashed border-border bg-background p-10 text-center text-sm text-muted-foreground">
                Carregando bordas...
              </div>

            ) : crusts.length ===
              0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-border bg-background p-10 text-center text-sm text-muted-foreground">
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
                      className="rounded-[20px] border border-border bg-background p-5 transition hover:-translate-y-0.5 hover:shadow-sm"
                    >

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                          <div className="flex flex-wrap items-center gap-2">

                            <h4 className="text-lg font-bold tracking-tight text-foreground">
                              {crust.name}
                            </h4>

                            <span
                              className={
                                crust.active
                                  ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700"
                                  : "rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground"
                              }
                            >
                              {crust.active
                                ? "Ativa"
                                : "Inativa"}
                            </span>

                          </div>

                          <p className="mt-2 text-xl font-bold tracking-tight text-foreground">
                            {formatMoney(
                              Number(
                                crust.price
                              )
                            )}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
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
                            className="rounded-lg border border-input bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-background"
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
                                : "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
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

        <section className="mt-6 rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Aplicação
              </p>

              <h3 className="mt-1 font-display text-2xl uppercase tracking-tight text-foreground">
                Produtos que aceitam borda
              </h3>

              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                Marque somente as pizzas em que o cliente pode escolher uma borda recheada. Produtos desmarcados não mostrarão essa opção no cardápio.
              </p>

            </div>

            <button
              type="button"
              onClick={
                loadProducts
              }
              className="rounded-xl border border-input bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-background"
            >
              Atualizar produtos
            </button>

          </div>

          {!loadingProducts && products.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground">
                {products.filter((product) => product.allowCrust).length} aceitam borda
              </span>
              <span className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {products.length} produtos cadastrados
              </span>
            </div>
          )}

          {loadingProducts ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-background p-10 text-center text-sm text-muted-foreground">
              Carregando produtos...
            </div>

          ) : products.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-background p-10 text-center text-sm text-muted-foreground">
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
                          ? "flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-left transition hover:bg-primary/10 disabled:cursor-wait disabled:opacity-60"
                          : "flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-foreground/20 hover:bg-background disabled:cursor-wait disabled:opacity-60"
                      }
                    >

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <p className="truncate font-bold text-foreground">
                            {product.name}
                          </p>

                          {!product.available && (
                            <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                              Produto inativo
                            </span>
                          )}

                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {product.category.name}
                        </p>

                      </div>

                      <div
                        className={
                          product.allowCrust
                            ? "relative h-6 w-11 shrink-0 rounded-full bg-primary transition"
                            : "relative h-6 w-11 shrink-0 rounded-full bg-muted-foreground/25 transition"
                        }
                      >
                        <span
                          className={
                            product.allowCrust
                              ? "absolute left-6 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition"
                              : "absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition"
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
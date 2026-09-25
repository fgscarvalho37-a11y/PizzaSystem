"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminHeader from "@/components/AdminHeader";
import { adminFetch } from "@/lib/adminFetch";

const API_URL = "";

type Addon = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  active: boolean;
  sortOrder: number;
};

type AddonGroup = {
  id: number;
  name: string;
  description?: string | null;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  active: boolean;
  sortOrder: number;
  addons?: Addon[];
};

type Product = {
  id: number;
  name: string;
  available: boolean;

  category: {
    id: number;
    name: string;
  };

  addonGroups?: AddonGroup[];
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

export default function AdminAdicionaisPage() {

  // =========================
  // DADOS
  // =========================

  const [
    groups,
    setGroups,
  ] = useState<AddonGroup[]>([]);

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

  // =========================
  // MENSAGENS
  // =========================

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  // =========================
  // GRUPO
  // =========================

  const [
    editingGroupId,
    setEditingGroupId,
  ] = useState<number | null>(
    null
  );

  const [
    groupName,
    setGroupName,
  ] = useState("");

  const [
    groupDescription,
    setGroupDescription,
  ] = useState("");

  const [
    groupRequired,
    setGroupRequired,
  ] = useState(false);

  const [
    groupMin,
    setGroupMin,
  ] = useState("0");

  const [
    groupMax,
    setGroupMax,
  ] = useState("1");

  const [
    groupSortOrder,
    setGroupSortOrder,
  ] = useState("0");

  const [
    groupActive,
    setGroupActive,
  ] = useState(true);

  const [
    savingGroup,
    setSavingGroup,
  ] = useState(false);

  const [
    updatingGroupId,
    setUpdatingGroupId,
  ] = useState<number | null>(
    null
  );

  // =========================
  // ADICIONAL
  // =========================

  const [
    selectedGroupId,
    setSelectedGroupId,
  ] = useState<number | null>(
    null
  );

  const [
    editingAddonId,
    setEditingAddonId,
  ] = useState<number | null>(
    null
  );

  const [
    addonName,
    setAddonName,
  ] = useState("");

  const [
    addonDescription,
    setAddonDescription,
  ] = useState("");

  const [
    addonPrice,
    setAddonPrice,
  ] = useState("0");

  const [
    addonSortOrder,
    setAddonSortOrder,
  ] = useState("0");

  const [
    addonActive,
    setAddonActive,
  ] = useState(true);

  const [
    savingAddon,
    setSavingAddon,
  ] = useState(false);

  const [
    updatingAddonId,
    setUpdatingAddonId,
  ] = useState<number | null>(
    null
  );

  // =========================
  // PRODUTOS
  // =========================

  const [
    updatingProductId,
    setUpdatingProductId,
  ] = useState<number | null>(
    null
  );

  // =========================
  // GRUPO SELECIONADO
  // =========================

  const selectedGroup =
    useMemo(
      () =>
        groups.find(
          (group) =>
            group.id ===
            selectedGroupId
        ) ?? null,
      [
        groups,
        selectedGroupId,
      ]
    );

  // =========================
  // CARREGAR GRUPOS
  // =========================

  async function loadGroups() {

    try {

      setErrorMessage("");

      const response =
        await adminFetch(
          `${API_URL}/api/addon-groups`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      if (!response.ok) {

        throw new Error(
          "Não foi possível carregar os grupos de adicionais."
        );
      }

      const data:
        AddonGroup[] =
        await response.json();

      setGroups(
        data
      );

      if (
        data.length > 0 &&
        selectedGroupId === null
      ) {

        setSelectedGroupId(
          data[0].id
        );
      }

    } catch (error) {

      console.error(
        error
      );

      setErrorMessage(
        "Não foi possível carregar os grupos de adicionais."
      );

    } finally {

      setLoading(
        false
      );
    }
  }

  // =========================
  // CARREGAR PRODUTOS
  // =========================

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
          "Não foi possível carregar os produtos."
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

            if (
              categoryCompare !== 0
            ) {

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

  // =========================
  // INICIAL
  // =========================

  useEffect(() => {

    loadGroups();
    loadProducts();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // LIMPAR GRUPO
  // =========================

  function clearGroupForm() {

    setEditingGroupId(
      null
    );

    setGroupName(
      ""
    );

    setGroupDescription(
      ""
    );

    setGroupRequired(
      false
    );

    setGroupMin(
      "0"
    );

    setGroupMax(
      "1"
    );

    setGroupSortOrder(
      "0"
    );

    setGroupActive(
      true
    );
  }

  // =========================
  // EDITAR GRUPO
  // =========================

  function startEditGroup(
    group: AddonGroup
  ) {

    setEditingGroupId(
      group.id
    );

    setGroupName(
      group.name
    );

    setGroupDescription(
      group.description ?? ""
    );

    setGroupRequired(
      group.required
    );

    setGroupMin(
      String(
        group.minSelections
      )
    );

    setGroupMax(
      String(
        group.maxSelections
      )
    );

    setGroupSortOrder(
      String(
        group.sortOrder
      )
    );

    setGroupActive(
      group.active
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
  // SALVAR GRUPO
  // =========================

  async function handleGroupSubmit(
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
      !groupName.trim()
    ) {

      setErrorMessage(
        "Informe o nome do grupo."
      );

      return;
    }

    const min =
      Number(
        groupMin
      );

    const max =
      Number(
        groupMax
      );

    const sort =
      Number(
        groupSortOrder
      );

    if (
      Number.isNaN(min) ||
      min < 0
    ) {

      setErrorMessage(
        "Quantidade mínima inválida."
      );

      return;
    }

    if (
      Number.isNaN(max) ||
      max < 1
    ) {

      setErrorMessage(
        "Quantidade máxima inválida."
      );

      return;
    }

    if (
      min > max
    ) {

      setErrorMessage(
        "A quantidade mínima não pode ser maior que a máxima."
      );

      return;
    }

    if (
      groupRequired &&
      min < 1
    ) {

      setErrorMessage(
        "Grupo obrigatório deve exigir pelo menos 1 escolha."
      );

      return;
    }

    if (
      !groupRequired &&
      min !== 0
    ) {

      setErrorMessage(
        "Grupo opcional deve ter quantidade mínima igual a 0."
      );

      return;
    }

    try {

      setSavingGroup(
        true
      );

      const url =
        editingGroupId ===
        null
          ? `${API_URL}/api/addon-groups`
          : `${API_URL}/api/addon-groups/${editingGroupId}`;

      const method =
        editingGroupId ===
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
                  groupName.trim(),

                description:
                  groupDescription.trim() ||
                  null,

                required:
                  groupRequired,

                minSelections:
                  min,

                maxSelections:
                  max,

                active:
                  groupActive,

                sortOrder:
                  sort,
              }),
          }
        );

      if (!response.ok) {

        const text =
          await response.text();

        let message =
          "Não foi possível salvar o grupo.";

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
          // mantém padrão
        }

        throw new Error(
          message
        );
      }

      setSuccessMessage(
        editingGroupId === null
          ? "Grupo criado com sucesso."
          : "Grupo atualizado com sucesso."
      );

      clearGroupForm();

      await loadGroups();

      await loadProducts();

    } catch (error) {

      console.error(
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o grupo."
      );

    } finally {

      setSavingGroup(
        false
      );
    }
  }

  // =========================
  // ATIVAR GRUPO
  // =========================

  async function toggleGroup(
    group: AddonGroup
  ) {

    try {

      setUpdatingGroupId(
        group.id
      );

      const response =
        await adminFetch(
          `${API_URL}/api/addon-groups/${group.id}/active?active=${!group.active}`,
          {
            method: "PATCH",
          }
        );

      if (!response.ok) {

        throw new Error(
          "Não foi possível alterar o grupo."
        );
      }

      setSuccessMessage(
        group.active
          ? `${group.name} foi desativado.`
          : `${group.name} foi ativado.`
      );

      await loadGroups();

      await loadProducts();

    } catch (error) {

      console.error(
        error
      );

      setErrorMessage(
        "Não foi possível alterar o grupo."
      );

    } finally {

      setUpdatingGroupId(
        null
      );
    }
  }

  // =========================
  // LIMPAR ADICIONAL
  // =========================

  function clearAddonForm() {

    setEditingAddonId(
      null
    );

    setAddonName(
      ""
    );

    setAddonDescription(
      ""
    );

    setAddonPrice(
      "0"
    );

    setAddonSortOrder(
      "0"
    );

    setAddonActive(
      true
    );
  }

  // =========================
  // EDITAR ADICIONAL
  // =========================

  function startEditAddon(
    addon: Addon
  ) {

    setEditingAddonId(
      addon.id
    );

    setAddonName(
      addon.name
    );

    setAddonDescription(
      addon.description ?? ""
    );

    setAddonPrice(
      String(
        addon.price
      )
    );

    setAddonSortOrder(
      String(
        addon.sortOrder
      )
    );

    setAddonActive(
      addon.active
    );

    setErrorMessage(
      ""
    );

    setSuccessMessage(
      ""
    );
  }

  // =========================
  // SALVAR ADICIONAL
  // =========================

  async function handleAddonSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();

    if (
      selectedGroupId === null
    ) {

      setErrorMessage(
        "Selecione um grupo."
      );

      return;
    }

    if (
      !addonName.trim()
    ) {

      setErrorMessage(
        "Informe o nome do adicional."
      );

      return;
    }

    const price =
      Number(
        addonPrice
      );

    const sort =
      Number(
        addonSortOrder
      );

    if (
      Number.isNaN(price) ||
      price < 0
    ) {

      setErrorMessage(
        "Informe um preço válido."
      );

      return;
    }

    if (
      Number.isNaN(sort) ||
      sort < 0
    ) {

      setErrorMessage(
        "Informe uma ordem válida."
      );

      return;
    }

    try {

      setSavingAddon(
        true
      );

      setErrorMessage(
        ""
      );

      const url =
        editingAddonId ===
        null
          ? `${API_URL}/api/addon-groups/${selectedGroupId}/addons`
          : `${API_URL}/api/addon-groups/${selectedGroupId}/addons/${editingAddonId}`;

      const method =
        editingAddonId ===
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
                  addonName.trim(),

                description:
                  addonDescription.trim() ||
                  null,

                price,

                active:
                  addonActive,

                sortOrder:
                  sort,
              }),
          }
        );

      if (!response.ok) {

        const text =
          await response.text();

        let message =
          "Não foi possível salvar o adicional.";

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
          // padrão
        }

        throw new Error(
          message
        );
      }

      setSuccessMessage(
        editingAddonId === null
          ? "Adicional criado com sucesso."
          : "Adicional atualizado com sucesso."
      );

      clearAddonForm();

      await loadGroups();

      await loadProducts();

    } catch (error) {

      console.error(
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o adicional."
      );

    } finally {

      setSavingAddon(
        false
      );
    }
  }

  // =========================
  // ATIVAR ADICIONAL
  // =========================

  async function toggleAddon(
    addon: Addon
  ) {

    if (
      selectedGroupId === null
    ) {

      return;
    }

    try {

      setUpdatingAddonId(
        addon.id
      );

      const response =
        await adminFetch(
          `${API_URL}/api/addon-groups/${selectedGroupId}/addons/${addon.id}/active?active=${!addon.active}`,
          {
            method: "PATCH",
          }
        );

      if (!response.ok) {

        throw new Error(
          "Não foi possível alterar o adicional."
        );
      }

      setSuccessMessage(
        addon.active
          ? `${addon.name} foi desativado.`
          : `${addon.name} foi ativado.`
      );

      await loadGroups();

      await loadProducts();

    } catch (error) {

      console.error(
        error
      );

      setErrorMessage(
        "Não foi possível alterar o adicional."
      );

    } finally {

      setUpdatingAddonId(
        null
      );
    }
  }

  // =========================
  // PRODUTO TEM GRUPO?
  // =========================

  function productHasGroup(
    product: Product,
    groupId: number
  ) {

    return (
      product.addonGroups ??
      []
    ).some(
      (group) =>
        group.id === groupId
    );
  }

  // =========================
  // VINCULAR PRODUTO
  // =========================

  async function toggleProductGroup(
    product: Product,
    group: AddonGroup
  ) {

    try {

      setUpdatingProductId(
        product.id
      );

      setErrorMessage(
        ""
      );

      const currentIds =
        (
          product.addonGroups ??
          []
        ).map(
          (item) =>
            item.id
        );

      const hasGroup =
        currentIds.includes(
          group.id
        );

      const newIds =
        hasGroup
          ? currentIds.filter(
              (id) =>
                id !==
                group.id
            )
          : [
              ...currentIds,
              group.id,
            ];

      const response =
        await adminFetch(
          `${API_URL}/api/products/${product.id}/addon-groups`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                newIds
              ),
          }
        );

      if (!response.ok) {

        throw new Error(
          "Não foi possível atualizar os grupos do produto."
        );
      }

      const updated:
        Product =
        await response.json();

      setProducts(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              product.id
                ? updated
                : item
          )
      );

      setSuccessMessage(
        hasGroup
          ? `${group.name} removido de ${product.name}.`
          : `${group.name} adicionado a ${product.name}.`
      );

    } catch (error) {

      console.error(
        error
      );

      setErrorMessage(
        "Não foi possível atualizar os grupos do produto."
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

      <div className="mx-auto max-w-[1380px] px-4 py-7 sm:px-6 lg:px-8">

        {/* =========================
            CABEÇALHO
        ========================= */}

        <div className="mb-6 border-b border-border pb-6">

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Cardápio
          </p>

          <h1 className="mt-2 font-display text-4xl uppercase leading-none tracking-tight text-foreground">
            Adicionais
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Crie grupos personalizados para qualquer tipo de produto, como complementos, molhos, extras, bordas e acompanhamentos.
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
            GRUPOS
        ========================= */}

        <div className="grid gap-6 xl:grid-cols-[390px_1fr]">

          <section className="h-fit rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">

            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              Grupo
            </p>

            <h2 className="mt-1 font-display text-2xl uppercase tracking-tight text-foreground">
              {editingGroupId === null
                ? "Novo grupo"
                : "Editar grupo"}
            </h2>

            <form
              onSubmit={
                handleGroupSubmit
              }
              className="mt-6 space-y-4"
            >

              <div>

                <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                  Nome
                </label>

                <input
                  value={
                    groupName
                  }
                  onChange={(
                    event
                  ) =>
                    setGroupName(
                      event.target.value
                    )
                  }
                  placeholder="Ex: Complementos"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary"
                />

              </div>

              <div>

                <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                  Descrição
                </label>

                <input
                  value={
                    groupDescription
                  }
                  onChange={(
                    event
                  ) =>
                    setGroupDescription(
                      event.target.value
                    )
                  }
                  placeholder="Ex: Escolha até 4 complementos"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:border-primary"
                />

              </div>

              <div className="grid grid-cols-2 gap-3">

                <div>

                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                    Mínimo
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      groupMin
                    }
                    onChange={(
                      event
                    ) =>
                      setGroupMin(
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm"
                  />

                </div>

                <div>

                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                    Máximo
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      groupMax
                    }
                    onChange={(
                      event
                    ) =>
                      setGroupMax(
                        event.target.value
                      )
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm"
                  />

                </div>

              </div>

              <div>

                <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                  Ordem
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    groupSortOrder
                  }
                  onChange={(
                    event
                  ) =>
                    setGroupSortOrder(
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm"
                />

              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background p-4">

                <div>

                  <p className="text-sm font-bold text-foreground">
                    Obrigatório
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    O cliente precisa selecionar uma opção.
                  </p>

                </div>

                <input
                  type="checkbox"
                  checked={
                    groupRequired
                  }
                  onChange={(
                    event
                  ) => {

                    const checked =
                      event.target.checked;

                    setGroupRequired(
                      checked
                    );

                    setGroupMin(
                      checked
                        ? "1"
                        : "0"
                    );
                  }}
                  className="h-5 w-5 accent-primary"
                />

              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background p-4">

                <span className="text-sm font-bold text-foreground">
                  Grupo ativo
                </span>

                <input
                  type="checkbox"
                  checked={
                    groupActive
                  }
                  onChange={(
                    event
                  ) =>
                    setGroupActive(
                      event.target.checked
                    )
                  }
                  className="h-5 w-5 accent-primary"
                />

              </label>

              <button
                type="submit"
                disabled={
                  savingGroup
                }
                className="h-11 w-full rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {savingGroup
                  ? "Salvando..."
                  : editingGroupId === null
                    ? "Criar grupo"
                    : "Salvar grupo"}
              </button>

              {editingGroupId !== null && (
                <button
                  type="button"
                  onClick={
                    clearGroupForm
                  }
                  className="h-11 w-full rounded-xl border border-input text-sm font-semibold"
                >
                  Cancelar edição
                </button>
              )}

            </form>

          </section>

          <section className="rounded-[24px] border border-border bg-card p-5">

            <div className="flex items-center justify-between gap-4">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  Grupos cadastrados
                </p>

                <h2 className="mt-1 font-display text-2xl uppercase text-foreground">
                  Personalização
                </h2>

              </div>

              <button
                type="button"
                onClick={
                  loadGroups
                }
                className="rounded-xl border border-input px-4 py-2 text-sm font-semibold"
              >
                Atualizar
              </button>

            </div>

            {loading ? (

              <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Carregando...
              </div>

            ) : groups.length === 0 ? (

              <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Nenhum grupo cadastrado.
              </div>

            ) : (

              <div className="mt-6 grid gap-3 md:grid-cols-2">

                {groups.map(
                  (group) => (

                    <article
                      key={
                        group.id
                      }
                      className={`rounded-2xl border p-4 ${
                        selectedGroupId ===
                        group.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background"
                      }`}
                    >

                      <button
                        type="button"
                        onClick={() => {

                          setSelectedGroupId(
                            group.id
                          );

                          clearAddonForm();
                        }}
                        className="w-full text-left"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div>

                            <h3 className="font-bold text-foreground">
                              {group.name}
                            </h3>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {group.required
                                ? "Obrigatório"
                                : "Opcional"}
                              {" • "}
                              {group.minSelections} até {group.maxSelections}
                            </p>

                          </div>

                          <span
                            className={
                              group.active
                                ? "rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700"
                                : "rounded-full bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground"
                            }
                          >
                            {group.active
                              ? "ATIVO"
                              : "INATIVO"}
                          </span>

                        </div>

                        <p className="mt-3 text-xs text-muted-foreground">
                          {(group.addons ?? []).length} adicionais
                        </p>

                      </button>

                      <div className="mt-4 flex gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            startEditGroup(
                              group
                            )
                          }
                          className="rounded-lg border border-input px-3 py-2 text-xs font-bold"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          disabled={
                            updatingGroupId ===
                            group.id
                          }
                          onClick={() =>
                            toggleGroup(
                              group
                            )
                          }
                          className="rounded-lg border border-input px-3 py-2 text-xs font-bold"
                        >
                          {group.active
                            ? "Desativar"
                            : "Ativar"}
                        </button>

                      </div>

                    </article>
                  )
                )}

              </div>
            )}

          </section>

        </div>

        {/* =========================
            ADICIONAIS
        ========================= */}

        {selectedGroup && (

          <section className="mt-6 rounded-[24px] border border-border bg-card p-5">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Opções
              </p>

              <h2 className="mt-1 font-display text-2xl uppercase text-foreground">
                {selectedGroup.name}
              </h2>

            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">

              <form
                onSubmit={
                  handleAddonSubmit
                }
                className="space-y-4 rounded-2xl border border-border bg-background p-4"
              >

                <h3 className="font-bold text-foreground">
                  {editingAddonId === null
                    ? "Novo adicional"
                    : "Editar adicional"}
                </h3>

                <input
                  value={
                    addonName
                  }
                  onChange={(
                    event
                  ) =>
                    setAddonName(
                      event.target.value
                    )
                  }
                  placeholder="Nome"
                  className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm"
                />

                <input
                  value={
                    addonDescription
                  }
                  onChange={(
                    event
                  ) =>
                    setAddonDescription(
                      event.target.value
                    )
                  }
                  placeholder="Descrição opcional"
                  className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm"
                />

                <div className="grid grid-cols-2 gap-3">

                  <div>

                    <label className="mb-1 block text-xs font-bold text-muted-foreground">
                      Preço adicional
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        addonPrice
                      }
                      onChange={(
                        event
                      ) =>
                        setAddonPrice(
                          event.target.value
                        )
                      }
                      className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm"
                    />

                  </div>

                  <div>

                    <label className="mb-1 block text-xs font-bold text-muted-foreground">
                      Ordem
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        addonSortOrder
                      }
                      onChange={(
                        event
                      ) =>
                        setAddonSortOrder(
                          event.target.value
                        )
                      }
                      className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm"
                    />

                  </div>

                </div>

                <label className="flex items-center justify-between rounded-xl border border-border p-3">

                  <span className="text-sm font-bold">
                    Ativo
                  </span>

                  <input
                    type="checkbox"
                    checked={
                      addonActive
                    }
                    onChange={(
                      event
                    ) =>
                      setAddonActive(
                        event.target.checked
                      )
                    }
                    className="h-5 w-5 accent-primary"
                  />

                </label>

                <button
                  type="submit"
                  disabled={
                    savingAddon
                  }
                  className="h-11 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground"
                >
                  {savingAddon
                    ? "Salvando..."
                    : editingAddonId === null
                      ? "Adicionar"
                      : "Salvar"}
                </button>

                {editingAddonId !== null && (

                  <button
                    type="button"
                    onClick={
                      clearAddonForm
                    }
                    className="h-11 w-full rounded-xl border border-input text-sm font-semibold"
                  >
                    Cancelar
                  </button>

                )}

              </form>

              <div>

                {(selectedGroup.addons ?? []).length === 0 ? (

                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    Nenhuma opção cadastrada neste grupo.
                  </div>

                ) : (

                  <div className="grid gap-3 md:grid-cols-2">

                    {(selectedGroup.addons ?? []).map(
                      (addon) => (

                        <article
                          key={
                            addon.id
                          }
                          className="rounded-2xl border border-border bg-background p-4"
                        >

                          <div className="flex justify-between gap-4">

                            <div>

                              <h3 className="font-bold text-foreground">
                                {addon.name}
                              </h3>

                              <p className="mt-1 text-lg font-bold text-foreground">
                                {Number(
                                  addon.price
                                ) === 0
                                  ? "Grátis"
                                  : `+ ${formatMoney(
                                      Number(
                                        addon.price
                                      )
                                    )}`}
                              </p>

                            </div>

                            <span
                              className={
                                addon.active
                                  ? "h-fit rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700"
                                  : "h-fit rounded-full bg-muted px-2 py-1 text-[10px] font-bold"
                              }
                            >
                              {addon.active
                                ? "ATIVO"
                                : "INATIVO"}
                            </span>

                          </div>

                          <div className="mt-4 flex gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                startEditAddon(
                                  addon
                                )
                              }
                              className="rounded-lg border border-input px-3 py-2 text-xs font-bold"
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              disabled={
                                updatingAddonId ===
                                addon.id
                              }
                              onClick={() =>
                                toggleAddon(
                                  addon
                                )
                              }
                              className="rounded-lg border border-input px-3 py-2 text-xs font-bold"
                            >
                              {addon.active
                                ? "Desativar"
                                : "Ativar"}
                            </button>

                          </div>

                        </article>
                      )
                    )}

                  </div>
                )}

              </div>

            </div>

          </section>
        )}

        {/* =========================
            PRODUTOS
        ========================= */}

        <section className="mt-6 rounded-[24px] border border-border bg-card p-5">

          <div>

            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              Aplicação
            </p>

            <h2 className="mt-1 font-display text-2xl uppercase text-foreground">
              Produtos
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Escolha quais grupos aparecem em cada produto.
            </p>

          </div>

          {loadingProducts ? (

            <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Carregando produtos...
            </div>

          ) : (

            <div className="mt-6 space-y-4">

              {products.map(
                (product) => (

                  <article
                    key={
                      product.id
                    }
                    className="rounded-2xl border border-border bg-background p-4"
                  >

                    <div className="flex flex-wrap items-center justify-between gap-3">

                      <div>

                        <h3 className="font-bold text-foreground">
                          {product.name}
                        </h3>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {product.category.name}
                        </p>

                      </div>

                      {!product.available && (

                        <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                          PRODUTO INATIVO
                        </span>

                      )}

                    </div>

                    {groups.length === 0 ? (

                      <p className="mt-4 text-sm text-muted-foreground">
                        Crie um grupo primeiro.
                      </p>

                    ) : (

                      <div className="mt-4 flex flex-wrap gap-2">

                        {groups.map(
                          (group) => {

                            const selected =
                              productHasGroup(
                                product,
                                group.id
                              );

                            const updating =
                              updatingProductId ===
                              product.id;

                            return (

                              <button
                                key={
                                  group.id
                                }
                                type="button"
                                disabled={
                                  updating
                                }
                                onClick={() =>
                                  toggleProductGroup(
                                    product,
                                    group
                                  )
                                }
                                className={
                                  selected
                                    ? "rounded-xl border border-primary bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
                                    : "rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:border-primary"
                                }
                              >
                                {selected
                                  ? "✓ "
                                  : "+ "}
                                {group.name}
                              </button>

                            );
                          }
                        )}

                      </div>
                    )}

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
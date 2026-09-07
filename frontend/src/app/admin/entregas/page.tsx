"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import AdminHeader from "@/components/AdminHeader";
import { adminFetch } from "@/lib/adminFetch";


type DeliveryArea = {
  id: number;
  neighborhood: string;
  fee: number;
  active: boolean;
};

export default function AdminEntregasPage() {
  const [areas, setAreas] =
    useState<DeliveryArea[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [neighborhood, setNeighborhood] =
    useState("");

  const [fee, setFee] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  // =========================
  // CARREGAR ÁREAS
  // =========================

  async function loadAreas() {
    try {
      setErrorMessage("");

      const response =
  await adminFetch(
    "http://localhost:8080/api/delivery-areas",
    {
      cache: "no-store",
      credentials: "include",
    }
  );

      if (!response.ok) {
        throw new Error(
          "Erro ao carregar bairros"
        );
      }

      const data: DeliveryArea[] =
        await response.json();

      setAreas(data);

    } catch {
      setErrorMessage(
        "Não foi possível carregar as áreas de entrega."
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAreas();
  }, []);

  // =========================
  // CRIAR ÁREA
  // =========================

  async function handleCreate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!neighborhood.trim()) {
      setErrorMessage(
        "Informe o nome do bairro."
      );

      return;
    }

    if (!fee.trim()) {
      setErrorMessage(
        "Informe a taxa de entrega."
      );

      return;
    }

    const parsedFee =
      Number(fee);

    if (
      Number.isNaN(parsedFee) ||
      parsedFee < 0
    ) {
      setErrorMessage(
        "Informe uma taxa válida."
      );

      return;
    }

    try {
      setSubmitting(true);

      const response =
  await adminFetch(
    "http://localhost:8080/api/delivery-areas",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      credentials: "include",

      body: JSON.stringify({
        neighborhood:
          neighborhood.trim(),

        fee: parsedFee,

        active: true,
      }),
    }
  );

      if (!response.ok) {
        const text =
          await response.text();

        console.error(
          "Erro ao cadastrar bairro:",
          text
        );

        throw new Error(
          "Erro ao cadastrar bairro"
        );
      }

      setNeighborhood("");
      setFee("");

      setSuccessMessage(
        "Bairro cadastrado com sucesso."
      );

      await loadAreas();

    } catch {
      setErrorMessage(
        "Não foi possível cadastrar o bairro."
      );

    } finally {
      setSubmitting(false);
    }
  }

  // =========================
  // ATIVAR / DESATIVAR
  // =========================

  async function toggleActive(
    area: DeliveryArea
  ) {
    try {
      setUpdatingId(
        area.id
      );

      setErrorMessage("");
      setSuccessMessage("");

      const response =
  await adminFetch(
    `http://localhost:8080/api/delivery-areas/${area.id}/active?active=${!area.active}`,
    {
      method: "PATCH",
      credentials: "include",
    }
  );

      if (!response.ok) {
        throw new Error(
          "Erro ao alterar status"
        );
      }

      setSuccessMessage(
        area.active
          ? `${area.neighborhood} foi desativado.`
          : `${area.neighborhood} foi ativado.`
      );

      await loadAreas();

    } catch {
      setErrorMessage(
        "Não foi possível alterar o status do bairro."
      );

    } finally {
      setUpdatingId(
        null
      );
    }
  }

  // =========================
  // ATUALIZAR TAXA
  // =========================

  async function updateFee(
    area: DeliveryArea,
    newFee: string
  ) {
    const parsedFee =
      Number(newFee);

    if (
      Number.isNaN(parsedFee) ||
      parsedFee < 0
    ) {
      setErrorMessage(
        "Informe uma taxa válida."
      );

      return;
    }

    /*
     * Se não mudou o valor,
     * não precisa chamar a API.
     */
    if (
      parsedFee ===
      Number(area.fee)
    ) {
      return;
    }

    try {
      setUpdatingId(
        area.id
      );

      setErrorMessage("");
      setSuccessMessage("");

      const response =
  await adminFetch(
    `http://localhost:8080/api/delivery-areas/${area.id}`,
    {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",
      },

      credentials: "include",

      body: JSON.stringify({
        neighborhood:
          area.neighborhood,

        fee:
          parsedFee,

        active:
          area.active,
      }),
    }
  );
      if (!response.ok) {
        throw new Error(
          "Erro ao atualizar taxa"
        );
      }

      setSuccessMessage(
        `Taxa de ${area.neighborhood} atualizada.`
      );

      await loadAreas();

    } catch {
      setErrorMessage(
        "Não foi possível atualizar a taxa."
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
        title="Áreas de entrega"
      />

      {/* =========================
          CONTEÚDO
          ========================= */}

      <div className="mx-auto max-w-6xl p-6">

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Entrega
            </p>

            <h2 className="mt-1 text-3xl font-bold text-gray-900">
              Áreas de entrega
            </h2>

            <p className="mt-2 max-w-2xl text-gray-600">
              Cadastre os bairros atendidos, configure as taxas e controle quais regiões estão disponíveis no checkout.
            </p>

          </div>

          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm">

            <p className="text-sm text-gray-500">
              Bairros ativos
            </p>

            <p className="mt-1 text-3xl font-bold text-gray-900">
              {
                areas.filter(
                  (area) =>
                    area.active
                ).length
              }
            </p>

          </div>

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
            NOVO BAIRRO
            ========================= */}

        <form
          onSubmit={
            handleCreate
          }
          className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >

          <div>

            <h3 className="text-xl font-bold text-gray-900">
              Novo bairro
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              O bairro será disponibilizado automaticamente no checkout após o cadastro.
            </p>

          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_200px_auto]">

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Bairro
              </label>

              <input
                required
                value={
                  neighborhood
                }
                onChange={(
                  event
                ) =>
                  setNeighborhood(
                    event.target.value
                  )
                }
                placeholder="Ex: Centro"
                className="h-12 w-full rounded-xl border border-gray-300 px-4 outline-none transition focus:border-black"
              />

            </div>

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Taxa de entrega
              </label>

              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={
                  fee
                }
                onChange={(
                  event
                ) =>
                  setFee(
                    event.target.value
                  )
                }
                placeholder="0,00"
                className="h-12 w-full rounded-xl border border-gray-300 px-4 outline-none transition focus:border-black"
              />

            </div>

            <div className="flex items-end">

              <button
                type="submit"
                disabled={
                  submitting
                }
                className="h-12 w-full rounded-xl bg-black px-6 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
              >
                {submitting
                  ? "Salvando..."
                  : "Cadastrar"}
              </button>

            </div>

          </div>

        </form>

        {/* =========================
            BAIRROS CADASTRADOS
            ========================= */}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h3 className="text-xl font-bold text-gray-900">
                Bairros cadastrados
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {areas.length}{" "}
                {areas.length === 1
                  ? "bairro cadastrado"
                  : "bairros cadastrados"}
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                loadAreas()
              }
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Atualizar
            </button>

          </div>

          {loading ? (

            <div className="mt-6 rounded-xl bg-gray-50 p-6 text-center">

              <p className="text-gray-500">
                Carregando bairros...
              </p>

            </div>

          ) : areas.length === 0 ? (

            <div className="mt-6 rounded-xl bg-gray-50 p-8 text-center">

              <p className="text-4xl">
                🛵
              </p>

              <h4 className="mt-3 font-bold text-gray-900">
                Nenhum bairro cadastrado
              </h4>

              <p className="mt-1 text-sm text-gray-500">
                Cadastre o primeiro bairro para liberar entregas no checkout.
              </p>

            </div>

          ) : (

            <div className="mt-6 space-y-4">

              {areas.map(
                (area) => (

                  <div
                    key={area.id}
                    className="grid items-center gap-5 rounded-xl border border-gray-200 p-5 md:grid-cols-[1fr_190px_170px]"
                  >

                    {/* BAIRRO */}

                    <div>

                      <div className="flex flex-wrap items-center gap-2">

                        <p className="text-lg font-bold text-gray-900">
                          {area.neighborhood}
                        </p>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            area.active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {area.active
                            ? "Ativo"
                            : "Inativo"}
                        </span>

                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        {area.active
                          ? "Disponível para seleção no checkout."
                          : "Não aparece para novos pedidos."}
                      </p>

                    </div>

                    {/* TAXA */}

                    <div>

                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Taxa
                      </label>

                      <div className="flex items-center rounded-lg border border-gray-300 bg-white px-3">

                        <span className="text-sm text-gray-500">
                          R$
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={
                            Number(
                              area.fee
                            )
                          }
                          onBlur={(
                            event
                          ) =>
                            updateFee(
                              area,
                              event.target.value
                            )
                          }
                          disabled={
                            updatingId ===
                            area.id
                          }
                          className="h-10 w-full bg-transparent px-2 outline-none disabled:opacity-50"
                        />

                      </div>

                    </div>

                    {/* STATUS */}

                    <div>

                      <button
                        type="button"
                        disabled={
                          updatingId ===
                          area.id
                        }
                        onClick={() =>
                          toggleActive(
                            area
                          )
                        }
                        className={`w-full rounded-xl px-4 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          area.active
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {updatingId ===
                        area.id
                          ? "Atualizando..."
                          : area.active
                            ? "Desativar bairro"
                            : "Ativar bairro"}
                      </button>

                    </div>

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
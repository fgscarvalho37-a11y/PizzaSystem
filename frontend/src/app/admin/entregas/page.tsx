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
    `${API_URL}/api/delivery-areas`,
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
    `${API_URL}/api/delivery-areas`,
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
    `${API_URL}/api/delivery-areas/${area.id}/active?active=${!area.active}`,
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
    `${API_URL}/api/delivery-areas/${area.id}`,
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
    <main className="min-h-screen bg-background">

      <AdminHeader />

      {/* =========================
          CONTEÚDO
          ========================= */}

      <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 lg:px-8">

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Entrega
            </p>

            <h2 className="mt-2 font-display text-4xl uppercase leading-none tracking-tight text-foreground">
              Áreas de entrega
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Cadastre os bairros atendidos, configure as taxas e controle quais regiões estão disponíveis no checkout.
            </p>

          </div>

          <div className="min-w-[170px] rounded-2xl border border-border bg-card p-5 shadow-sm">

            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Bairros ativos
            </p>

            <div className="mt-2 flex items-end justify-between">

              <p className="text-3xl font-bold tracking-tight text-foreground">
                {
                  areas.filter(
                    (area) =>
                      area.active
                  ).length
                }
              </p>

              <span className="mb-1 h-2.5 w-2.5 rounded-full bg-primary" />

            </div>

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
          className="mb-6 rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
        >

          <div>

            <h3 className="font-display text-2xl uppercase tracking-tight text-foreground">
              Novo bairro
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              O bairro será disponibilizado automaticamente no checkout após o cadastro.
            </p>

          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_200px_auto]">

            <div>

              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
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
                className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
              />

            </div>

            <div>

              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
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
                className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
              />

            </div>

            <div className="flex items-end">

              <button
                type="submit"
                disabled={
                  submitting
                }
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-sm disabled:pointer-events-none disabled:opacity-50 md:w-auto"
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

        <section className="rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h3 className="text-xl font-bold text-foreground">
                Bairros cadastrados
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
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
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/40"
            >
              Atualizar
            </button>

          </div>

          {loading ? (

            <div className="mt-6 rounded-2xl border border-dashed border-border bg-background p-10 text-center">

              <p className="text-muted-foreground">
                Carregando bairros...
              </p>

            </div>

          ) : areas.length === 0 ? (

            <div className="mt-6 rounded-2xl border border-dashed border-border bg-background p-10 text-center">

              <p className="text-4xl">
                🛵
              </p>

              <h4 className="mt-3 font-bold text-foreground">
                Nenhum bairro cadastrado
              </h4>

              <p className="mt-1 text-sm text-muted-foreground">
                Cadastre o primeiro bairro para liberar entregas no checkout.
              </p>

            </div>

          ) : (

            <div className="mt-6 space-y-4">

              {areas.map(
                (area) => (

                  <div
                    key={area.id}
                    className="grid items-center gap-5 rounded-[20px] border border-border bg-background p-5 transition hover:-translate-y-0.5 hover:border-foreground/10 hover:shadow-sm md:grid-cols-[1fr_190px_150px]"
                  >

                    {/* BAIRRO */}

                    <div>

                      <div className="flex flex-wrap items-center gap-2">

                        <p className="text-lg font-bold tracking-tight text-foreground">
                          {area.neighborhood}
                        </p>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                            area.active
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border border-border bg-muted text-muted-foreground"
                          }`}
                        >
                          {area.active
                            ? "Ativo"
                            : "Inativo"}
                        </span>

                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {area.active
                          ? "Disponível para seleção no checkout."
                          : "Não aparece para novos pedidos."}
                      </p>

                    </div>

                    {/* TAXA */}

                    <div>

                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                        Taxa
                      </label>

                      <div className="flex h-11 items-center rounded-xl border border-input bg-card px-3 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">

                        <span className="text-sm text-muted-foreground">
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
                          className="h-10 w-full bg-transparent px-2 text-sm font-bold text-foreground outline-none disabled:opacity-50"
                        />

                      </div>

                    </div>

                    {/* STATUS */}

                    <div>

                      <button
                        type="button"
                        disabled={updatingId === area.id}
                        onClick={() => toggleActive(area)}
                        className="group flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-3.5 py-3 text-left transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                        aria-pressed={area.active}
                      >
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {updatingId === area.id
                              ? "Atualizando..."
                              : area.active
                                ? "Recebendo pedidos"
                                : "Indisponível"}
                          </p>

                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            Clique para {area.active ? "desativar" : "ativar"}
                          </p>
                        </div>

                        <span
                          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                            area.active
                              ? "bg-primary"
                              : "bg-muted-foreground/25"
                          }`}
                        >
                          <span
                            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                              area.active
                                ? "left-6"
                                : "left-1"
                            }`}
                          />
                        </span>
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
"use client";

import {
  useEffect,
  useState,
} from "react";

import AdminHeader from "@/components/AdminHeader";

type BusinessHours = {
  id?: number;
  dayOfWeek: string;
  openingTime: string | null;
  closingTime: string | null;
  enabled: boolean;
};

const days = [
  {
    value: "MONDAY",
    label: "Segunda-feira",
  },
  {
    value: "TUESDAY",
    label: "Terça-feira",
  },
  {
    value: "WEDNESDAY",
    label: "Quarta-feira",
  },
  {
    value: "THURSDAY",
    label: "Quinta-feira",
  },
  {
    value: "FRIDAY",
    label: "Sexta-feira",
  },
  {
    value: "SATURDAY",
    label: "Sábado",
  },
  {
    value: "SUNDAY",
    label: "Domingo",
  },
];

export default function AdminHorariosPage() {
  const [
    hours,
    setHours,
  ] = useState<
    Record<string, BusinessHours>
  >({});

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    savingDay,
    setSavingDay,
  ] = useState<string | null>(
    null
  );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  // =========================
  // CARREGAR HORÁRIOS
  // =========================

  async function loadHours() {
    try {
      setErrorMessage("");

      const response =
        await fetch(
          "http://localhost:8080/api/business-hours",
          {
            cache: "no-store",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Erro ao carregar horários"
        );
      }

      const data:
        BusinessHours[] =
        await response.json();

      const map:
        Record<
          string,
          BusinessHours
        > = {};

      for (const day of days) {
        const existing =
          data.find(
            (item) =>
              item.dayOfWeek ===
              day.value
          );

        map[day.value] =
          existing ?? {
            dayOfWeek:
              day.value,

            openingTime:
              "18:00",

            closingTime:
              "23:00",

            enabled:
              false,
          };
      }

      setHours(map);

    } catch {
      setErrorMessage(
        "Não foi possível carregar os horários de funcionamento."
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHours();
  }, []);

  // =========================
  // ALTERAR CAMPO
  // =========================

  function updateField(
    day: string,
    field:
      keyof BusinessHours,
    value:
      string | boolean
  ) {
    setHours(
      (current) => ({
        ...current,

        [day]: {
          ...current[day],
          [field]: value,
        },
      })
    );
  }

  // =========================
  // SALVAR DIA
  // =========================

  async function saveDay(
    day: string
  ) {
    const data =
      hours[day];

    if (!data) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    if (
      data.enabled &&
      (
        !data.openingTime ||
        !data.closingTime
      )
    ) {
      setErrorMessage(
        "Informe os horários de abertura e fechamento."
      );

      return;
    }

    try {
      setSavingDay(
        day
      );

      const response =
        await fetch(
          `http://localhost:8080/api/business-hours/${day}`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                openingTime:
                  data.openingTime,

                closingTime:
                  data.closingTime,

                enabled:
                  data.enabled,
              }),
          }
        );

      if (!response.ok) {
        throw new Error(
          "Erro ao salvar horário"
        );
      }

      const dayLabel =
        days.find(
          (item) =>
            item.value === day
        )?.label ?? day;

      setSuccessMessage(
        `Horário de ${dayLabel} salvo com sucesso.`
      );

      await loadHours();

    } catch {
      setErrorMessage(
        "Não foi possível salvar o horário."
      );

    } finally {
      setSavingDay(
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
        title="Horários de funcionamento"
      />

      <div className="mx-auto max-w-6xl p-6">

        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Funcionamento
          </p>

          <h2 className="mt-1 text-3xl font-bold text-gray-900">
            Horários
          </h2>

          <p className="mt-2 max-w-3xl text-gray-600">
            Defina os dias e horários em que a pizzaria pode receber novos pedidos.
            Horários que passam da meia-noite também são aceitos.
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
            RESUMO
            ========================= */}

        {!loading && (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-gray-500">
                Dias ativos
              </p>

              <p className="mt-1 text-3xl font-bold text-gray-900">
                {
                  days.filter(
                    (day) =>
                      hours[
                        day.value
                      ]?.enabled
                  ).length
                }
              </p>

            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-gray-500">
                Dias fechados
              </p>

              <p className="mt-1 text-3xl font-bold text-gray-900">
                {
                  days.filter(
                    (day) =>
                      !hours[
                        day.value
                      ]?.enabled
                  ).length
                }
              </p>

            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-gray-500">
                Total configurado
              </p>

              <p className="mt-1 text-3xl font-bold text-gray-900">
                7
              </p>

            </div>

          </div>
        )}

        {/* =========================
            HORÁRIOS
            ========================= */}

        {loading ? (

          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">

            <p className="font-semibold text-gray-600">
              Carregando horários...
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {days.map(
              (day) => {

                const data =
                  hours[
                    day.value
                  ];

                if (!data) {
                  return null;
                }

                return (
                  <section
                    key={
                      day.value
                    }
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                  >

                    <div className="grid items-end gap-5 lg:grid-cols-[1fr_180px_180px_160px_150px]">

                      {/* DIA */}

                      <div>

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="text-lg font-bold text-gray-900">
                            {
                              day.label
                            }
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              data.enabled
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {data.enabled
                              ? "Aberto"
                              : "Fechado"}
                          </span>

                        </div>

                        <p className="mt-2 text-sm text-gray-500">

                          {data.enabled
                            ? data.openingTime &&
                              data.closingTime
                              ? `Recebe pedidos das ${data.openingTime.slice(
                                  0,
                                  5
                                )} às ${data.closingTime.slice(
                                  0,
                                  5
                                )}.`
                              : "Horário ativado."
                            : "Não recebe pedidos neste dia."}

                        </p>

                      </div>

                      {/* ABERTURA */}

                      <div>

                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Abertura
                        </label>

                        <input
                          type="time"
                          disabled={
                            !data.enabled
                          }
                          value={
                            data.openingTime
                              ? data.openingTime.slice(
                                  0,
                                  5
                                )
                              : ""
                          }
                          onChange={(
                            event
                          ) =>
                            updateField(
                              day.value,
                              "openingTime",
                              event.target.value
                            )
                          }
                          className="h-12 w-full rounded-xl border border-gray-300 bg-white px-3 outline-none transition focus:border-black disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                        />

                      </div>

                      {/* FECHAMENTO */}

                      <div>

                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Fechamento
                        </label>

                        <input
                          type="time"
                          disabled={
                            !data.enabled
                          }
                          value={
                            data.closingTime
                              ? data.closingTime.slice(
                                  0,
                                  5
                                )
                              : ""
                          }
                          onChange={(
                            event
                          ) =>
                            updateField(
                              day.value,
                              "closingTime",
                              event.target.value
                            )
                          }
                          className="h-12 w-full rounded-xl border border-gray-300 bg-white px-3 outline-none transition focus:border-black disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                        />

                      </div>

                      {/* ATIVAR */}

                      <button
                        type="button"
                        onClick={() =>
                          updateField(
                            day.value,
                            "enabled",
                            !data.enabled
                          )
                        }
                        className={`h-12 rounded-xl px-4 font-semibold text-white transition ${
                          data.enabled
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gray-500 hover:bg-gray-600"
                        }`}
                      >
                        {data.enabled
                          ? "Ativado"
                          : "Desativado"}
                      </button>

                      {/* SALVAR */}

                      <button
                        type="button"
                        onClick={() =>
                          saveDay(
                            day.value
                          )
                        }
                        disabled={
                          savingDay ===
                          day.value
                        }
                        className="h-12 rounded-xl bg-black px-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingDay ===
                        day.value
                          ? "Salvando..."
                          : "Salvar"}
                      </button>

                    </div>

                  </section>
                );
              }
            )}

          </div>
        )}

        {/* =========================
            AVISO
            ========================= */}

        <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5">

          <p className="font-semibold text-blue-800">
            Horários após meia-noite
          </p>

          <p className="mt-1 text-sm leading-6 text-blue-700">
            Você pode configurar, por exemplo, sexta-feira das 18:00 às 02:00.
            O sistema entende automaticamente que o funcionamento continua durante
            a madrugada de sábado.
          </p>

        </div>

      </div>

    </main>
  );
}
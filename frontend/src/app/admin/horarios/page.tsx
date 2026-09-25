"use client";

import {
  useEffect,
  useState,
} from "react";

import AdminHeader from "@/components/AdminHeader";
import { adminFetch } from "@/lib/adminFetch";

type BusinessHours = {
  id?: number;
  dayOfWeek: string;
  openingTime: string | null;
  closingTime: string | null;
  enabled: boolean;
};

type IconProps = {
  className?: string;
};

const API_URL = "";

const days = [
  {
    value: "MONDAY",
    label: "Segunda-feira",
    short: "SEG",
  },
  {
    value: "TUESDAY",
    label: "Terça-feira",
    short: "TER",
  },
  {
    value: "WEDNESDAY",
    label: "Quarta-feira",
    short: "QUA",
  },
  {
    value: "THURSDAY",
    label: "Quinta-feira",
    short: "QUI",
  },
  {
    value: "FRIDAY",
    label: "Sexta-feira",
    short: "SEX",
  },
  {
    value: "SATURDAY",
    label: "Sábado",
    short: "SÁB",
  },
  {
    value: "SUNDAY",
    label: "Domingo",
    short: "DOM",
  },
];

function MoonIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 15.3A9 9 0 0 1 8.7 4a9 9 0 1 0 11.3 11.3Z" />
    </svg>
  );
}

function CheckIcon({
  className = "h-4 w-4",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function AlertIcon({
  className = "h-5 w-5",
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 8v5" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.2"
      />

      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HoursSkeleton() {
  return (
    <div
      className="space-y-3"
      role="status"
      aria-label="Carregando horários"
    >
      {[1, 2, 3, 4, 5, 6, 7].map(
        (item) => (
          <div
            key={item}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-muted" />

                <div className="flex-1">
                  <div className="h-4 w-32 rounded bg-muted" />
                  <div className="mt-2 h-3 w-48 rounded bg-muted" />
                </div>

                <div className="hidden h-10 w-32 rounded-xl bg-muted md:block" />
                <div className="hidden h-10 w-32 rounded-xl bg-muted md:block" />
                <div className="h-9 w-20 rounded-xl bg-muted" />
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default function AdminHorariosPage() {
  const [
    hours,
    setHours,
  ] =
    useState<
      Record<
        string,
        BusinessHours
      >
    >({});

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    savingDay,
    setSavingDay,
  ] =
    useState<
      string | null
    >(null);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");

  async function loadHours() {
    try {
      setErrorMessage("");

      const response =
        await adminFetch(
          `${API_URL}/api/business-hours`,
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

      for (
        const day of days
      ) {
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

    setSuccessMessage("");
  }

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
      setSavingDay(day);

      const response =
        await adminFetch(
          `${API_URL}/api/business-hours/${day}`,
          {
            method: "PUT",

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
        `${dayLabel} atualizado com sucesso.`
      );

      await loadHours();

    } catch {
      setErrorMessage(
        "Não foi possível salvar o horário."
      );

    } finally {
      setSavingDay(null);
    }
  }

  const activeDays =
    days.filter(
      (day) =>
        hours[
          day.value
        ]?.enabled
    ).length;

  const closedDays =
    7 -
    activeDays;

  return (
    <main className="min-h-screen bg-background">

      <AdminHeader />

      <div className="mx-auto max-w-[1100px] px-4 py-7 sm:px-6 lg:px-8">

        <section className="border-b border-border pb-6">

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Funcionamento
          </p>

          <h1 className="mt-2 font-display text-4xl uppercase leading-none tracking-tight text-foreground">
            Horários
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Defina quando a pizzaria pode receber novos pedidos pelo cardápio.
          </p>

        </section>

        {!loading && (
          <section className="mt-6 grid gap-3 sm:grid-cols-3">

            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Dias ativos
              </p>

              <div className="mt-2 flex items-end justify-between">
                <p className="text-2xl font-bold text-foreground">
                  {activeDays}
                </p>

                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Fechados
              </p>

              <p className="mt-2 text-2xl font-bold text-foreground">
                {closedDays}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Semana
              </p>

              <p className="mt-2 text-2xl font-bold text-foreground">
                7 dias
              </p>
            </div>

          </section>
        )}

        {errorMessage && (
          <div
            className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
            role="alert"
          >
            <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />

            <div>
              <p className="text-sm font-bold text-red-800">
                Não foi possível concluir
              </p>

              <p className="mt-1 text-sm text-red-700">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {successMessage && (
          <div
            className="mt-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
            role="status"
          >
            <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />

            <div>
              <p className="text-sm font-bold text-emerald-800">
                Alteração salva
              </p>

              <p className="mt-1 text-sm text-emerald-700">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        <section className="mt-6">

          {loading ? (
            <HoursSkeleton />

          ) : (
            <div className="space-y-3">

              {days.map(
                (day) => {
                  const data =
                    hours[
                      day.value
                    ];

                  if (!data) {
                    return null;
                  }

                  const saving =
                    savingDay ===
                    day.value;

                  return (
                    <article
                      key={
                        day.value
                      }
                      className="rounded-2xl border border-border bg-card p-4"
                    >

                      <div className="grid gap-4 lg:grid-cols-[minmax(220px,1fr)_145px_145px_80px_105px] lg:items-end">

                        <div className="flex min-w-0 items-center gap-3">

                          <div
                            className={[
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold tracking-wide",
                              data.enabled
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground",
                            ].join(
                              " "
                            )}
                          >
                            {day.short}
                          </div>

                          <div className="min-w-0">

                            <div className="flex flex-wrap items-center gap-2">

                              <h2 className="font-bold text-foreground">
                                {day.label}
                              </h2>

                              <span
                                className={[
                                  "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                                  data.enabled
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-border bg-muted text-muted-foreground",
                                ].join(
                                  " "
                                )}
                              >
                                {data.enabled
                                  ? "Aberto"
                                  : "Fechado"}
                              </span>

                            </div>

                            <p className="mt-1 truncate text-xs text-muted-foreground">

                              {data.enabled
                                ? data.openingTime &&
                                  data.closingTime
                                  ? `${data.openingTime.slice(
                                      0,
                                      5
                                    )} — ${data.closingTime.slice(
                                      0,
                                      5
                                    )}`
                                  : "Defina o horário"
                                : "Não recebe pedidos"}

                            </p>

                          </div>

                        </div>

                        <div>

                          <label
                            htmlFor={`open-${day.value}`}
                            className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground"
                          >
                            Abertura
                          </label>

                          <input
                            id={`open-${day.value}`}
                            type={
                              data.enabled
                                ? "time"
                                : "text"
                            }
                            disabled={
                              !data.enabled
                            }
                            value={
                              data.enabled
                                ? data.openingTime
                                  ? data.openingTime.slice(
                                      0,
                                      5
                                    )
                                  : ""
                                : "--:--"
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
                            className="
                              h-10 w-full
                              rounded-xl
                              border border-input
                              bg-background
                              px-3 text-sm
                              text-foreground
                              outline-none
                              transition
                              focus:border-primary
                              focus:ring-2
                              focus:ring-primary/10
                              disabled:cursor-not-allowed
                              disabled:bg-muted
                              disabled:text-muted-foreground
                            "
                          />

                        </div>

                        <div>

                          <label
                            htmlFor={`close-${day.value}`}
                            className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground"
                          >
                            Fechamento
                          </label>

                          <input
                            id={`close-${day.value}`}
                            type={
                              data.enabled
                                ? "time"
                                : "text"
                            }
                            disabled={
                              !data.enabled
                            }
                            value={
                              data.enabled
                                ? data.closingTime
                                  ? data.closingTime.slice(
                                      0,
                                      5
                                    )
                                  : ""
                                : "--:--"
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
                            className="
                              h-10 w-full
                              rounded-xl
                              border border-input
                              bg-background
                              px-3 text-sm
                              text-foreground
                              outline-none
                              transition
                              focus:border-primary
                              focus:ring-2
                              focus:ring-primary/10
                              disabled:cursor-not-allowed
                              disabled:bg-muted
                              disabled:text-muted-foreground
                            "
                          />

                        </div>

                        <div className="flex h-10 items-center justify-center">

                          <button
                            type="button"
                            role="switch"
                            aria-checked={
                              data.enabled
                            }
                            aria-label={`${data.enabled ? "Desativar" : "Ativar"} ${day.label}`}
                            onClick={() =>
                              updateField(
                                day.value,
                                "enabled",
                                !data.enabled
                              )
                            }
                            className={[
                              "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                              data.enabled
                                ? "bg-primary"
                                : "bg-muted-foreground/25",
                            ].join(
                              " "
                            )}
                          >
                            <span
                              className={[
                                "pointer-events-none absolute h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                                data.enabled
                                  ? "translate-x-[26px]"
                                  : "translate-x-[4px]",
                              ].join(
                                " "
                              )}
                            />
                          </button>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            saveDay(
                              day.value
                            )
                          }
                          disabled={
                            saving
                          }
                          className="
                            inline-flex h-10
                            items-center
                            justify-center
                            gap-2 rounded-xl
                            bg-foreground
                            px-4
                            text-sm font-bold
                            text-background
                            transition
                            hover:opacity-90
                            focus-visible:outline-none
                            focus-visible:ring-2
                            focus-visible:ring-ring
                            disabled:pointer-events-none
                            disabled:opacity-50
                          "
                        >

                          {saving && (
                            <Spinner />
                          )}

                          {saving
                            ? "Salvando"
                            : "Salvar"}

                        </button>

                      </div>

                    </article>
                  );
                }
              )}

            </div>
          )}

        </section>

        <aside className="mt-6 flex gap-3 rounded-2xl border border-border bg-card p-4">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <MoonIcon />
          </div>

          <div>

            <p className="text-sm font-bold text-foreground">
              Funcionamento após meia-noite
            </p>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Você pode configurar, por exemplo, sexta-feira das 18:00 às 02:00.
              O sistema interpreta o fechamento como madrugada do dia seguinte.
            </p>

          </div>

        </aside>

      </div>

    </main>
  );
}
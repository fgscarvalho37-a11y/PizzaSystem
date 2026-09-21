"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import AdminHeader from "@/components/AdminHeader";
import { adminFetch } from "@/lib/adminFetch";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080";

type RedemptionStatus =
  | "PENDING"
  | "USED"
  | "CANCELLED";

type Redemption = {
  id: number;

  customerId: number | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;

  storeId: number | null;
  storeName: string | null;

  loyaltyAccountId: number | null;

  pointsUsed: number;

  rewardDescription: string;

  status: RedemptionStatus;

  createdAt: string;

  usedAt: string | null;

  cancelledAt: string | null;
};

type Summary = {
  pending: number;
  used: number;
  cancelled: number;
  total: number;
};

type Filter =
  | "ALL"
  | RedemptionStatus;

type ConfirmationAction =
  | "USE"
  | "CANCEL";

type ConfirmationModal = {
  action: ConfirmationAction;
  redemption: Redemption;
};

const emptySummary: Summary = {
  pending: 0,
  used: 0,
  cancelled: 0,
  total: 0,
};

function formatDateTime(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  ).format(date);
}

function statusLabel(
  status: RedemptionStatus
) {
  const labels:
    Record<
      RedemptionStatus,
      string
    > = {
      PENDING: "Pendente",
      USED: "Utilizada",
      CANCELLED: "Cancelada",
    };

  return labels[status];
}

function statusClasses(
  status: RedemptionStatus
) {
  if (
    status === "PENDING"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (
    status === "USED"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function WarningIcon() {
  return (
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
      <path d="M10.3 3.5 2.7 17a2 2 0 0 0 1.8 3h15a2 2 0 0 0 1.8-3L13.7 3.5a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function CheckIcon() {
  return (
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
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function FidelidadePage() {

  const [
    redemptions,
    setRedemptions,
  ] = useState<Redemption[]>(
    []
  );

  const [
    summary,
    setSummary,
  ] = useState<Summary>(
    emptySummary
  );

  const [
    filter,
    setFilter,
  ] = useState<Filter>(
    "ALL"
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    processingId,
    setProcessingId,
  ] = useState<number | null>(
    null
  );

  const [
    processingAction,
    setProcessingAction,
  ] = useState<
    ConfirmationAction | null
  >(null);

  const [
    confirmationModal,
    setConfirmationModal,
  ] = useState<
    ConfirmationModal | null
  >(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  // =========================
  // CARREGAR RESGATES
  // =========================

  const loadData =
    useCallback(
      async (
        selectedFilter:
          Filter,
        showMainLoader =
          false
      ) => {

        if (showMainLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        try {

          const redemptionsUrl =
            selectedFilter ===
            "ALL"
              ? `${API_URL}/api/admin/loyalty-redemptions`
              : `${API_URL}/api/admin/loyalty-redemptions?status=${selectedFilter}`;

          const [
            redemptionsResponse,
            summaryResponse,
          ] =
            await Promise.all([
              adminFetch(
                redemptionsUrl,
                {
                  method:
                    "GET",

                  credentials:
                    "include",

                  cache:
                    "no-store",
                }
              ),

              adminFetch(
                `${API_URL}/api/admin/loyalty-redemptions/summary`,
                {
                  method:
                    "GET",

                  credentials:
                    "include",

                  cache:
                    "no-store",
                }
              ),
            ]);

          if (
            !redemptionsResponse.ok
          ) {
            throw new Error(
              "Não foi possível carregar os resgates."
            );
          }

          if (
            !summaryResponse.ok
          ) {
            throw new Error(
              "Não foi possível carregar o resumo da fidelidade."
            );
          }

          const redemptionData =
            await redemptionsResponse.json();

          const summaryData =
            await summaryResponse.json();

          setRedemptions(
            Array.isArray(
              redemptionData
            )
              ? redemptionData
              : redemptionData
                ? [
                    redemptionData,
                  ]
                : []
          );

          setSummary({
            pending:
              Number(
                summaryData
                  ?.pending
              ) || 0,

            used:
              Number(
                summaryData
                  ?.used
              ) || 0,

            cancelled:
              Number(
                summaryData
                  ?.cancelled
              ) || 0,

            total:
              Number(
                summaryData
                  ?.total
              ) || 0,
          });

        } catch (error) {

          console.error(
            error
          );

          setError(
            error instanceof
              Error
              ? error.message
              : "Não foi possível carregar a fidelidade."
          );

        } finally {

          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useEffect(() => {

    void loadData(
      filter,
      true
    );

  }, [
    filter,
    loadData,
  ]);

  // =========================
  // ESC FECHA MODAL
  // =========================

  useEffect(() => {

    if (!confirmationModal) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent
    ) {

      if (
        event.key ===
          "Escape" &&
        processingId ===
          null
      ) {
        setConfirmationModal(
          null
        );
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    document.body.style.overflow =
      "hidden";

    return () => {

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        "";
    };

  }, [
    confirmationModal,
    processingId,
  ]);

  // =========================
  // FILTRO
  // =========================

  function changeFilter(
    newFilter: Filter
  ) {

    if (
      newFilter ===
      filter
    ) {
      return;
    }

    setMessage("");
    setError("");

    setFilter(
      newFilter
    );
  }

  // =========================
  // ABRIR CONFIRMAÇÃO
  // =========================

  function openConfirmation(
    action: ConfirmationAction,
    redemption: Redemption
  ) {

    if (
      processingId !==
      null
    ) {
      return;
    }

    setError("");
    setMessage("");

    setConfirmationModal({
      action,
      redemption,
    });
  }

  // =========================
  // FECHAR CONFIRMAÇÃO
  // =========================

  function closeConfirmation() {

    if (
      processingId !==
      null
    ) {
      return;
    }

    setConfirmationModal(
      null
    );
  }

  // =========================
  // MARCAR COMO UTILIZADA
  // =========================

  async function markAsUsed(
    redemption: Redemption
  ) {

    if (
      processingId !==
      null
    ) {
      return;
    }

    setProcessingId(
      redemption.id
    );

    setProcessingAction(
      "USE"
    );

    setError("");
    setMessage("");

    try {

      const response =
        await adminFetch(
          `${API_URL}/api/admin/loyalty-redemptions/${redemption.id}/use`,
          {
            method:
              "PATCH",

            credentials:
              "include",
          }
        );

      const text =
        await response.text();

      let data:
        | {
            success?: boolean;
            message?: string;
          }
        | null = null;

      if (text) {
        try {

          data =
            JSON.parse(
              text
            );

        } catch {
          data = null;
        }
      }

      if (!response.ok) {

        throw new Error(
          data?.message ??
            "Não foi possível marcar a recompensa como utilizada."
        );
      }

      setConfirmationModal(
        null
      );

      setMessage(
        data?.message ??
          "Recompensa marcada como utilizada."
      );

      await loadData(
        filter
      );

    } catch (error) {

      console.error(
        error
      );

      setError(
        error instanceof
          Error
          ? error.message
          : "Não foi possível marcar a recompensa como utilizada."
      );

    } finally {

      setProcessingId(
        null
      );

      setProcessingAction(
        null
      );
    }
  }

  // =========================
  // CANCELAR RESGATE
  // =========================

  async function cancelRedemption(
    redemption: Redemption
  ) {

    if (
      processingId !==
      null
    ) {
      return;
    }

    setProcessingId(
      redemption.id
    );

    setProcessingAction(
      "CANCEL"
    );

    setError("");
    setMessage("");

    try {

      const response =
        await adminFetch(
          `${API_URL}/api/admin/loyalty-redemptions/${redemption.id}/cancel`,
          {
            method:
              "PATCH",

            credentials:
              "include",
          }
        );

      const text =
        await response.text();

      let data:
        | {
            success?: boolean;
            message?: string;
          }
        | null = null;

      if (text) {
        try {

          data =
            JSON.parse(
              text
            );

        } catch {
          data = null;
        }
      }

      if (!response.ok) {

        throw new Error(
          data?.message ??
            "Não foi possível cancelar a recompensa."
        );
      }

      setConfirmationModal(
        null
      );

      setMessage(
        data?.message ??
          "Recompensa cancelada e pontos devolvidos ao cliente."
      );

      await loadData(
        filter
      );

    } catch (error) {

      console.error(
        error
      );

      setError(
        error instanceof
          Error
          ? error.message
          : "Não foi possível cancelar a recompensa."
      );

    } finally {

      setProcessingId(
        null
      );

      setProcessingAction(
        null
      );
    }
  }

  // =========================
  // CONFIRMAR AÇÃO
  // =========================

  async function confirmAction() {

    if (
      !confirmationModal
    ) {
      return;
    }

    if (
      confirmationModal.action ===
      "USE"
    ) {

      await markAsUsed(
        confirmationModal.redemption
      );

      return;
    }

    await cancelRedemption(
      confirmationModal.redemption
    );
  }

  // =========================
  // RENDER
  // =========================

  return (
    <main className="min-h-screen bg-background">

      <AdminHeader />

      <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 lg:px-8">

        {/* =========================
            CABEÇALHO
            ========================= */}

        <section className="rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] sm:p-6">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Programa de fidelidade
              </p>

              <h1 className="mt-1 font-display text-3xl uppercase tracking-tight text-foreground sm:text-4xl">
                Resgates
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Acompanhe as recompensas
                resgatadas pelos clientes,
                confirme quando o benefício
                for utilizado ou cancele um
                resgate pendente.
              </p>

            </div>

            <button
              type="button"
              disabled={
                refreshing
              }
              onClick={() =>
                void loadData(
                  filter
                )
              }
              className="h-10 rounded-xl border border-input bg-card px-4 text-sm font-semibold text-foreground transition hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-50"
            >
              {refreshing
                ? "Atualizando..."
                : "Atualizar"}
            </button>

          </div>

        </section>

        {/* =========================
            RESUMO
            ========================= */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <button
            type="button"
            onClick={() =>
              changeFilter(
                "PENDING"
              )
            }
            className={`rounded-[22px] border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
              filter ===
              "PENDING"
                ? "border-primary bg-primary/5"
                : "border-border bg-card"
            }`}
          >

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600">
              Pendentes
            </p>

            <p className="mt-2 font-display text-4xl text-foreground">
              {summary.pending}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Aguardando utilização
            </p>

          </button>

          <button
            type="button"
            onClick={() =>
              changeFilter(
                "USED"
              )
            }
            className={`rounded-[22px] border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
              filter ===
              "USED"
                ? "border-primary bg-primary/5"
                : "border-border bg-card"
            }`}
          >

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
              Utilizadas
            </p>

            <p className="mt-2 font-display text-4xl text-foreground">
              {summary.used}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Benefícios entregues
            </p>

          </button>

          <button
            type="button"
            onClick={() =>
              changeFilter(
                "CANCELLED"
              )
            }
            className={`rounded-[22px] border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
              filter ===
              "CANCELLED"
                ? "border-primary bg-primary/5"
                : "border-border bg-card"
            }`}
          >

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-600">
              Canceladas
            </p>

            <p className="mt-2 font-display text-4xl text-foreground">
              {summary.cancelled}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Resgates cancelados
            </p>

          </button>

          <button
            type="button"
            onClick={() =>
              changeFilter(
                "ALL"
              )
            }
            className={`rounded-[22px] border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
              filter ===
              "ALL"
                ? "border-primary bg-primary/5"
                : "border-border bg-card"
            }`}
          >

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Total
            </p>

            <p className="mt-2 font-display text-4xl text-foreground">
              {summary.total}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Todos os resgates
            </p>

          </button>

        </section>

        {/* =========================
            MENSAGENS
            ========================= */}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        )}

        {/* =========================
            LISTAGEM
            ========================= */}

        <section className="mt-6 rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] sm:p-6">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Recompensas
              </p>

              <h2 className="mt-1 font-display text-3xl uppercase tracking-tight text-foreground">
                {filter ===
                "PENDING"
                  ? "Pendentes"
                  : filter ===
                    "USED"
                    ? "Utilizadas"
                    : filter ===
                      "CANCELLED"
                      ? "Canceladas"
                      : "Todos os resgates"}
              </h2>

            </div>

            {filter !==
              "ALL" && (
              <button
                type="button"
                onClick={() =>
                  changeFilter(
                    "ALL"
                  )
                }
                className="text-sm font-semibold text-primary transition hover:opacity-75"
              >
                Limpar filtro
              </button>
            )}

          </div>

          {loading ? (

            <div className="mt-6 rounded-2xl border border-dashed border-border bg-background px-6 py-14 text-center text-sm text-muted-foreground">
              Carregando resgates...
            </div>

          ) : redemptions.length ===
            0 ? (

            <div className="mt-6 rounded-2xl border border-dashed border-border bg-background px-6 py-14 text-center">

              <p className="font-semibold text-foreground">
                Nenhum resgate encontrado.
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Não existem recompensas
                neste status no momento.
              </p>

            </div>

          ) : (

            <div className="mt-6 space-y-4">

              {redemptions.map(
                (
                  redemption
                ) => (

                  <article
                    key={
                      redemption.id
                    }
                    className="rounded-[22px] border border-border bg-background p-5 transition hover:-translate-y-0.5 hover:border-foreground/10 hover:shadow-sm"
                  >

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="font-display text-2xl uppercase tracking-tight text-foreground">
                            {redemption.customerName ??
                              "Cliente"}
                          </h3>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClasses(
                              redemption.status
                            )}`}
                          >
                            {statusLabel(
                              redemption.status
                            )}
                          </span>

                        </div>

                        <p className="mt-2 text-lg font-bold text-foreground">
                          {redemption.rewardDescription}
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {redemption.pointsUsed}{" "}
                          {redemption.pointsUsed ===
                          1
                            ? "ponto utilizado"
                            : "pontos utilizados"}
                        </p>

                      </div>

                      {redemption.status ===
                        "PENDING" && (

                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">

                          <button
                            type="button"
                            disabled={
                              processingId !==
                              null
                            }
                            onClick={() =>
                              openConfirmation(
                                "CANCEL",
                                redemption
                              )
                            }
                            className="h-10 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-700 transition hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-sm disabled:pointer-events-none disabled:opacity-50"
                          >
                            Cancelar
                          </button>

                          <button
                            type="button"
                            disabled={
                              processingId !==
                              null
                            }
                            onClick={() =>
                              openConfirmation(
                                "USE",
                                redemption
                              )
                            }
                            className="h-10 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-sm disabled:pointer-events-none disabled:opacity-50"
                          >
                            Marcar como utilizada
                          </button>

                        </div>

                      )}

                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

                      <div className="rounded-xl border border-border bg-card p-4">

                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                          Cliente
                        </p>

                        <p className="mt-1 truncate text-sm font-semibold text-foreground">
                          {redemption.customerEmail ??
                            "—"}
                        </p>

                        {redemption.customerPhone && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {redemption.customerPhone}
                          </p>
                        )}

                      </div>

                      <div className="rounded-xl border border-border bg-card p-4">

                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                          Resgatada em
                        </p>

                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {formatDateTime(
                            redemption.createdAt
                          )}
                        </p>

                      </div>

                      <div className="rounded-xl border border-border bg-card p-4">

                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                          {redemption.status ===
                          "CANCELLED"
                            ? "Cancelada em"
                            : "Utilizada em"}
                        </p>

                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {formatDateTime(
                            redemption.status ===
                            "CANCELLED"
                              ? redemption.cancelledAt
                              : redemption.usedAt
                          )}
                        </p>

                      </div>

                      <div className="rounded-xl border border-border bg-card p-4">

                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                          Resgate
                        </p>

                        <p className="mt-1 text-sm font-semibold text-foreground">
                          #{redemption.id}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Conta #
                          {redemption.loyaltyAccountId ??
                            "—"}
                        </p>

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
          MODAL DE CONFIRMAÇÃO
          ========================= */}

      {confirmationModal && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-[2px]"
          onMouseDown={(
            event
          ) => {

            if (
              event.target ===
                event.currentTarget &&
              processingId ===
                null
            ) {
              closeConfirmation();
            }
          }}
        >

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
            className="w-full max-w-md animate-in fade-in zoom-in-95 duration-150"
          >

            <div className="overflow-hidden rounded-[26px] border border-border bg-card shadow-2xl">

              <div className="relative p-6 sm:p-7">

                <button
                  type="button"
                  aria-label="Fechar"
                  disabled={
                    processingId !==
                    null
                  }
                  onClick={
                    closeConfirmation
                  }
                  className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                >
                  <CloseIcon />
                </button>

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    confirmationModal.action ===
                    "CANCEL"
                      ? "bg-red-50 text-red-600"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {confirmationModal.action ===
                  "CANCEL"
                    ? (
                      <WarningIcon />
                    )
                    : (
                      <CheckIcon />
                    )}
                </div>

                <p
                  className={`mt-5 text-[10px] font-bold uppercase tracking-[0.18em] ${
                    confirmationModal.action ===
                    "CANCEL"
                      ? "text-red-600"
                      : "text-primary"
                  }`}
                >
                  {confirmationModal.action ===
                  "CANCEL"
                    ? "Cancelar resgate"
                    : "Confirmar utilização"}
                </p>

                <h2
                  id="confirmation-title"
                  className="mt-1 pr-10 font-display text-3xl uppercase tracking-tight text-foreground"
                >
                  {confirmationModal.action ===
                  "CANCEL"
                    ? "Cancelar recompensa?"
                    : "Recompensa utilizada?"}
                </h2>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">

                  {confirmationModal.action ===
                  "CANCEL"
                    ? "Confirme o cancelamento deste resgate."
                    : "Confirme que o benefício já foi entregue ao cliente."}

                </p>

                <div className="mt-5 rounded-2xl border border-border bg-background p-4">

                  <p className="text-xs font-semibold text-muted-foreground">
                    Cliente
                  </p>

                  <p className="mt-1 font-bold text-foreground">
                    {confirmationModal
                      .redemption
                      .customerName ??
                      "Cliente"}
                  </p>

                  <div className="my-3 h-px bg-border" />

                  <p className="text-xs font-semibold text-muted-foreground">
                    Recompensa
                  </p>

                  <p className="mt-1 font-bold text-foreground">
                    {confirmationModal
                      .redemption
                      .rewardDescription}
                  </p>

                  <div className="my-3 h-px bg-border" />

                  <div className="flex items-center justify-between gap-4">

                    <p className="text-xs font-semibold text-muted-foreground">
                      Pontos utilizados
                    </p>

                    <p className="font-bold text-foreground">
                      {confirmationModal
                        .redemption
                        .pointsUsed}
                    </p>

                  </div>

                </div>

                {confirmationModal.action ===
                  "CANCEL" && (

                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">

                    <p className="text-sm font-semibold leading-5 text-amber-800">
                      Os{" "}
                      {
                        confirmationModal
                          .redemption
                          .pointsUsed
                      }{" "}
                      pontos utilizados neste
                      resgate serão devolvidos
                      ao saldo do cliente.
                    </p>

                  </div>

                )}

                {confirmationModal.action ===
                  "USE" && (

                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">

                    <p className="text-sm font-semibold leading-5 text-emerald-800">
                      Depois de confirmar, a
                      recompensa ficará registrada
                      como utilizada.
                    </p>

                  </div>

                )}

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    disabled={
                      processingId !==
                      null
                    }
                    onClick={
                      closeConfirmation
                    }
                    className="h-11 rounded-xl border border-input bg-card px-5 text-sm font-bold text-foreground transition hover:bg-muted/50 disabled:pointer-events-none disabled:opacity-50"
                  >
                    Voltar
                  </button>

                  <button
                    type="button"
                    disabled={
                      processingId !==
                      null
                    }
                    onClick={() =>
                      void confirmAction()
                    }
                    className={`h-11 rounded-xl px-5 text-sm font-bold transition hover:-translate-y-0.5 hover:shadow-sm disabled:pointer-events-none disabled:opacity-50 ${
                      confirmationModal.action ===
                      "CANCEL"
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >

                    {processingId !==
                    null &&
                    processingAction ===
                      confirmationModal.action
                      ? confirmationModal.action ===
                        "CANCEL"
                        ? "Cancelando..."
                        : "Confirmando..."
                      : confirmationModal.action ===
                        "CANCEL"
                        ? "Cancelar recompensa"
                        : "Confirmar utilização"}

                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}
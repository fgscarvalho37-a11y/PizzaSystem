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

type StoreSettings = {
  id: number;
  storeName: string;
  open: boolean;
  whatsapp: string | null;
  dailyOrderLimit: number;
};

type StoreStatus = {
  storeName: string;
  manualOpen: boolean;
  open: boolean;
  message: string;
  ordersToday: number;
  dailyOrderLimit: number;
};

export default function ConfiguracoesPage() {
  const [settings, setSettings] =
    useState<StoreSettings | null>(null);

  const [status, setStatus] =
    useState<StoreStatus | null>(null);

  const [storeName, setStoreName] =
    useState("");

  const [whatsapp, setWhatsapp] =
    useState("");

  const [
    dailyOrderLimit,
    setDailyOrderLimit,
  ] = useState(30);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    changingStatus,
    setChangingStatus,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  // =========================
  // CARREGAR DADOS
  // =========================

  async function loadData() {
    try {
      setErrorMessage("");

      const [
        settingsResponse,
        statusResponse,
      ] = await Promise.all([
        adminFetch(
          `${API_URL}/api/store`,
          {
            cache: "no-store",
            credentials: "include",
          }
        ),

        adminFetch(
          `${API_URL}/api/store/status`,
          {
            cache: "no-store",
            credentials: "include",
          }
        ),
      ]);

      if (!settingsResponse.ok) {
        throw new Error(
          "Erro ao carregar configurações"
        );
      }

      if (!statusResponse.ok) {
        throw new Error(
          "Erro ao carregar status"
        );
      }

      const settingsData:
        StoreSettings =
        await settingsResponse.json();

      const statusData:
        StoreStatus =
        await statusResponse.json();

      setSettings(
        settingsData
      );

      setStatus(
        statusData
      );

      setStoreName(
        settingsData.storeName ??
          ""
      );

      setWhatsapp(
        settingsData.whatsapp ??
          ""
      );

      setDailyOrderLimit(
        settingsData.dailyOrderLimit ??
          30
      );

    } catch {
      setErrorMessage(
        "Não foi possível carregar as configurações."
      );

    } finally {
      setLoading(false);
    }
  }

  // =========================
  // ATUALIZAR STATUS
  // =========================

  async function refreshStatus() {
    try {
      const response =
        await adminFetch(
          `${API_URL}/api/store/status`,
          {
            cache: "no-store",
            credentials: "include",
          }
        );

      if (!response.ok) {
        return;
      }

      const data:
        StoreStatus =
        await response.json();

      setStatus(data);

    } catch {
      // atualização automática:
      // mantém o último status
    }
  }

  useEffect(() => {
    loadData();

    const interval =
      setInterval(() => {
        refreshStatus();
      }, 10000);

    return () =>
      clearInterval(
        interval
      );
  }, []);

  // =========================
  // ABRIR / FECHAR
  // =========================

  async function changeStoreStatus() {
    if (!settings) {
      return;
    }

    try {
      setChangingStatus(
        true
      );

      setErrorMessage("");
      setSuccessMessage("");

      const newStatus =
        !settings.open;

      const response =
        await adminFetch(
          `${API_URL}/api/store/open?open=${newStatus}`,
          {
            method:
              "PATCH",
            credentials:
              "include",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Erro ao alterar funcionamento"
        );
      }

      const updatedSettings:
        StoreSettings =
        await response.json();

      setSettings(
        updatedSettings
      );

      await refreshStatus();

      setSuccessMessage(
        newStatus
          ? "Recebimento manual de pedidos ativado."
          : "Recebimento de pedidos fechado manualmente."
      );

    } catch {
      setErrorMessage(
        "Não foi possível alterar o funcionamento."
      );

    } finally {
      setChangingStatus(
        false
      );
    }
  }

  // =========================
  // SALVAR CONFIGURAÇÕES
  // =========================

  async function saveSettings(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!settings) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    if (!storeName.trim()) {
      setErrorMessage(
        "Informe o nome da pizzaria."
      );

      return;
    }

    if (
      dailyOrderLimit < 0
    ) {
      setErrorMessage(
        "O limite diário não pode ser negativo."
      );

      return;
    }

    try {
      setSaving(true);

      const response =
        await adminFetch(
          `${API_URL}/api/store`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials: "include",

            body:
              JSON.stringify({
                id: 1,

                storeName:
                  storeName.trim(),

                whatsapp:
                  whatsapp.trim(),

                open:
                  settings.open,

                dailyOrderLimit,
              }),
          }
        );

      if (!response.ok) {
        throw new Error(
          "Erro ao salvar configurações"
        );
      }

      const updatedSettings:
        StoreSettings =
        await response.json();

      setSettings(
        updatedSettings
      );

      await refreshStatus();

      setSuccessMessage(
        "Configurações salvas com sucesso."
      );

    } catch {
      setErrorMessage(
        "Não foi possível salvar as configurações."
      );

    } finally {
      setSaving(false);
    }
  }

  // =========================
  // CARREGANDO
  // =========================

  if (loading) {
    return (
      <main className="min-h-screen bg-background">

        <AdminHeader />

        <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 lg:px-8">

          <div className="rounded-[24px] border border-border bg-card p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <div className="animate-pulse space-y-4" role="status" aria-label="Carregando configurações">
              <div className="h-3 w-28 rounded bg-muted" />
              <div className="h-8 w-64 rounded bg-muted" />
              <div className="h-4 w-full max-w-xl rounded bg-muted" />
              <div className="grid gap-3 pt-3 sm:grid-cols-3">
                <div className="h-32 rounded-2xl bg-muted" />
                <div className="h-32 rounded-2xl bg-muted" />
                <div className="h-32 rounded-2xl bg-muted" />
              </div>
            </div>
          </div>

        </div>

      </main>
    );
  }

  // =========================
  // ERRO DE CARREGAMENTO
  // =========================

  if (
    !settings ||
    !status
  ) {
    return (
      <main className="min-h-screen bg-background">

        <AdminHeader />

        <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 lg:px-8">

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

            <h2 className="text-lg font-bold text-red-700">
              Não foi possível carregar as configurações
            </h2>

            <p className="mt-2 text-sm text-red-600">
              Verifique se o backend está funcionando e tente novamente.
            </p>

            <button
              type="button"
              onClick={() => {
                setLoading(true);
                loadData();
              }}
              className="mt-4 h-10 rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Tentar novamente
            </button>

          </div>

        </div>

      </main>
    );
  }

  // =========================
  // CÁLCULOS
  // =========================

  const limitEnabled =
    status.dailyOrderLimit >
    0;

  const limitReached =
    limitEnabled &&
    status.ordersToday >=
      status.dailyOrderLimit;

  const percentage =
    limitEnabled
      ? Math.min(
          (
            status.ordersToday /
            status.dailyOrderLimit
          ) * 100,
          100
        )
      : 0;

  const remainingOrders =
    limitEnabled
      ? Math.max(
          status.dailyOrderLimit -
            status.ordersToday,
          0
        )
      : null;

  // =========================
  // TELA
  // =========================

  return (
    <main className="min-h-screen bg-background">

      <AdminHeader />

      <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 lg:px-8">

        {/* TÍTULO */}

        <div className="mb-6 border-b border-border pb-6">

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Administração
          </p>

          <h2 className="mt-2 font-display text-4xl uppercase leading-none tracking-tight text-foreground">
            Configurações da pizzaria
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Controle o funcionamento, limite de pedidos e dados gerais da operação.
          </p>

        </div>

        {/* MENSAGENS */}

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
            STATUS
            ========================= */}

        <div className="grid gap-4 lg:grid-cols-3">

          {/* CONTROLE MANUAL */}

          <section className="rounded-[22px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">

            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Controle manual
            </p>

            <div className="mt-4 flex items-center gap-3">

              <div
                className={`h-3 w-3 rounded-full ${
                  settings.open
                    ? "bg-emerald-500"
                    : "bg-red-500"
                }`}
              />

              <h3
                className={`text-xl font-bold ${
                  settings.open
                    ? "text-emerald-700"
                    : "text-red-600"
                }`}
              >
                {settings.open
                  ? "Aberto pelo admin"
                  : "Fechado pelo admin"}
              </h3>

            </div>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              O controle manual permite bloquear todos os novos pedidos mesmo que a pizzaria esteja dentro do horário de funcionamento.
            </p>

            <button
              type="button"
              role="switch"
              aria-checked={settings.open}
              disabled={changingStatus}
              onClick={changeStoreStatus}
              className="mt-6 flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3 text-left transition hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              <div>
                <p className="text-sm font-bold text-foreground">
                  {changingStatus
                    ? "Atualizando..."
                    : settings.open
                      ? "Recebimento liberado"
                      : "Recebimento bloqueado"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Controle geral de novos pedidos
                </p>
              </div>

              <span
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  settings.open
                    ? "bg-primary"
                    : "bg-muted-foreground/25"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                    settings.open
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </span>
            </button>

          </section>

          {/* STATUS REAL */}

          <section className="rounded-[22px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">

            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Status real
            </p>

            <div className="mt-4 flex items-center gap-3">

              <div
                className={`h-3 w-3 rounded-full ${
                  status.open
                    ? "bg-emerald-500"
                    : "bg-red-500"
                }`}
              />

              <h3
                className={`text-xl font-bold ${
                  status.open
                    ? "text-emerald-700"
                    : "text-red-600"
                }`}
              >
                {status.open
                  ? "Recebendo pedidos"
                  : "Pedidos fechados"}
              </h3>

            </div>

            <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">
              {status.message}
            </p>

            <div className="mt-5 space-y-3 rounded-xl border border-border bg-background p-4">

              <div className="flex items-center justify-between gap-4">

                <span className="text-sm text-muted-foreground">
                  Controle manual
                </span>

                <strong
                  className={
                    status.manualOpen
                      ? "text-emerald-700"
                      : "text-red-700"
                  }
                >
                  {status.manualOpen
                    ? "Aberto"
                    : "Fechado"}
                </strong>

              </div>

              <div className="flex items-center justify-between gap-4">

                <span className="text-sm text-muted-foreground">
                  Novos pedidos
                </span>

                <strong
                  className={
                    status.open
                      ? "text-emerald-700"
                      : "text-red-700"
                  }
                >
                  {status.open
                    ? "Liberados"
                    : "Bloqueados"}
                </strong>

              </div>

            </div>

          </section>

          {/* PEDIDOS DO DIA */}

          <section className="rounded-[22px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">

            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Pedidos aprovados hoje
            </p>

            <h3
              className={`mt-3 text-4xl font-bold ${
                limitReached
                  ? "text-red-600"
                  : "text-foreground"
              }`}
            >
              {status.ordersToday}

              {limitEnabled && (
                <span className="text-xl font-semibold text-muted-foreground">
                  {" "}
                  /{" "}
                  {
                    status.dailyOrderLimit
                  }
                </span>
              )}
            </h3>

            {limitEnabled ? (
              <>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">

                  <div
                    className={`h-full transition-all ${
                      limitReached
                        ? "bg-red-600"
                        : "bg-primary"
                    }`}
                    style={{
                      width:
                        `${percentage}%`,
                    }}
                  />

                </div>

                <p className="mt-3 text-sm text-muted-foreground">

                  {limitReached
                    ? "Limite diário atingido. Novos pedidos estão bloqueados."
                    : `${remainingOrders} ${
                        remainingOrders ===
                        1
                          ? "pedido disponível"
                          : "pedidos disponíveis"
                      } hoje.`}

                </p>
              </>
            ) : (
              <div className="mt-5 rounded-xl bg-emerald-50 p-4">

                <p className="text-sm font-semibold text-emerald-700">
                  Sem limite diário
                </p>

                <p className="mt-1 text-xs text-emerald-700">
                  A quantidade de pedidos não está limitada.
                </p>

              </div>
            )}

          </section>

        </div>

        {/* =========================
            CONFIGURAÇÕES
            ========================= */}

        <form
          onSubmit={
            saveSettings
          }
          className="mt-6 rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
        >

          <div>

            <h3 className="font-display text-2xl uppercase tracking-tight text-foreground">
              Dados da pizzaria
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Informações gerais usadas pelo sistema.
            </p>

          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            {/* NOME */}

            <div>

              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                Nome da pizzaria
              </label>

              <input
                required
                value={
                  storeName
                }
                onChange={(
                  event
                ) =>
                  setStoreName(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="Nome da pizzaria"
              />

            </div>

            {/* WHATSAPP */}

            <div>

              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                WhatsApp
              </label>

              <input
                value={
                  whatsapp
                }
                onChange={(
                  event
                ) =>
                  setWhatsapp(
                    event.target.value
                  )
                }
                className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="(19) 99999-9999"
              />

              <p className="mt-2 text-xs text-muted-foreground">
                Número utilizado para contato da pizzaria.
              </p>

            </div>

            {/* LIMITE */}

            <div>

              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                Limite diário de pedidos
              </label>

              <input
                type="number"
                min="0"
                value={
                  dailyOrderLimit
                }
                onChange={(
                  event
                ) =>
                  setDailyOrderLimit(
                    Number(
                      event.target.value
                    )
                  )
                }
                className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
              />

              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Somente pedidos com pagamento aprovado entram na contagem. Use 0 para deixar sem limite diário.
              </p>

            </div>

          </div>

          <div className="mt-6 border-t border-border pt-6">

            <button
              type="submit"
              disabled={
                saving
              }
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-sm disabled:pointer-events-none disabled:opacity-50"
            >
              {saving
                ? "Salvando..."
                : "Salvar configurações"}
            </button>

          </div>

        </form>

      </div>

    </main>
  );
}
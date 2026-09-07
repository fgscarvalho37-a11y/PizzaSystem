"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import AdminHeader from "@/components/AdminHeader";
import { adminFetch } from "@/lib/adminFetch";

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
          "http://localhost:8080/api/store",
          {
            cache: "no-store",
            credentials: "include",
          }
        ),

        adminFetch(
          "http://localhost:8080/api/store/status",
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
          "http://localhost:8080/api/store/status",
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
          `http://localhost:8080/api/store/open?open=${newStatus}`,
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
          "http://localhost:8080/api/store",
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
      <main className="min-h-screen bg-gray-100">

        <AdminHeader
          title="Configurações"
        />

        <div className="mx-auto max-w-6xl p-6">

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

            <p className="font-semibold text-gray-600">
              Carregando configurações...
            </p>

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
      <main className="min-h-screen bg-gray-100">

        <AdminHeader
          title="Configurações"
        />

        <div className="mx-auto max-w-6xl p-6">

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
              className="mt-4 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white"
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
    <main className="min-h-screen bg-gray-100">

      <AdminHeader
        title="Configurações"
      />

      <div className="mx-auto max-w-6xl p-6">

        {/* TÍTULO */}

        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Administração
          </p>

          <h2 className="mt-1 text-3xl font-bold text-gray-900">
            Configurações da pizzaria
          </h2>

          <p className="mt-2 max-w-3xl text-gray-600">
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
            STATUS
            ========================= */}

        <div className="grid gap-6 lg:grid-cols-3">

          {/* CONTROLE MANUAL */}

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Controle manual
            </p>

            <div className="mt-4 flex items-center gap-3">

              <div
                className={`h-3 w-3 rounded-full ${
                  settings.open
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />

              <h3
                className={`text-xl font-bold ${
                  settings.open
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {settings.open
                  ? "Aberto pelo admin"
                  : "Fechado pelo admin"}
              </h3>

            </div>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              O controle manual permite bloquear todos os novos pedidos mesmo que a pizzaria esteja dentro do horário de funcionamento.
            </p>

            <button
              type="button"
              disabled={
                changingStatus
              }
              onClick={
                changeStoreStatus
              }
              className={`mt-6 w-full rounded-xl px-4 py-3 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                settings.open
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {changingStatus
                ? "Alterando..."
                : settings.open
                  ? "Fechar pedidos"
                  : "Abrir pedidos"}
            </button>

          </section>

          {/* STATUS REAL */}

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Status real
            </p>

            <div className="mt-4 flex items-center gap-3">

              <div
                className={`h-3 w-3 rounded-full ${
                  status.open
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />

              <h3
                className={`text-xl font-bold ${
                  status.open
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {status.open
                  ? "Recebendo pedidos"
                  : "Pedidos fechados"}
              </h3>

            </div>

            <p className="mt-3 min-h-12 text-sm leading-6 text-gray-600">
              {status.message}
            </p>

            <div className="mt-5 space-y-3 rounded-xl bg-gray-50 p-4">

              <div className="flex items-center justify-between gap-4">

                <span className="text-sm text-gray-500">
                  Controle manual
                </span>

                <strong
                  className={
                    status.manualOpen
                      ? "text-green-700"
                      : "text-red-700"
                  }
                >
                  {status.manualOpen
                    ? "Aberto"
                    : "Fechado"}
                </strong>

              </div>

              <div className="flex items-center justify-between gap-4">

                <span className="text-sm text-gray-500">
                  Novos pedidos
                </span>

                <strong
                  className={
                    status.open
                      ? "text-green-700"
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

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Pedidos aprovados hoje
            </p>

            <h3
              className={`mt-3 text-4xl font-bold ${
                limitReached
                  ? "text-red-600"
                  : "text-gray-900"
              }`}
            >
              {status.ordersToday}

              {limitEnabled && (
                <span className="text-xl font-semibold text-gray-400">
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
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-200">

                  <div
                    className={`h-full transition-all ${
                      limitReached
                        ? "bg-red-600"
                        : "bg-green-600"
                    }`}
                    style={{
                      width:
                        `${percentage}%`,
                    }}
                  />

                </div>

                <p className="mt-3 text-sm text-gray-600">

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
              <div className="mt-5 rounded-xl bg-green-50 p-4">

                <p className="text-sm font-semibold text-green-700">
                  Sem limite diário
                </p>

                <p className="mt-1 text-xs text-green-600">
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
          className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >

          <div>

            <h3 className="text-xl font-bold text-gray-900">
              Dados da pizzaria
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Informações gerais usadas pelo sistema.
            </p>

          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            {/* NOME */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
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
                className="h-12 w-full rounded-xl border border-gray-300 px-4 outline-none transition focus:border-black"
                placeholder="Nome da pizzaria"
              />

            </div>

            {/* WHATSAPP */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
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
                className="h-12 w-full rounded-xl border border-gray-300 px-4 outline-none transition focus:border-black"
                placeholder="(19) 99999-9999"
              />

              <p className="mt-2 text-xs text-gray-500">
                Número utilizado para contato da pizzaria.
              </p>

            </div>

            {/* LIMITE */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
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
                className="h-12 w-full rounded-xl border border-gray-300 px-4 outline-none transition focus:border-black"
              />

              <p className="mt-2 text-xs leading-5 text-gray-500">
                Somente pedidos com pagamento aprovado entram na contagem. Use 0 para deixar sem limite diário.
              </p>

            </div>

          </div>

          <div className="mt-6 border-t border-gray-100 pt-6">

            <button
              type="submit"
              disabled={
                saving
              }
              className="rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
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
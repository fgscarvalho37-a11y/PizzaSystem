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

type DeliveryArea = { id: number; city: string; neighborhood: string; fee: number; pricingMode: string; active: boolean };

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

type DeliveryConfig = {
  pricingMode: "FIXED" | "PER_KM";
  originAddress: string | null;
  maxDistanceKm: number | null;
  feePerKm: number | null;
  freeDeliveryAbove: number | null;
  freeDeliveryDistanceKm: number | null;
  mapsConfigured: boolean;
  routeProvider: string;
};

async function readMessage(
  response: Response
) {
  const text =
    await response.text();

  if (!text) {
    return "";
  }

  try {
    const data =
      JSON.parse(
        text
      );

    return (
      data?.message ??
      data?.detail ??
      data?.error ??
      text
    );
  } catch {
    return text;
  }
}

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5
    ? `${digits.slice(0, 5)}-${digits.slice(5)}`
    : digits;
}

function money(
  value: number
) {
  return Number(
    value || 0
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

export default function AdminEntregasPage() {
  const [
    config,
    setConfig,
  ] =
    useState<DeliveryConfig | null>(
      null
    );

  const [pricingMode, setPricingMode] = useState<"FIXED" | "PER_KM">("PER_KM");
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [areaCity, setAreaCity] = useState("");
  const [areaNeighborhood, setAreaNeighborhood] = useState("");
  const [areaFee, setAreaFee] = useState("");
  const [areaSaving, setAreaSaving] = useState(false);

  const [
    originAddress,
    setOriginAddress,
  ] =
    useState("");

  const [
    originCep,
    setOriginCep,
  ] = useState("");

  const [
    originNumber,
    setOriginNumber,
  ] = useState("");

  const [
    originCepLoading,
    setOriginCepLoading,
  ] = useState(false);

  const [
    originCepError,
    setOriginCepError,
  ] = useState("");

  const [
    originCepData,
    setOriginCepData,
  ] = useState<ViaCepResponse | null>(null);

  const [
    feePerKm,
    setFeePerKm,
  ] =
    useState("");

  const [
    freeDeliveryAbove,
    setFreeDeliveryAbove,
  ] =
    useState("");

  const [
    freeDeliveryDistanceKm,
    setFreeDeliveryDistanceKm,
  ] =
    useState("");

  const [
    maxDistanceKm,
    setMaxDistanceKm,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

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

  async function loadConfig() {
    try {
      setLoading(
        true
      );

      setErrorMessage(
        ""
      );

      const response =
        await adminFetch(
          `${API_URL}/api/delivery-areas/config`,
          {
            cache:
              "no-store",
          }
        );

      if (!response.ok) {
        throw new Error(
          (
            await readMessage(
              response
            )
          ) ||
            "Não foi possível carregar a configuração de entrega."
        );
      }

      const data:
        DeliveryConfig =
        await response.json();

      setConfig(data);
      setPricingMode(data.pricingMode ?? "PER_KM");
      const areaResponse = await adminFetch(`${API_URL}/api/delivery-areas`, { cache: "no-store" });
      if (areaResponse.ok) setAreas(await areaResponse.json());

      setOriginAddress(
        data.originAddress ??
          ""
      );

      setFeePerKm(
        data.feePerKm !=
          null
          ? String(
              Number(
                data.feePerKm
              )
            )
          : ""
      );

      setFreeDeliveryAbove(
        data.freeDeliveryAbove !=
          null
          ? String(
              Number(
                data.freeDeliveryAbove
              )
            )
          : ""
      );

      setFreeDeliveryDistanceKm(
        data.freeDeliveryDistanceKm !=
          null
          ? String(
              Number(
                data.freeDeliveryDistanceKm
              )
            )
          : ""
      );

      setMaxDistanceKm(
        data.maxDistanceKm !=
          null
          ? String(
              Number(
                data.maxDistanceKm
              )
            )
          : ""
      );

    } catch (
      error
    ) {
      setErrorMessage(
        error instanceof
          Error
          ? error.message
          : "Não foi possível carregar as entregas."
      );

    } finally {
      setLoading(
        false
      );
    }
  }

  useEffect(() => {
    void loadConfig();
  }, []);


  useEffect(() => {
    const digits =
      originCep.replace(/\D/g, "");

    if (digits.length !== 8) {
      setOriginCepLoading(false);
      setOriginCepData(null);
      if (!digits) {
        setOriginCepError("");
      }
      return;
    }

    const controller =
      new AbortController();

    const timer =
      window.setTimeout(
        async () => {
          try {
            setOriginCepLoading(true);
            setOriginCepError("");

            const response =
              await fetch(
                `https://viacep.com.br/ws/${digits}/json/`,
                {
                  signal:
                    controller.signal,
                }
              );

            if (!response.ok) {
              throw new Error(
                "Não foi possível consultar o CEP."
              );
            }

            const data:
              ViaCepResponse =
              await response.json();

            if (data.erro) {
              throw new Error(
                "CEP não encontrado."
              );
            }

            setOriginCepData(data);
          } catch (
            error
          ) {
            if (
              error instanceof DOMException &&
              error.name === "AbortError"
            ) {
              return;
            }

            setOriginCepData(null);
            setOriginCepError(
              error instanceof Error
                ? error.message
                : "Não foi possível consultar o CEP."
            );
          } finally {
            if (!controller.signal.aborted) {
              setOriginCepLoading(false);
            }
          }
        },
        250
      );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [originCep]);

  useEffect(() => {
    if (!originCepData) {
      return;
    }

    const street =
      originCepData.logradouro?.trim() ??
      "";
    const neighborhood =
      originCepData.bairro?.trim() ??
      "";
    const city =
      originCepData.localidade?.trim() ??
      "";
    const state =
      originCepData.uf?.trim().toUpperCase() ??
      "";
    const cep =
      originCep.replace(/\D/g, "");

    if (!street || !city || !state) {
      return;
    }

    setOriginAddress(
      [
        street,
        originNumber.trim() || "s/n",
        neighborhood,
        `${city} - ${state}`,
        cep,
        "Brasil",
      ]
        .filter(Boolean)
        .join(", ")
    );
  }, [originCepData, originNumber, originCep]);

  const googleMapsOriginUrl =
    useMemo(
      () =>
        originAddress.trim()
          ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(
              originAddress.trim()
            )}`
          : "",
      [
        originAddress,
      ]
    );

  async function saveConfig(
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

    const normalizedOrigin =
      originAddress.trim();

    const normalizedFeePerKm =
      Number(
        feePerKm
      );

    const normalizedMaxDistance =
      maxDistanceKm.trim()
        ? Number(
            maxDistanceKm
          )
        : null;

    const normalizedFreeAbove =
      freeDeliveryAbove.trim()
        ? Number(
            freeDeliveryAbove
          )
        : null;

    const normalizedFreeDistance =
      freeDeliveryDistanceKm.trim()
        ? Number(
            freeDeliveryDistanceKm
          )
        : null;

    if (pricingMode === "PER_KM" && originCep.replace(/\D/g, "").length === 8 && !originNumber.trim()) {
      setErrorMessage(
        "Informe o número da pizzaria para completar o endereço pelo CEP."
      );

      return;
    }

    if (pricingMode === "PER_KM" && (!normalizedOrigin || normalizedOrigin.split(",").length < 3)) {
      setErrorMessage(
        "Informe o endereço completo de saída da pizzaria."
      );

      return;
    }

    if (
      pricingMode === "PER_KM" && (feePerKm.trim() === "" ||
      Number.isNaN(normalizedFeePerKm) || normalizedFeePerKm < 0)
    ) {
      setErrorMessage(
        "Informe um valor por km válido."
      );

      return;
    }

    if (
      normalizedMaxDistance !=
        null &&
      (
        Number.isNaN(
          normalizedMaxDistance
        ) ||
        normalizedMaxDistance <=
          0
      )
    ) {
      setErrorMessage(
        "A distância máxima precisa ser maior que zero."
      );

      return;
    }

    if (
      normalizedFreeAbove !=
        null &&
      (
        Number.isNaN(
          normalizedFreeAbove
        ) ||
        normalizedFreeAbove <=
          0
      )
    ) {
      setErrorMessage(
        "O valor para frete grátis precisa ser maior que zero."
      );

      return;
    }

    if (
      normalizedFreeDistance !=
        null &&
      (
        Number.isNaN(
          normalizedFreeDistance
        ) ||
        normalizedFreeDistance <=
          0
      )
    ) {
      setErrorMessage(
        "A distância de frete grátis precisa ser maior que zero."
      );

      return;
    }

    if (
      normalizedFreeDistance !=
        null &&
      normalizedMaxDistance !=
        null &&
      normalizedFreeDistance >
        normalizedMaxDistance
    ) {
      setErrorMessage(
        "A distância de frete grátis não pode ser maior que a distância máxima."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      const response =
        await adminFetch(
          `${API_URL}/api/delivery-areas/config`,
          {
            method:
              "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                pricingMode,
                originAddress:
                  normalizedOrigin || null,
                maxDistanceKm:
                  normalizedMaxDistance,
                feePerKm:
                  feePerKm.trim() ? normalizedFeePerKm : null,
                freeDeliveryAbove:
                  normalizedFreeAbove,
                freeDeliveryDistanceKm:
                  normalizedFreeDistance,
              }),
          }
        );

      if (!response.ok) {
        throw new Error(
          (
            await readMessage(
              response
            )
          ) ||
            "Não foi possível salvar a configuração."
        );
      }

      const data:
        DeliveryConfig =
        await response.json();

      setConfig(data);

      setSuccessMessage(
        "Configuração de entrega salva."
      );

    } catch (
      error
    ) {
      setErrorMessage(
        error instanceof
          Error
          ? error.message
          : "Não foi possível salvar a configuração."
      );

    } finally {
      setSaving(
        false
      );
    }
  }

  async function saveArea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!areaCity.trim() || !areaNeighborhood.trim() || areaFee.trim() === "" || !Number.isFinite(Number(areaFee)) || Number(areaFee) < 0) {
      setErrorMessage("Informe cidade, bairro e uma taxa válida.");
      return;
    }
    try {
      setAreaSaving(true);
      setErrorMessage("");
      const existing = areas.find(area => area.city.toLocaleLowerCase() === areaCity.trim().toLocaleLowerCase() && area.neighborhood.toLocaleLowerCase() === areaNeighborhood.trim().toLocaleLowerCase());
      const response = await adminFetch(`${API_URL}/api/delivery-areas${existing ? `/${existing.id}` : ""}`, {
        method: existing ? "PUT" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: areaCity.trim(), neighborhood: areaNeighborhood.trim(), fee: Number(areaFee), pricingMode: "FIXED", active: true }),
      });
      if (!response.ok) throw new Error((await readMessage(response)) || "Não foi possível cadastrar a taxa.");
      const saved: DeliveryArea = await response.json();
      setAreas(existing ? areas.map(area => area.id === saved.id ? saved : area) : [...areas, saved]);
      setAreaNeighborhood(""); setAreaFee("");
      setSuccessMessage("Taxa fixa cadastrada.");
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : "Erro ao cadastrar taxa."); }
    finally { setAreaSaving(false); }
  }

  async function removeArea(id: number) {
    try {
      const response = await adminFetch(`${API_URL}/api/delivery-areas/${id}/active?active=false`, { method: "PATCH" });
      if (!response.ok) throw new Error((await readMessage(response)) || "Não foi possível desativar a taxa.");
      setAreas(areas.map(area => area.id === id ? { ...area, active: false } : area));
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : "Erro ao desativar taxa."); }
  }

  const fieldClass =
    "h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";

  return (
    <main className="min-h-screen bg-background">

      <AdminHeader />

      <div className="mx-auto max-w-[1100px] px-4 py-7 sm:px-6 lg:px-8">

        <section className="border-b border-border pb-6">

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Entrega
          </p>

          <h1 className="mt-2 font-display text-4xl uppercase leading-none tracking-tight text-foreground">
            Taxas de entrega
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Escolha como a pizzaria cobra a entrega. O modo por km usa a rota; o modo fixo usa a taxa cadastrada para cada bairro.
          </p>

        </section>

        {errorMessage && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        {loading ? (
          <div className="mt-6 space-y-4">
            <div className="h-40 animate-pulse rounded-3xl bg-muted" />
            <div className="h-64 animate-pulse rounded-3xl bg-muted" />
          </div>

        ) : (
          <>

            {pricingMode === "PER_KM" && <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Provedor de rota
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-foreground">
                    OpenRouteService + OpenStreetMap
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    A distância e a taxa são calculadas pelo OpenRouteService. O OpenStreetMap é um atalho para conferir o endereço informado.
                  </p>
                </div>

                <span
                  className={[
                    "w-fit rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]",
                    config?.mapsConfigured
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700",
                  ].join(
                    " "
                  )}
                >
                  {config?.mapsConfigured
                    ? "Chave configurada"
                    : "Falta chave de rotas"}
                </span>

              </div>

              {!config?.mapsConfigured && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                  Para ativar o cálculo automático no servidor, adicione a variável <strong>OPENROUTESERVICE_API_KEY</strong> no backend do PizzaSystem.
                </div>
              )}

            </section>}

            <form
              onSubmit={
                saveConfig
              }
              className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"
            >

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  Configuração
                </p>

                <h2 className="mt-1 text-xl font-bold text-foreground">
                  Regras de entrega
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  A rota é recalculada no servidor quando o pedido é criado, então o cliente não consegue alterar a taxa manualmente.
                </p>
              </div>

              <fieldset className="mt-6 flex flex-wrap gap-4" aria-label="Modo de cobrança da entrega">
                <label><input type="radio" name="pricingMode" checked={pricingMode === "PER_KM"} onChange={() => setPricingMode("PER_KM")} /> Por distância (km)</label>
                <label><input type="radio" name="pricingMode" checked={pricingMode === "FIXED"} onChange={() => setPricingMode("FIXED")} /> Taxa fixa por bairro</label>
              </fieldset>

              {pricingMode === "PER_KM" && <><div className="mt-6">

                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                  Endereço de saída da pizzaria
                </label>

                <div className="grid gap-3 md:grid-cols-[180px_140px_1fr]">
                  <input
                    inputMode="numeric"
                    maxLength={9}
                    value={originCep}
                    onChange={(event) => {
                      setOriginCep(formatCep(event.target.value));
                      setOriginCepError("");
                    }}
                    placeholder="CEP"
                    className={fieldClass}
                  />

                  <input
                    value={originNumber}
                    onChange={(event) => setOriginNumber(event.target.value)}
                    placeholder="Número"
                    className={fieldClass}
                  />

                  <input
                    value={
                      originAddress
                    }
                    onChange={(
                      event
                    ) =>
                      setOriginAddress(
                        event.target.value
                      )
                    }
                    placeholder="Endereço completo da pizzaria"
                    className={
                      fieldClass
                    }
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3">

                  <p className="text-xs leading-5 text-muted-foreground">
                    Digite o CEP e o número. Rua, bairro, cidade e UF são preenchidos automaticamente. O endereço completo continua editável.
                  </p>

                  {originCepLoading && (
                    <span className="text-xs text-muted-foreground">
                      Buscando CEP...
                    </span>
                  )}

                  {originCepError && (
                    <span className="text-xs font-semibold text-primary">
                      {originCepError}
                    </span>
                  )}

                  {googleMapsOriginUrl && (
                    <a
                      href={
                        googleMapsOriginUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-primary underline underline-offset-2"
                    >
                      Conferir no OpenStreetMap
                    </a>
                  )}

                </div>

              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

                <div>

                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                    Valor por km
                  </label>

                  <div className="relative">

                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                      R$
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        feePerKm
                      }
                      onChange={(
                        event
                      ) =>
                        setFeePerKm(
                          event.target.value
                        )
                      }
                      placeholder="Ex: 2,50"
                      className={
                        `${fieldClass} pl-10 pr-14`
                      }
                    />

                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      / km
                    </span>

                  </div>

                </div>

                <div>

                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                    Distância máxima
                  </label>

                  <div className="relative">

                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={
                        maxDistanceKm
                      }
                      onChange={(
                        event
                      ) =>
                        setMaxDistanceKm(
                          event.target.value
                        )
                      }
                      placeholder="Ex: 15"
                      className={
                        `${fieldClass} pr-12`
                      }
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      km
                    </span>

                  </div>

                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Em branco = sem limite configurado.
                  </p>

                </div>

                <div>

                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                    Frete grátis até
                  </label>

                  <div className="relative">

                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={
                        freeDeliveryDistanceKm
                      }
                      onChange={(
                        event
                      ) =>
                        setFreeDeliveryDistanceKm(
                          event.target.value
                        )
                      }
                      placeholder="Ex: 4"
                      className={
                        `${fieldClass} pr-12`
                      }
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      km
                    </span>

                  </div>

                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Em branco = cobra normalmente desde o primeiro km.
                  </p>

                </div>

                <div>

                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                    Frete grátis acima de
                  </label>

                  <div className="relative">

                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                      R$
                    </span>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={
                        freeDeliveryAbove
                      }
                      onChange={(
                        event
                      ) =>
                        setFreeDeliveryAbove(
                          event.target.value
                        )
                      }
                      placeholder="Ex: 120"
                      className={
                        `${fieldClass} pl-10`
                      }
                    />

                  </div>

                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Em branco = sem isenção automática.
                  </p>

                </div>

              </div>

              <div className="mt-6 rounded-2xl border border-border bg-background p-4">

                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Exemplo da regra
                </p>

                <p className="mt-2 text-sm leading-6 text-foreground">
                  {feePerKm.trim()
                    ? `Uma entrega de 5 km custaria ${money(
                        Math.max(
                          0,
                          5 -
                            Number(
                              freeDeliveryDistanceKm ||
                                0
                            )
                        ) *
                          Number(
                            feePerKm ||
                              0
                          )
                      )}.`
                    : "Defina o valor por km para visualizar um exemplo."}

                  {freeDeliveryDistanceKm.trim()
                    ? ` Entregas de até ${Number(
                        freeDeliveryDistanceKm || 0
                      )} km ficam grátis.`
                    : ""}

                  {freeDeliveryAbove.trim()
                    ? ` Pedidos a partir de ${money(
                        Number(
                          freeDeliveryAbove || 0
                        )
                      )} também recebem frete grátis.`
                    : ""}
                </p>

              </div>

              </>}

              <button
                type="submit"
                disabled={
                  saving
                }
                className="mt-6 h-11 rounded-xl bg-foreground px-5 text-sm font-bold text-background transition hover:opacity-90 disabled:opacity-50"
              >
                {saving
                  ? "Salvando..."
                  : "Salvar configuração"}
              </button>

            </form>

            {pricingMode === "FIXED" && (
              <section className="mt-6 rounded-3xl border border-border bg-card p-5 sm:p-6">
                <h2 className="text-xl font-bold">Taxas por bairro</h2>
                <p className="mt-2 text-sm text-muted-foreground">Cadastre cidade, bairro e valor. Salve também o modo de cobrança acima.</p>
                <form onSubmit={saveArea} className="mt-4 grid gap-3 sm:grid-cols-4">
                  <input className={fieldClass} placeholder="Cidade" value={areaCity} onChange={e => setAreaCity(e.target.value)} required />
                  <input className={fieldClass} placeholder="Bairro" value={areaNeighborhood} onChange={e => setAreaNeighborhood(e.target.value)} required />
                  <input className={fieldClass} type="number" min="0" step="0.01" placeholder="Taxa em R$" value={areaFee} onChange={e => setAreaFee(e.target.value)} required />
                  <button disabled={areaSaving} className="rounded-xl bg-foreground px-4 text-sm font-bold text-background disabled:opacity-50">Adicionar taxa</button>
                </form>
                <ul className="mt-5 divide-y divide-border">
                  {areas.filter(area => area.active && area.pricingMode === "FIXED").map(area => (
                    <li key={area.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <span>{area.neighborhood}, {area.city} — {money(area.fee)}</span>
                      <button type="button" onClick={() => void removeArea(area.id)} className="font-bold text-primary">Desativar</button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

          </>
        )}

      </div>

    </main>
  );
}

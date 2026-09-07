"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminHeader from "@/components/AdminHeader";
import { adminFetch } from "@/lib/adminFetch";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080";

type CouponDiscountType =
  | "PERCENTAGE"
  | "FIXED_AMOUNT";

type Coupon = {
  id: number;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minimumOrderValue: number | null;
  maximumDiscountValue: number | null;
  active: boolean;
  validFrom: string | null;
  validUntil: string | null;
  usageLimit: number | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
};

type CouponForm = {
  code: string;
  discountType: CouponDiscountType;
  discountValue: string;
  minimumOrderValue: string;
  maximumDiscountValue: string;
  active: boolean;
  validFrom: string;
  validUntil: string;
  usageLimit: string;
};

const emptyForm: CouponForm = {
  code: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minimumOrderValue: "",
  maximumDiscountValue: "",
  active: true,
  validFrom: "",
  validUntil: "",
  usageLimit: "",
};

function money(value: number | null) {
  if (
    value === null ||
    value === undefined
  ) {
    return "-";
  }

  return `R$ ${Number(value)
    .toFixed(2)
    .replace(".", ",")}`;
}

function formatDateTime(
  value: string | null
) {
  if (!value) {
    return "-";
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

  return date.toLocaleString(
    "pt-BR"
  );
}

function toInputDateTime(
  value: string | null
) {
  if (!value) {
    return "";
  }

  return value.slice(
    0,
    16
  );
}

export default function CouponsAdminPage() {
  const [coupons, setCoupons] =
    useState<Coupon[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [editingId, setEditingId] =
    useState<number | null>(
      null
    );

  const [form, setForm] =
    useState<CouponForm>(
      emptyForm
    );

  async function loadCoupons() {
    try {
      setLoading(true);
      setError("");

      const response =
  await adminFetch(
    `${API_URL}/api/coupons`,
    {
      credentials: "include",
    }
  );

      if (!response.ok) {
        throw new Error(
          "Não foi possível carregar os cupons."
        );
      }

      const data: Coupon[] =
        await response.json();

      setCoupons(
        data
      );
    } catch (error) {
      console.error(error);

      setError(
        "Não foi possível carregar os cupons."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  function resetForm() {
    setForm(
      emptyForm
    );

    setEditingId(
      null
    );

    setError("");

    setMessage("");
  }

  function startEdit(
    coupon: Coupon
  ) {
    setEditingId(
      coupon.id
    );

    setForm({
      code:
        coupon.code,

      discountType:
        coupon.discountType,

      discountValue:
        String(
          coupon.discountValue
        ),

      minimumOrderValue:
        coupon.minimumOrderValue !==
        null
          ? String(
              coupon.minimumOrderValue
            )
          : "",

      maximumDiscountValue:
        coupon.maximumDiscountValue !==
        null
          ? String(
              coupon.maximumDiscountValue
            )
          : "",

      active:
        coupon.active,

      validFrom:
        toInputDateTime(
          coupon.validFrom
        ),

      validUntil:
        toInputDateTime(
          coupon.validUntil
        ),

      usageLimit:
        coupon.usageLimit !==
        null
          ? String(
              coupon.usageLimit
            )
          : "",
    });

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (
      !form.code.trim()
    ) {
      setError(
        "Informe o código do cupom."
      );

      return;
    }

    const discountValue =
      Number(
        form.discountValue
      );

    if (
      Number.isNaN(
        discountValue
      ) ||
      discountValue <= 0
    ) {
      setError(
        "Informe um valor de desconto válido."
      );

      return;
    }

    if (
      form.discountType ===
        "PERCENTAGE" &&
      discountValue > 100
    ) {
      setError(
        "O desconto percentual não pode ser maior que 100%."
      );

      return;
    }

    try {
      setSaving(true);

      const payload = {
        code:
          form.code
            .trim()
            .toUpperCase(),

        discountType:
          form.discountType,

        discountValue:
          discountValue,

        minimumOrderValue:
          form.minimumOrderValue
            ? Number(
                form.minimumOrderValue
              )
            : null,

        maximumDiscountValue:
          form.maximumDiscountValue
            ? Number(
                form.maximumDiscountValue
              )
            : null,

        active:
          form.active,

        validFrom:
          form.validFrom
            ? form.validFrom
            : null,

        validUntil:
          form.validUntil
            ? form.validUntil
            : null,

        usageLimit:
          form.usageLimit
            ? Number(
                form.usageLimit
              )
            : null,
      };

      const url =
        editingId === null
          ? `${API_URL}/api/coupons`
          : `${API_URL}/api/coupons/${editingId}`;

      const method =
        editingId === null
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

      credentials: "include",

      body:
        JSON.stringify(
          payload
        ),
    }
  );

      if (!response.ok) {
        const text =
          await response.text();

        let message =
          "Não foi possível salvar o cupom.";

        try {
          const data =
            JSON.parse(text);

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

      if (
        editingId === null
      ) {
        setMessage(
          "Cupom criado com sucesso."
        );
      } else {
        setMessage(
          "Cupom atualizado com sucesso."
        );
      }

      setForm(
        emptyForm
      );

      setEditingId(
        null
      );

      await loadCoupons();
    } catch (error) {
      console.error(error);

      if (
        error instanceof Error
      ) {
        setError(
          error.message
        );
      } else {
        setError(
          "Não foi possível salvar o cupom."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(
    coupon: Coupon
  ) {
    try {
      setError("");
      setMessage("");

      const response =
  await adminFetch(
    `${API_URL}/api/coupons/${coupon.id}/active?active=${!coupon.active}`,
    {
      method: "PATCH",
      credentials: "include",
    }
  );

      if (!response.ok) {
        throw new Error(
          "Não foi possível alterar o status do cupom."
        );
      }

      setMessage(
        coupon.active
          ? `Cupom ${coupon.code} desativado.`
          : `Cupom ${coupon.code} ativado.`
      );

      await loadCoupons();
    } catch (error) {
      console.error(error);

      setError(
        "Não foi possível alterar o status do cupom."
      );
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <AdminHeader />

      <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">

          {/* =========================
              FORMULÁRIO
              ========================= */}

          <section className="h-fit rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Promoções
              </p>

              <h2 className="mt-1 font-display text-3xl uppercase tracking-tight text-foreground">
                {editingId ===
                null
                  ? "Novo cupom"
                  : "Editar cupom"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Configure desconto,
                valor mínimo,
                validade e limite
                de utilizações.
              </p>
            </div>

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
                {message}
              </div>
            )}

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-6 space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                  Código
                </label>

                <input
                  required
                  value={
                    form.code
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        code:
                          event.target.value.toUpperCase(),
                      })
                    )
                  }
                  placeholder="Ex: PIZZA10"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3.5 uppercase text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                  Tipo de desconto
                </label>

                <select
                  value={
                    form.discountType
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        discountType:
                          event.target.value as CouponDiscountType,
                      })
                    )
                  }
                  className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                >
                  <option value="PERCENTAGE">
                    Percentual (%)
                  </option>

                  <option value="FIXED_AMOUNT">
                    Valor fixo (R$)
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                  {form.discountType ===
                  "PERCENTAGE"
                    ? "Percentual de desconto"
                    : "Valor do desconto"}
                </label>

                <input
                  required
                  type="number"
                  min="0.01"
                  max={
                    form.discountType ===
                    "PERCENTAGE"
                      ? "100"
                      : undefined
                  }
                  step="0.01"
                  value={
                    form.discountValue
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        discountValue:
                          event.target.value,
                      })
                    )
                  }
                  placeholder={
                    form.discountType ===
                    "PERCENTAGE"
                      ? "10"
                      : "15.00"
                  }
                  className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                  Valor mínimo do pedido
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.minimumOrderValue
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        minimumOrderValue:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Ex: 40.00"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
                />

                <p className="mt-1 text-xs text-muted-foreground">
                  Opcional.
                </p>
              </div>

              {form.discountType ===
                "PERCENTAGE" && (
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                    Desconto máximo
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={
                      form.maximumDiscountValue
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,

                          maximumDiscountValue:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="Ex: 20.00"
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />

                  <p className="mt-1 text-xs text-muted-foreground">
                    Opcional. Limita
                    o desconto de um
                    cupom percentual.
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                  Limite de usos
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={
                    form.usageLimit
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        usageLimit:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Ex: 100"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
                />

                <p className="mt-1 text-xs text-muted-foreground">
                  Deixe vazio para
                  usos ilimitados.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                    Início da validade
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      form.validFrom
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,

                          validFrom:
                            event.target.value,
                        })
                      )
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                    Fim da validade
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      form.validUntil
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,

                          validUntil:
                            event.target.value,
                        })
                      )
                    }
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border bg-background p-4">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Cupom ativo
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Quando desativado, não poderá ser aplicado no checkout.
                  </p>
                </div>

                <div className="relative inline-flex h-7 w-12 shrink-0 items-center">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        active: event.target.checked,
                      }))
                    }
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
                    ? "Criar cupom"
                    : "Salvar alterações"}
              </button>

              {editingId !==
                null && (
                <button
                  type="button"
                  onClick={
                    resetForm
                  }
                  className="w-full rounded-xl border border-input bg-card px-5 py-3 font-semibold text-foreground transition hover:bg-muted/40"
                >
                  Cancelar edição
                </button>
              )}
            </form>
          </section>

          {/* =========================
              LISTAGEM
              ========================= */}

          <section className="rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  Cupons cadastrados
                </p>

                <h2 className="mt-1 font-display text-3xl uppercase tracking-tight text-foreground">
                  Promoções
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Acompanhe status,
                  validade e número
                  de utilizações.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  loadCoupons
                }
                className="rounded-xl border border-input bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/40"
              >
                Atualizar
              </button>
            </div>

            {loading ? (
              <div className="mt-6 rounded-2xl border border-dashed border-border bg-background px-6 py-12 text-center text-sm text-muted-foreground">
                Carregando cupons...
              </div>
            ) : coupons.length ===
              0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-border bg-background px-6 py-12 text-center text-sm text-muted-foreground">
                Nenhum cupom
                cadastrado.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {coupons.map(
                  (coupon) => {
                    const usageText =
                      coupon.usageLimit !==
                      null
                        ? `${coupon.usageCount} / ${coupon.usageLimit}`
                        : `${coupon.usageCount} / ilimitado`;

                    return (
                      <article
                        key={
                          coupon.id
                        }
                        className="rounded-[22px] border border-border bg-background p-5 transition hover:-translate-y-0.5 hover:border-foreground/10 hover:shadow-sm"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-display text-2xl uppercase tracking-tight text-foreground">
                                {
                                  coupon.code
                                }
                              </h3>

                              <span
                                className={
                                  coupon.active
                                    ? "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
                                    : "rounded-full border border-border bg-muted px-3 py-1 text-xs font-bold text-muted-foreground"
                                }
                              >
                                {coupon.active
                                  ? "Ativo"
                                  : "Inativo"}
                              </span>
                            </div>

                            <p className="mt-2 text-lg font-semibold text-foreground">
                              {coupon.discountType ===
                              "PERCENTAGE"
                                ? `${Number(
                                    coupon.discountValue
                                  ).toFixed(
                                    2
                                  )}% de desconto`
                                : `${money(
                                    coupon.discountValue
                                  )} de desconto`}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                startEdit(
                                  coupon
                                )
                              }
                              className="rounded-lg border border-input bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/40"
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toggleActive(
                                  coupon
                                )
                              }
                              className={
                                coupon.active
                                  ? "h-9 rounded-lg border border-red-200 bg-red-50 px-3.5 text-sm font-bold text-red-700 transition hover:bg-red-100"
                                  : "h-9 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                              }
                            >
                              {coupon.active
                                ? "Desativar"
                                : "Ativar"}
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                              Utilizações
                            </p>

                            <p className="mt-1 font-semibold text-foreground">
                              {
                                usageText
                              }
                            </p>
                          </div>

                          <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                              Pedido mínimo
                            </p>

                            <p className="mt-1 font-semibold text-foreground">
                              {coupon.minimumOrderValue !==
                              null
                                ? money(
                                    coupon.minimumOrderValue
                                  )
                                : "Sem mínimo"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                              Desconto máximo
                            </p>

                            <p className="mt-1 font-semibold text-foreground">
                              {coupon.maximumDiscountValue !==
                              null
                                ? money(
                                    coupon.maximumDiscountValue
                                  )
                                : "Sem limite"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                              Válido a partir
                            </p>

                            <p className="mt-1 text-sm font-semibold text-foreground">
                              {formatDateTime(
                                coupon.validFrom
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                              Válido até
                            </p>

                            <p className="mt-1 text-sm font-semibold text-foreground">
                              {formatDateTime(
                                coupon.validUntil
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                              Criado em
                            </p>

                            <p className="mt-1 text-sm font-semibold text-foreground">
                              {formatDateTime(
                                coupon.createdAt
                              )}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
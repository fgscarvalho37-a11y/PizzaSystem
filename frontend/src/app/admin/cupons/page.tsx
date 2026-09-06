"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminHeader from "@/components/AdminHeader";

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
        await fetch(
          "http://localhost:8080/api/coupons"
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
          ? "http://localhost:8080/api/coupons"
          : `http://localhost:8080/api/coupons/${editingId}`;

      const method =
        editingId === null
          ? "POST"
          : "PUT";

      const response =
        await fetch(
          url,
          {
            method,

            headers: {
              "Content-Type":
                "application/json",
            },

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
        await fetch(
          `http://localhost:8080/api/coupons/${coupon.id}/active?active=${!coupon.active}`,
          {
            method:
              "PATCH",
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
    <main className="min-h-screen bg-gray-100">
      <AdminHeader title="Cupons" />

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">

          {/* =========================
              FORMULÁRIO
              ========================= */}

          <section className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Promoções
              </p>

              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {editingId ===
                null
                  ? "Novo cupom"
                  : "Editar cupom"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
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
                <label className="mb-1 block text-sm font-semibold text-gray-700">
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
                  className="w-full rounded-xl border border-gray-300 p-3 uppercase outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
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
                  className="w-full rounded-xl border border-gray-300 bg-white p-3 outline-none transition focus:border-black"
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
                <label className="mb-1 block text-sm font-semibold text-gray-700">
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
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
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
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none transition focus:border-black"
                />

                <p className="mt-1 text-xs text-gray-400">
                  Opcional.
                </p>
              </div>

              {form.discountType ===
                "PERCENTAGE" && (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
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
                    className="w-full rounded-xl border border-gray-300 p-3 outline-none transition focus:border-black"
                  />

                  <p className="mt-1 text-xs text-gray-400">
                    Opcional. Limita
                    o desconto de um
                    cupom percentual.
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
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
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none transition focus:border-black"
                />

                <p className="mt-1 text-xs text-gray-400">
                  Deixe vazio para
                  usos ilimitados.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
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
                    className="w-full rounded-xl border border-gray-300 p-3 outline-none transition focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
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
                    className="w-full rounded-xl border border-gray-300 p-3 outline-none transition focus:border-black"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <input
                  type="checkbox"
                  checked={
                    form.active
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        active:
                          event.target.checked,
                      })
                    )
                  }
                />

                <div>
                  <p className="font-semibold text-gray-800">
                    Cupom ativo
                  </p>

                  <p className="text-xs text-gray-500">
                    Quando desativado,
                    não poderá ser
                    aplicado no
                    checkout.
                  </p>
                </div>
              </label>

              <button
                type="submit"
                disabled={
                  saving
                }
                className="w-full rounded-xl bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
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
                  className="w-full rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancelar edição
                </button>
              )}
            </form>
          </section>

          {/* =========================
              LISTAGEM
              ========================= */}

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Cupons cadastrados
                </p>

                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  Promoções
                </h2>

                <p className="mt-2 text-sm text-gray-500">
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
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Atualizar
              </button>
            </div>

            {loading ? (
              <div className="mt-8 rounded-xl bg-gray-50 p-6 text-center text-gray-500">
                Carregando cupons...
              </div>
            ) : coupons.length ===
              0 ? (
              <div className="mt-8 rounded-xl bg-gray-50 p-6 text-center text-gray-500">
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
                        className="rounded-2xl border border-gray-200 p-5"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-xl font-bold text-gray-900">
                                {
                                  coupon.code
                                }
                              </h3>

                              <span
                                className={
                                  coupon.active
                                    ? "rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700"
                                    : "rounded-full bg-gray-200 px-3 py-1 text-xs font-bold text-gray-600"
                                }
                              >
                                {coupon.active
                                  ? "Ativo"
                                  : "Inativo"}
                              </span>
                            </div>

                            <p className="mt-2 text-lg font-semibold text-gray-800">
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
                              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
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
                                  ? "rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                                  : "rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100"
                              }
                            >
                              {coupon.active
                                ? "Desativar"
                                : "Ativar"}
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                              Utilizações
                            </p>

                            <p className="mt-1 font-semibold text-gray-800">
                              {
                                usageText
                              }
                            </p>
                          </div>

                          <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                              Pedido mínimo
                            </p>

                            <p className="mt-1 font-semibold text-gray-800">
                              {coupon.minimumOrderValue !==
                              null
                                ? money(
                                    coupon.minimumOrderValue
                                  )
                                : "Sem mínimo"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                              Desconto máximo
                            </p>

                            <p className="mt-1 font-semibold text-gray-800">
                              {coupon.maximumDiscountValue !==
                              null
                                ? money(
                                    coupon.maximumDiscountValue
                                  )
                                : "Sem limite"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                              Válido a partir
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-800">
                              {formatDateTime(
                                coupon.validFrom
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                              Válido até
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-800">
                              {formatDateTime(
                                coupon.validUntil
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                              Criado em
                            </p>

                            <p className="mt-1 text-sm font-semibold text-gray-800">
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
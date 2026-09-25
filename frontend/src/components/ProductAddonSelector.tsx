"use client";

import { useLanguage, type AppLocale } from "@/i18n/LanguageProvider";

export type ProductAddon = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  active: boolean;
  sortOrder: number;
};

export type ProductAddonGroup = {
  id: number;
  name: string;
  description?: string | null;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  active: boolean;
  sortOrder: number;
  addons?: ProductAddon[];
};

type ProductAddonSelectorProps = {
  groups: ProductAddonGroup[];
  selectedAddonIds: number[];
  onChange: (
    addonIds: number[]
  ) => void;
};

function formatMoney(
  value: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(value);
}

// =========================
// VALIDAÇÃO
// =========================

export function validateAddonSelections(
  groups: ProductAddonGroup[],
  selectedAddonIds: number[],
  locale: AppLocale = "pt-BR"
) {
  const isEnglish =
    locale === "en-US";
  const selected =
    new Set(
      selectedAddonIds
    );

  const activeGroups =
    groups.filter(
      (group) =>
        group.active
    );

  for (
    const group
    of activeGroups
  ) {
    const activeAddons =
      (
        group.addons ??
        []
      ).filter(
        (addon) =>
          addon.active
      );

    const selectedCount =
      activeAddons.filter(
        (addon) =>
          selected.has(
            addon.id
          )
      ).length;

    if (
      selectedCount <
      group.minSelections
    ) {
      return {
        valid: false,
        message:
          group.minSelections === 1
            ? isEnglish
              ? `Choose an option in ${group.name}.`
              : `Escolha uma opção em ${group.name}.`
            : isEnglish
              ? `Choose at least ${group.minSelections} options in ${group.name}.`
              : `Escolha pelo menos ${group.minSelections} opções em ${group.name}.`,
      };
    }

    if (
      selectedCount >
      group.maxSelections
    ) {
      return {
        valid: false,
        message:
          isEnglish
            ? `Choose up to ${group.maxSelections} options in ${group.name}.`
            : `Escolha no máximo ${group.maxSelections} opções em ${group.name}.`,
      };
    }
  }

  return {
    valid: true,
    message: "",
  };
}

// =========================
// PREÇO TOTAL
// =========================

export function getSelectedAddonsPrice(
  groups: ProductAddonGroup[],
  selectedAddonIds: number[]
) {
  const selected =
    new Set(
      selectedAddonIds
    );

  let total =
    0;

  for (
    const group
    of groups
  ) {
    for (
      const addon
      of group.addons ?? []
    ) {
      if (
        addon.active &&
        selected.has(
          addon.id
        )
      ) {
        total +=
          Number(
            addon.price
          );
      }
    }
  }

  return total;
}

// =========================
// COMPONENTE
// =========================

export default function ProductAddonSelector({
  groups,
  selectedAddonIds,
  onChange,
}: ProductAddonSelectorProps) {
  const {
    text,
  } =
    useLanguage();

  const activeGroups =
    groups
      .filter(
        (group) =>
          group.active
      )
      .sort(
        (a, b) =>
          a.sortOrder -
          b.sortOrder
      );

  function toggleAddon(
    group:
      ProductAddonGroup,
    addon:
      ProductAddon
  ) {
    const selected =
      selectedAddonIds.includes(
        addon.id
      );

    // =========================
    // REMOVER
    // =========================

    if (selected) {
      onChange(
        selectedAddonIds.filter(
          (id) =>
            id !== addon.id
        )
      );

      return;
    }

    // =========================
    // SELEÇÃO ÚNICA
    // =========================

    if (
      group.maxSelections === 1
    ) {
      const idsFromGroup =
        new Set(
          (
            group.addons ??
            []
          ).map(
            (item) =>
              item.id
          )
        );

      const withoutCurrentGroup =
        selectedAddonIds.filter(
          (id) =>
            !idsFromGroup.has(
              id
            )
        );

      onChange([
        ...withoutCurrentGroup,
        addon.id,
      ]);

      return;
    }

    // =========================
    // MÚLTIPLA SELEÇÃO
    // =========================

    const currentGroupCount =
      (
        group.addons ??
        []
      ).filter(
        (item) =>
          item.active &&
          selectedAddonIds.includes(
            item.id
          )
      ).length;

    if (
      currentGroupCount >=
      group.maxSelections
    ) {
      return;
    }

    onChange([
      ...selectedAddonIds,
      addon.id,
    ]);
  }

  if (
    activeGroups.length ===
    0
  ) {
    return null;
  }

  return (
    <div className="mt-6 space-y-6 border-t border-border pt-6">

      {activeGroups.map(
        (group) => {

          const activeAddons =
            (
              group.addons ??
              []
            )
              .filter(
                (addon) =>
                  addon.active
              )
              .sort(
                (a, b) =>
                  a.sortOrder -
                  b.sortOrder
              );

          if (
            activeAddons.length ===
            0
          ) {
            return null;
          }

          const selectedCount =
            activeAddons.filter(
              (addon) =>
                selectedAddonIds.includes(
                  addon.id
                )
            ).length;

          return (
            <section
              key={
                group.id
              }
            >

              {/* =========================
                  CABEÇALHO
              ========================= */}

              <div className="flex items-start justify-between gap-4">

                <div>

                  <div className="flex flex-wrap items-center gap-2">

                    <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                      {group.name}
                    </p>

                    {group.required && (
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-primary">
                        {text("Obrigatório", "Required")}
                      </span>
                    )}

                  </div>

                  {group.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {group.description}
                    </p>
                  )}

                  <p className="mt-1 text-xs text-muted-foreground">
                    {group.maxSelections === 1
                      ? text("Escolha 1 opção", "Choose 1 option")
                      : text(
                          `Escolha até ${group.maxSelections} opções`,
                          `Choose up to ${group.maxSelections} options`
                        )}
                  </p>

                </div>

                <span className="shrink-0 text-xs font-bold text-muted-foreground">
                  {selectedCount}/{group.maxSelections}
                </span>

              </div>

              {/* =========================
                  OPÇÕES
              ========================= */}

              <div className="mt-4 grid gap-2">

                {activeAddons.map(
                  (addon) => {

                    const selected =
                      selectedAddonIds.includes(
                        addon.id
                      );

                    const limitReached =
                      !selected &&
                      group.maxSelections > 1 &&
                      selectedCount >=
                        group.maxSelections;

                    return (
                      <button
                        key={
                          addon.id
                        }
                        type="button"
                        disabled={
                          limitReached
                        }
                        onClick={() =>
                          toggleAddon(
                            group,
                            addon
                          )
                        }
                        className={`flex min-h-14 items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition ${
                          selected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                            : limitReached
                              ? "cursor-not-allowed border-border bg-muted/30 opacity-50"
                              : "border-border bg-card hover:border-foreground/30"
                        }`}
                      >

                        <span className="flex min-w-0 items-center gap-3">

                          <span
                            className={`grid h-6 w-6 shrink-0 place-items-center ${
                              group.maxSelections === 1
                                ? "rounded-full"
                                : "rounded-md"
                            } border ${
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border"
                            }`}
                          >

                            {selected && (
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              >
                                <path d="m5 12 4 4L19 6" />
                              </svg>
                            )}

                          </span>

                          <span className="min-w-0">

                            <span className="block truncate font-bold text-foreground">
                              {addon.name}
                            </span>

                            {addon.description && (
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {addon.description}
                              </span>
                            )}

                          </span>

                        </span>

                        <span className="shrink-0 text-sm font-bold text-primary">
                          {Number(
                            addon.price
                          ) === 0
                            ? text("Grátis", "Free")
                            : `+ ${formatMoney(
                                Number(
                                  addon.price
                                )
                              )}`}
                        </span>

                      </button>
                    );
                  }
                )}

              </div>

            </section>
          );
        }
      )}

    </div>
  );
}
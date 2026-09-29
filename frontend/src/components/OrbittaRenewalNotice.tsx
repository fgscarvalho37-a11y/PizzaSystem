"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  CalendarClock,
  ExternalLink,
} from "lucide-react";

import { useLanguage } from "@/i18n/LanguageProvider";

type OrbittaSubscription = {
  managedByOrbitta: boolean;
  plan: string | null;
  status: string | null;
  renewalDate: string | null;
};

function daysUntil(dateValue: string) {
  const target = new Date(
    `${dateValue}T12:00:00`
  );

  const today = new Date();

  if (
    Number.isNaN(
      target.getTime()
    )
  ) {
    return null;
  }

  const targetDay = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );

  const currentDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  return Math.round(
    (
      targetDay.getTime() -
      currentDay.getTime()
    ) /
      86_400_000
  );
}

export default function OrbittaRenewalNotice() {
  const {
    text,
    locale,
  } = useLanguage();

  const [
    subscription,
    setSubscription,
  ] =
    useState<OrbittaSubscription | null>(
      null
    );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response =
          await fetch(
            "/api/admin/orbitta/subscription",
            {
              credentials:
                "include",
              cache:
                "no-store",
              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        if (
          !response.ok ||
          cancelled
        ) {
          return;
        }

        const data:
          OrbittaSubscription =
          await response.json();

        if (!cancelled) {
          setSubscription(
            data
          );
        }
      } catch {
        // O aviso nunca deve bloquear o painel.
      }
    }

    void load();

    const interval =
      window.setInterval(
        () => {
          void load();
        },
        5 * 60 * 1000
      );

    return () => {
      cancelled = true;
      window.clearInterval(
        interval
      );
    };
  }, []);

  const daysRemaining =
    useMemo(() => {
      if (
        !subscription
          ?.renewalDate
      ) {
        return null;
      }

      return daysUntil(
        subscription
          .renewalDate
      );
    }, [
      subscription
        ?.renewalDate,
    ]);

  if (
    !subscription
      ?.managedByOrbitta ||
    !subscription
      .renewalDate ||
    daysRemaining === null
  ) {
    return null;
  }

  /*
   * Planos mensais normalmente ficam dentro de 31 dias.
   * Se algum contrato futuro tiver período maior,
   * evitamos deixar um aviso permanente por meses.
   */
  if (
    daysRemaining > 31
  ) {
    return null;
  }

  /*
   * Nos últimos 7 dias o lembrete vira fixo.
   * Antes disso ele fica como uma notificação discreta
   * no canto inferior do painel.
   */
  const pinned =
    daysRemaining <= 7;

  const critical =
    daysRemaining <= 2;

  const dateLabel =
    new Intl.DateTimeFormat(
      locale,
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    ).format(
      new Date(
        `${subscription.renewalDate}T12:00:00`
      )
    );

  const countdown =
    daysRemaining < 0
      ? text(
          "A renovação está vencida.",
          "Your renewal is overdue."
        )
      : daysRemaining ===
          0
        ? text(
            "Seu plano renova hoje.",
            "Your plan renews today."
          )
        : daysRemaining ===
            1
          ? text(
              "Falta 1 dia para a renovação.",
              "1 day left until renewal."
            )
          : text(
              `Faltam ${daysRemaining} dias para a renovação.`,
              `${daysRemaining} days left until renewal.`
            );

  const containerClass =
    pinned
      ? [
          "fixed left-4 right-4 top-20 z-[70]",
          "lg:left-24 lg:top-4",
          "rounded-2xl border shadow-xl backdrop-blur-xl",
          critical
            ? "border-red-500/25 bg-red-950/95 text-red-50"
            : "border-amber-400/25 bg-amber-950/95 text-amber-50",
        ].join(
          " "
        )
      : [
          "fixed bottom-5 right-5 z-[60]",
          "w-[calc(100%-2.5rem)] max-w-md",
          "rounded-2xl border border-border",
          "bg-card/95 text-foreground shadow-xl backdrop-blur-xl",
        ].join(
          " "
        );

  return (
    <aside
      className={
        containerClass
      }
      role="status"
      aria-live={
        pinned
          ? "assertive"
          : "polite"
      }
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className={[
            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            pinned
              ? critical
                ? "bg-red-500/15 text-red-100"
                : "bg-amber-400/15 text-amber-100"
              : "bg-primary/10 text-primary",
          ].join(
            " "
          )}
        >
          {pinned ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <CalendarClock className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-65">
              Orbitta
            </span>

            {pinned && (
              <span className="rounded-full border border-current/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] opacity-75">
                {text(
                  "Lembrete fixo",
                  "Pinned reminder"
                )}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm font-bold">
            {countdown}
          </p>

          <p className="mt-1 text-xs leading-5 opacity-70">
            {text(
              `Renovação do plano ${subscription.plan ?? "Orbitta"} em ${dateLabel}.`,
              `${subscription.plan ?? "Orbitta"} plan renewal on ${dateLabel}.`
            )}
          </p>
        </div>

        <a
          href="https://orbitta.space/painel"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-current/15 px-3 text-[11px] font-bold transition hover:bg-white/10"
        >
          {text(
            "Abrir Orbitta",
            "Open Orbitta"
          )}

          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </aside>
  );
}

"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  BarChart3,
  Bike,
  Check,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ExternalLink,
  Globe2,
  LayoutDashboard,
  Palette,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";

import { adminFetch } from "@/lib/adminFetch";

type AdminOnboardingProps = {
  open: boolean;
  onClose: () => void;
};

type Step = {
  eyebrow: string;
  title: string;
  description: string;
  tips: string[];
  href: string;
  action: string;
  icon:
    typeof LayoutDashboard;
};

const steps: Step[] = [
  {
    eyebrow: "Comece por aqui",
    title: "Seu painel central",
    description:
      "O painel reúne os atalhos e os números principais da operação. É o ponto de partida para acompanhar a loja.",
    tips: [
      "Veja pedidos e atividade do dia.",
      "Use os atalhos para chegar rápido em cada área.",
      "O menu lateral concentra toda a administração.",
    ],
    href: "/admin",
    action: "Abrir painel",
    icon: LayoutDashboard,
  },
  {
    eyebrow: "Monte sua operação",
    title: "Cardápio, categorias e adicionais",
    description:
      "Cadastre produtos, organize categorias, configure adicionais e bordas e deixe o cardápio pronto para venda.",
    tips: [
      "Crie as categorias antes de cadastrar muitos produtos.",
      "Fotos e descrições ajudam o cliente a escolher.",
      "Adicionais e bordas podem complementar o valor do pedido.",
    ],
    href: "/admin/cardapio",
    action: "Gerenciar cardápio",
    icon: ShoppingBag,
  },
  {
    eyebrow: "Venda online",
    title: "Abra sua loja pública",
    description:
      "Escolha o endereço público da loja e compartilhe o cardápio com seus clientes.",
    tips: [
      "Você pode usar o endereço hospedado pela Orbitta.",
      "O botão Abrir loja mostra exatamente o que o cliente verá.",
      "Seu endereço pode ficar no formato sua-loja.orbitta.space.",
    ],
    href: "/admin/loja",
    action: "Configurar loja",
    icon: Globe2,
  },
  {
    eyebrow: "Operação",
    title: "Pedidos e cozinha",
    description:
      "Os pedidos entram no painel e seguem o fluxo de preparo até ficarem prontos.",
    tips: [
      "Pedidos mostra detalhes, pagamento e endereço.",
      "Cozinha organiza o fluxo por status.",
      "Você pode imprimir o pedido ou baixar o comprovante em PDF.",
    ],
    href: "/admin/pedidos",
    action: "Ver pedidos",
    icon: ChefHat,
  },
  {
    eyebrow: "Entrega",
    title: "Acompanhe as saídas",
    description:
      "Use a área de entregas para separar o que está pronto, saiu para entrega e foi concluído.",
    tips: [
      "Atualize os status conforme o pedido avança.",
      "O histórico preserva os pedidos finalizados.",
      "Configure as áreas e taxas de entrega nas configurações.",
    ],
    href: "/admin/entregas",
    action: "Ver entregas",
    icon: Bike,
  },
  {
    eyebrow: "Pagamentos",
    title: "Conecte o Mercado Pago",
    description:
      "A loja pode receber PIX e cartão usando a conta Mercado Pago do próprio estabelecimento.",
    tips: [
      "A conexão fica vinculada à sua loja.",
      "O status do pagamento acompanha o pedido.",
      "As taxas do meio de pagamento seguem as regras do provedor.",
    ],
    href: "/admin/configuracoes",
    action: "Abrir configurações",
    icon: CreditCard,
  },
  {
    eyebrow: "Financeiro",
    title: "Caixa, relatórios e PDFs",
    description:
      "Consulte o movimento do dia, feche o caixa e acompanhe os números da operação.",
    tips: [
      "O caixa mostra faturamento, ticket médio e formas de pagamento.",
      "O fechamento fica registrado por loja e por data.",
      "Você pode baixar o relatório do caixa em PDF.",
    ],
    href: "/admin/caixa",
    action: "Abrir caixa",
    icon: BarChart3,
  },
  {
    eyebrow: "Sua marca",
    title: "Personalize a experiência",
    description:
      "Ajuste nome, imagens, aparência, horários e outros detalhes para deixar a loja com a cara do negócio.",
    tips: [
      "Envie logo e imagem de capa.",
      "Configure os horários reais de funcionamento.",
      "Revise o cardápio público antes de divulgar o link.",
    ],
    href: "/admin/personalizacao",
    action: "Personalizar",
    icon: Palette,
  },
];

export default function AdminOnboarding({
  open,
  onClose,
}: AdminOnboardingProps) {
  const [
    index,
    setIndex,
  ] =
    useState(0);

  const [
    finishing,
    setFinishing,
  ] =
    useState(false);

  const step =
    useMemo(
      () =>
        steps[index],
      [
        index,
      ]
    );

  if (!open) {
    return null;
  }

  const Icon =
    step.icon;

  const last =
    index ===
    steps.length - 1;

  async function finish() {
    if (finishing) {
      return;
    }

    try {
      setFinishing(true);

      const response =
        await adminFetch(
          "/api/auth/onboarding/complete",
          {
            method: "POST",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Não foi possível salvar a introdução."
        );
      }

      onClose();

    } catch {
      /*
       * Não prendemos o usuário no onboarding se houver
       * uma falha temporária de rede. Ele poderá rever
       * tudo pela aba Guia.
       */
      onClose();

    } finally {
      setFinishing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-md sm:p-6">

      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[30px] border border-border bg-background shadow-2xl">

        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-7">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Bem-vindo ao PizzaSystem
              </p>

              <p className="text-sm font-semibold text-foreground">
                Conheça sua operação em poucos passos
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={
              finish
            }
            aria-label="Pular introdução"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>

        </div>

        <div className="overflow-y-auto">

          <div className="grid lg:grid-cols-[240px_1fr]">

            <aside className="border-b border-border bg-muted/25 p-4 lg:border-b-0 lg:border-r lg:p-5">

              <div className="grid grid-cols-4 gap-2 lg:grid-cols-1">

                {steps.map(
                  (
                    item,
                    stepIndex
                  ) => {

                    const StepIcon =
                      item.icon;

                    const active =
                      stepIndex ===
                      index;

                    const passed =
                      stepIndex <
                      index;

                    return (
                      <button
                        key={
                          item.title
                        }
                        type="button"
                        onClick={() =>
                          setIndex(
                            stepIndex
                          )
                        }
                        className={[
                          "flex min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-left transition",
                          active
                            ? "border-primary/20 bg-primary/10 text-primary"
                            : "border-transparent text-muted-foreground hover:bg-background hover:text-foreground",
                        ].join(
                          " "
                        )}
                      >

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background/80">
                          {passed ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <StepIcon className="h-4 w-4" />
                          )}
                        </div>

                        <span className="hidden min-w-0 lg:block">
                          <span className="block text-[10px] font-bold uppercase tracking-[0.12em] opacity-60">
                            Passo{" "}
                            {stepIndex +
                              1}
                          </span>

                          <span className="mt-0.5 block truncate text-xs font-bold">
                            {
                              item.title
                            }
                          </span>
                        </span>

                      </button>
                    );
                  }
                )}

              </div>

            </aside>

            <section className="p-6 sm:p-8 lg:p-10">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-7 w-7" />
              </div>

              <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                {step.eyebrow}
              </p>

              <h2 className="mt-2 max-w-2xl font-display text-4xl uppercase leading-none tracking-tight text-foreground sm:text-5xl">
                {step.title}
              </h2>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                {step.description}
              </p>

              <div className="mt-7 grid gap-3">

                {step.tips.map(
                  (
                    tip
                  ) => (
                    <div
                      key={
                        tip
                      }
                      className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
                    >

                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Check className="h-3.5 w-3.5" />
                      </div>

                      <p className="text-sm leading-6 text-foreground/80">
                        {tip}
                      </p>

                    </div>
                  )
                )}

              </div>

              <Link
                href={
                  step.href
                }
                onClick={
                  finish
                }
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-bold text-foreground transition hover:bg-muted"
              >
                {step.action}
                <ExternalLink className="h-4 w-4" />
              </Link>

            </section>

          </div>

        </div>

        <div className="flex flex-col gap-3 border-t border-border bg-card/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">

          <div className="text-xs text-muted-foreground">
            {index + 1} de{" "}
            {steps.length}
            {" "}• Você pode rever tudo depois em{" "}
            <strong className="text-foreground">
              Guia
            </strong>
          </div>

          <div className="flex gap-2">

            <button
              type="button"
              onClick={
                finish
              }
              disabled={
                finishing
              }
              className="h-10 rounded-xl px-4 text-sm font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              Pular
            </button>

            {index > 0 && (
              <button
                type="button"
                onClick={() =>
                  setIndex(
                    (
                      current
                    ) =>
                      current -
                      1
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-bold text-foreground transition hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </button>
            )}

            {last ? (
              <button
                type="button"
                onClick={
                  finish
                }
                disabled={
                  finishing
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {finishing
                  ? "Salvando..."
                  : "Concluir"}
              </button>

            ) : (
              <button
                type="button"
                onClick={() =>
                  setIndex(
                    (
                      current
                    ) =>
                      current +
                      1
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

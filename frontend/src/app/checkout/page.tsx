"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

const API_URL = "";

type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
};

type Crust = {
  id: number;
  name: string;
  price: number;
  active: boolean;
  sortOrder: number;
};

type Addon = {
  id: number;
  name: string;
  price: number;
  active?: boolean;
  sortOrder?: number;
};

type CartItem = {
  product: Product;
  quantity: number;
  observation: string;
  crust: Crust | null;
  addons: Addon[];
};

type DeliveryQuote = {
  pricingMode:
    | "PER_KM"
    | "FIXED";
  distanceKm: number | null;
  feePerKm: number | null;
  fee: number;
  city: string;
  neighborhood: string;
  freeDelivery: boolean;
  freeDeliveryAbove: number | null;
  routeProvider: string;
  googleMapsUrl: string | null;
};

type StoreStatus = {
  storeName: string;
  manualOpen: boolean;
  open: boolean;
  message: string;
};

type PaymentMethod =
  | "PIX"
  | "CREDIT_CARD"
  | "DEBIT_CARD";

type CouponValidationResponse = {
  valid: boolean;
  couponId: number;
  code: string;
  discountType:
    | "PERCENTAGE"
    | "FIXED_AMOUNT";
  discountValue: number;
  discount: number;
  originalValue: number;
  finalValue: number;
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

function getItemAddonsTotal(
  item: CartItem
) {
  return (
    item.addons ??
    []
  ).reduce(
    (
      total,
      addon
    ) =>
      total +
      Number(
        addon.price
      ),
    0
  );
}

function getItemUnitPrice(
  item: CartItem
) {
  return (
    Number(
      item.product.price
    ) +
    Number(
      item.crust?.price ??
        0
    ) +
    getItemAddonsTotal(
      item
    )
  );
}

export default function CheckoutPage() {
  const router =
    useRouter();

  const [
    storeSlug,
    setStoreSlug,
  ] = useState("");

  const [
    storeResolved,
    setStoreResolved,
  ] = useState(false);

  const [
    cart,
    setCart,
  ] = useState<CartItem[]>(
    []
  );

  const [
    deliveryQuote,
    setDeliveryQuote,
  ] = useState<
    DeliveryQuote | null
  >(null);

  const [
    deliveryQuoteLoading,
    setDeliveryQuoteLoading,
  ] = useState(false);

  const [
    deliveryQuoteError,
    setDeliveryQuoteError,
  ] = useState("");

  const [
    storeStatus,
    setStoreStatus,
  ] = useState<
    StoreStatus | null
  >(null);

  const [
    loaded,
    setLoaded,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    checkoutError,
    setCheckoutError,
  ] = useState("");

  const [
    customerName,
    setCustomerName,
  ] = useState("");

  const [
    customerPhone,
    setCustomerPhone,
  ] = useState("");

  const [
    street,
    setStreet,
  ] = useState("");

  const [
    number,
    setNumber,
  ] = useState("");

  const [
    city,
    setCity,
  ] = useState("");

  const [
    neighborhood,
    setNeighborhood,
  ] = useState("");

  const [
    complement,
    setComplement,
  ] = useState("");

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState<
      PaymentMethod | ""
    >("");

  const [
    couponInput,
    setCouponInput,
  ] = useState("");

  const [
    appliedCoupon,
    setAppliedCoupon,
  ] =
    useState<
      CouponValidationResponse | null
    >(null);

  const [
    couponLoading,
    setCouponLoading,
  ] = useState(false);

  const [
    couponMessage,
    setCouponMessage,
  ] = useState("");

  const [
    couponError,
    setCouponError,
  ] = useState("");

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const storeFromQuery =
      params
        .get(
          "store"
        )
        ?.trim() ??
        "";

    if (storeFromQuery) {
      setStoreSlug(
        storeFromQuery
      );

      setStoreResolved(
        true
      );

      return;
    }

    const host =
      window.location.hostname
        .trim()
        .toLowerCase();

    const suffix =
      ".orbitta.space";

    const hostedSlug =
      host.endsWith(
        suffix
      )
        ? host.slice(
            0,
            -suffix.length
          )
        : "";

    setStoreSlug(
      hostedSlug &&
      !hostedSlug.includes(
        "."
      )
        ? hostedSlug
        : ""
    );

    setStoreResolved(
      true
    );
  }, []);

  const cartKey =
    storeSlug
      ? `pizzasystem-cart:${storeSlug}`
      : "";

  // =========================
  // CARRINHO
  // =========================

  useEffect(() => {
    if (!storeResolved) {
      return;
    }

    if (
      !storeSlug ||
      !cartKey
    ) {
      setLoaded(
        true
      );

      return;
    }

    setLoaded(
      false
    );

    const savedCart =
      localStorage.getItem(
        cartKey
      );

    if (savedCart) {
      try {
        const parsed:
          CartItem[] =
          JSON.parse(
            savedCart
          );

        const normalized =
          parsed.map(
            (item) => ({
              ...item,

              observation:
                item.observation ??
                "",

              crust:
                item.crust ??
                null,

              addons:
                Array.isArray(
                  item.addons
                )
                  ? item.addons
                  : [],
            })
          );

        setCart(
          normalized
        );
      } catch (
        error
      ) {
        console.error(
          "Erro ao carregar carrinho:",
          error
        );

        localStorage.removeItem(
          cartKey
        );
      }
    }

    setLoaded(
      true
    );
  }, [
    storeSlug,
    cartKey,
    storeResolved,
  ]);

  // =========================
  // LOJA
  // =========================

  useEffect(() => {
    if (
      !storeResolved ||
      !storeSlug
    ) {
      return;
    }

    let mounted =
      true;

    async function loadData() {
      try {
        const statusResponse =
          await fetch(
            `${API_URL}/api/store/status?store=${encodeURIComponent(
              storeSlug
            )}`,
            {
              cache:
                "no-store",
            }
          );

        if (
          !statusResponse.ok
        ) {
          throw new Error(
            "Erro ao carregar status"
          );
        }

        const statusData:
          StoreStatus =
          await statusResponse.json();

        if (!mounted) {
          return;
        }

        setStoreStatus(
          statusData
        );
      } catch (
        error
      ) {
        console.error(
          error
        );

        if (mounted) {
          setCheckoutError(
            "Não foi possível carregar os dados da loja agora. Atualize a página e tente novamente."
          );
        }
      }
    }

    void loadData();

    const interval =
      window.setInterval(
        async () => {
          try {
            const response =
              await fetch(
                `${API_URL}/api/store/status?store=${encodeURIComponent(
                  storeSlug
                )}`,
                {
                  cache:
                    "no-store",
                }
              );

            if (
              !response.ok
            ) {
              return;
            }

            const data:
              StoreStatus =
              await response.json();

            if (mounted) {
              setStoreStatus(
                data
              );
            }
          } catch (
            error
          ) {
            console.error(
              error
            );
          }
        },
        10000
      );

    return () => {
      mounted =
        false;

      window.clearInterval(
        interval
      );
    };
  }, [
    storeSlug,
    storeResolved,
  ]);

  // =========================
  // CARRINHO - AÇÕES
  // =========================

  function saveCart(
    nextCart:
      CartItem[]
  ) {
    setCart(
      nextCart
    );

    if (
      cartKey
    ) {
      localStorage.setItem(
        cartKey,
        JSON.stringify(
          nextCart
        )
      );
    }
  }

  function updateObservation(
    itemIndex: number,
    observation: string
  ) {
    const nextCart =
      cart.map(
        (
          item,
          index
        ) =>
          index ===
          itemIndex
            ? {
                ...item,
                observation,
              }
            : item
      );

    saveCart(
      nextCart
    );
  }

  function setItemQuantity(
    itemIndex: number,
    nextQuantity: number
  ) {
    const nextCart =
      cart
        .map(
          (
            item,
            index
          ) =>
            index ===
            itemIndex
              ? {
                  ...item,
                  quantity:
                    nextQuantity,
                }
              : item
        )
        .filter(
          (item) =>
            item.quantity >
            0
        );

    saveCart(
      nextCart
    );
  }

  function removeItem(
    itemIndex: number
  ) {
    saveCart(
      cart.filter(
        (
          _,
          index
        ) =>
          index !==
          itemIndex
      )
    );
  }

  // =========================
  // VALORES
  // =========================

  const subtotal =
    useMemo(
      () =>
        cart.reduce(
          (
            total,
            item
          ) =>
            total +
            getItemUnitPrice(
              item
            ) *
              item.quantity,
          0
        ),
      [cart]
    );

  const deliveryFee =
    deliveryQuote
      ? Number(
          deliveryQuote.fee
        )
      : 0;

  const totalBeforeDiscount =
    subtotal +
    deliveryFee;

  const discountAmount =
    appliedCoupon
      ? Number(
          appliedCoupon.discount
        )
      : 0;

  const total =
    Math.max(
      0,
      totalBeforeDiscount -
        discountAmount
    );

  const totalItems =
    useMemo(
      () =>
        cart.reduce(
          (
            count,
            item
          ) =>
            count +
            item.quantity,
          0
        ),
      [cart]
    );

  // =========================
  // ENTREGA - CÁLCULO AUTOMÁTICO
  // =========================

  useEffect(() => {
    setDeliveryQuoteError(
      ""
    );

    if (
      !street.trim() ||
      !number.trim() ||
      !city.trim() ||
      !neighborhood.trim() ||
      !storeSlug ||
      subtotal <= 0
    ) {
      setDeliveryQuote(
        null
      );

      setDeliveryQuoteLoading(
        false
      );

      return;
    }

    const controller =
      new AbortController();

    const timer =
      window.setTimeout(
        async () => {
          try {
            setDeliveryQuoteLoading(
              true
            );

            setDeliveryQuoteError(
              ""
            );

            const response =
              await fetch(
                `${API_URL}/api/delivery-areas/quote?store=${encodeURIComponent(
                  storeSlug
                )}`,
                {
                  method:
                    "POST",
                  headers: {
                    "Content-Type":
                      "application/json",
                    Accept:
                      "application/json",
                  },
                  body:
                    JSON.stringify({
                      street:
                        street.trim(),
                      number:
                        number.trim(),
                      city:
                        city.trim(),
                      neighborhood:
                        neighborhood.trim(),
                      complement:
                        complement.trim() ||
                        null,
                      orderSubtotal:
                        Number(
                          subtotal.toFixed(
                            2
                          )
                        ),
                    }),
                  signal:
                    controller.signal,
                }
              );

            if (!response.ok) {
              let message =
                "Não foi possível calcular a entrega para este endereço.";

              try {
                const data =
                  await response.json();

                if (
                  typeof data?.message ===
                    "string" &&
                  data.message
                ) {
                  message =
                    data.message;
                } else if (
                  typeof data?.detail ===
                    "string" &&
                  data.detail
                ) {
                  message =
                    data.detail;
                }
              } catch {
                // mantém mensagem padrão
              }

              throw new Error(
                message
              );
            }

            const data:
              DeliveryQuote =
              await response.json();

            setDeliveryQuote(
              data
            );

          } catch (
            error
          ) {
            if (
              error instanceof
                DOMException &&
              error.name ===
                "AbortError"
            ) {
              return;
            }

            setDeliveryQuote(
              null
            );

            setDeliveryQuoteError(
              error instanceof
                Error
                ? error.message
                : "Não foi possível calcular a entrega."
            );

          } finally {
            if (
              !controller.signal
                .aborted
            ) {
              setDeliveryQuoteLoading(
                false
              );
            }
          }
        },
        700
      );

    return () => {
      window.clearTimeout(
        timer
      );

      controller.abort();
    };
  }, [
    street,
    number,
    city,
    neighborhood,
    complement,
    storeSlug,
    subtotal,
  ]);

  // =========================
  // CUPOM - INVALIDAR
  // =========================

  useEffect(() => {
    if (
      !appliedCoupon
    ) {
      return;
    }

    if (
      Number(
        appliedCoupon
          .originalValue
      ) !==
      Number(
        totalBeforeDiscount
      )
    ) {
      setAppliedCoupon(
        null
      );

      setCouponMessage(
        ""
      );

      setCouponError(
        "O valor do pedido mudou. Aplique o cupom novamente."
      );
    }
  }, [
    totalBeforeDiscount,
    appliedCoupon,
  ]);

  // =========================
  // CUPOM - APLICAR
  // =========================

  async function handleApplyCoupon() {
    const code =
      couponInput
        .trim()
        .toUpperCase();

    setCouponMessage(
      ""
    );

    setCouponError(
      ""
    );

    if (!code) {
      setCouponError(
        "Digite um código de cupom."
      );

      return;
    }

    if (
      totalBeforeDiscount <=
      0
    ) {
      setCouponError(
        "Não há valor para aplicar o cupom."
      );

      return;
    }

    try {
      setCouponLoading(
        true
      );

      const response =
        await fetch(
          `${API_URL}/api/coupons/validate?code=${encodeURIComponent(
            code
          )}&orderValue=${encodeURIComponent(
            totalBeforeDiscount.toFixed(
              2
            )
          )}&store=${encodeURIComponent(
            storeSlug
          )}`
        );

      if (
        !response.ok
      ) {
        let message =
          "Cupom inválido ou indisponível.";

        try {
          const data =
            await response.json();

          if (
            typeof data
              ?.message ===
              "string" &&
            data.message
          ) {
            message =
              data.message;
          }
        } catch {
          // mantém padrão
        }

        setAppliedCoupon(
          null
        );

        setCouponError(
          message
        );

        return;
      }

      const data:
        CouponValidationResponse =
        await response.json();

      if (!data.valid) {
        setAppliedCoupon(
          null
        );

        setCouponError(
          "Este cupom não é válido."
        );

        return;
      }

      setCouponInput(
        data.code
      );

      setAppliedCoupon(
        data
      );

      setCouponMessage(
        `Cupom ${data.code} aplicado com sucesso.`
      );
    } catch (
      error
    ) {
      console.error(
        "Erro ao validar cupom:",
        error
      );

      setAppliedCoupon(
        null
      );

      setCouponError(
        "Não foi possível validar o cupom."
      );
    } finally {
      setCouponLoading(
        false
      );
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(
      null
    );

    setCouponInput(
      ""
    );

    setCouponMessage(
      ""
    );

    setCouponError(
      ""
    );
  }

  // =========================
  // FINALIZAR
  // =========================

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setCheckoutError(
      ""
    );

    if (
      paymentMethod ===
      "DEBIT_CARD"
    ) {
      setCheckoutError(
        "O pagamento com cartão de débito está temporariamente indisponível."
      );

      return;
    }

    if (
      !storeStatus?.open
    ) {
      setCheckoutError(
        storeStatus?.message ||
          "O estabelecimento não está recebendo pedidos agora."
      );

      return;
    }

    if (
      cart.length ===
      0
    ) {
      setCheckoutError(
        "Seu carrinho está vazio."
      );

      return;
    }

    if (
      !city
    ) {
      setCheckoutError(
        "Informe a cidade para continuar."
      );

      return;
    }

    if (
      !neighborhood
    ) {
      setCheckoutError(
        "Informe o bairro para continuar."
      );

      return;
    }

    if (
      !deliveryQuote
    ) {
      setCheckoutError(
        deliveryQuoteError ||
          "Aguarde o cálculo da taxa de entrega."
      );

      return;
    }

    if (
      !paymentMethod
    ) {
      setCheckoutError(
        "Selecione a forma de pagamento."
      );

      return;
    }

    if (
      couponInput.trim() &&
      !appliedCoupon
    ) {
      setCheckoutError(
        "Você digitou um cupom. Clique em Aplicar antes de finalizar o pedido."
      );

      return;
    }

    try {
      setSubmitting(
        true
      );

      const payload = {
        storeSlug,

        customerName,

        customerPhone,

        street,

        number,

        city,

        neighborhood,

        complement,

        paymentMethod,

        couponCode:
          appliedCoupon
            ? appliedCoupon.code
            : null,

        items:
          cart.map(
            (item) => ({
              productId:
                item.product.id,

              quantity:
                item.quantity,

              observation:
                item.observation,

              crustId:
                item.crust?.id ??
                null,

              addonIds:
                (
                  item.addons ??
                  []
                ).map(
                  (addon) =>
                    addon.id
                ),
            })
          ),
      };

      const orderResponse =
        await fetch(
          `${API_URL}/api/orders`,
          {
            method:
              "POST",

            credentials:
              "include",

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

      if (
        !orderResponse.ok
      ) {
        const text =
          await orderResponse.text();

        console.error(
          "Erro ao criar pedido:",
          text
        );

        let message =
          "Não foi possível criar o pedido.";

        try {
          const data =
            JSON.parse(
              text
            );

          if (
            typeof data
              ?.message ===
              "string" &&
            data.message
          ) {
            message =
              data.message;
          }
        } catch {
          // mantém padrão
        }

        throw new Error(
          message
        );
      }

      const order: {
        id: number;
        publicAccessToken?: string;
      } =
        await orderResponse.json();

      const publicAccessToken =
        order.publicAccessToken;

      if (
        !publicAccessToken
      ) {
        throw new Error(
          "Pedido criado, mas o token de acesso não foi retornado."
        );
      }

      sessionStorage.setItem(
        `pizzasystem-order-token:${order.id}`,
        publicAccessToken
      );

      const encodedToken =
        encodeURIComponent(
          publicAccessToken
        );

      if (
        paymentMethod ===
        "PIX"
      ) {
        const pixResponse =
          await fetch(
            `${API_URL}/api/payments/${order.id}/pix?token=${encodedToken}`,
            {
              method:
                "POST",
            }
          );

        if (
          !pixResponse.ok
        ) {
          const text =
            await pixResponse.text();

          console.error(
            "Erro ao gerar Pix:",
            text
          );

          throw new Error(
            "Pedido criado, mas não foi possível gerar o Pix."
          );
        }

        localStorage.removeItem(
          cartKey
        );

        router.push(
          `/pagamento/${order.id}?token=${encodedToken}&store=${encodeURIComponent(
            storeSlug
          )}`
        );

        return;
      }

      if (
        paymentMethod ===
          "CREDIT_CARD" ||
        paymentMethod ===
          "DEBIT_CARD"
      ) {
        localStorage.removeItem(
          cartKey
        );

        router.push(
          `/pagamento/cartao/${order.id}?token=${encodedToken}&store=${encodeURIComponent(
            storeSlug
          )}`
        );

        return;
      }

      localStorage.removeItem(
        cartKey
      );

      router.push(
        `/pedido/${order.id}?token=${encodedToken}&store=${encodeURIComponent(
          storeSlug
        )}`
      );
    } catch (
      error
    ) {
      console.error(
        error
      );

      setCheckoutError(
        error instanceof
          Error
          ? error.message
          : "Não foi possível finalizar o pedido."
      );
    } finally {
      setSubmitting(
        false
      );
    }
  }

  // =========================
  // ESTADOS DE TELA
  // =========================

  if (
    storeResolved &&
    !storeSlug
  ) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-background px-4 py-16 text-foreground">

        <div className="mx-auto max-w-xl rounded-2xl bg-card p-8 text-center ring-1 ring-black/5">

          <h1 className="font-display text-3xl tracking-tight">
            Loja não informada
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Abra o checkout a partir do cardápio da loja.
          </p>

        </div>

      </main>
    );
  }

  if (
    !storeResolved ||
    !loaded
  ) {
    return (
      <main className="min-h-screen bg-background pb-16 text-foreground">

        <header className="border-b border-border bg-background/85 backdrop-blur-md">

          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="skeleton h-9 w-40 rounded-xl" />
            <div className="skeleton h-9 w-24 rounded-full" />
          </div>

        </header>

        <div className="mx-auto max-w-5xl px-3 py-5 sm:px-6 sm:py-8">

          <div className="skeleton h-4 w-28" />
          <div className="skeleton mt-3 h-12 w-72" />

          <div className="mt-7 grid gap-6 lg:grid-cols-5">

            <div className="space-y-6 lg:col-span-3">
              <div className="skeleton h-44 rounded-2xl" />
              <div className="skeleton h-72 rounded-2xl" />
              <div className="skeleton h-44 rounded-2xl" />
            </div>

            <div className="skeleton h-80 rounded-2xl lg:col-span-2" />

          </div>

        </div>

      </main>
    );
  }

  if (
    cart.length ===
    0
  ) {
    return (
      <main className="min-h-screen bg-background pb-16 text-foreground">

        <header className="border-b border-border bg-background/85 backdrop-blur-md">

          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/cardapio/${encodeURIComponent(
                    storeSlug
                  )}`
                )
              }
              className="flex items-center gap-2.5"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-display text-lg text-primary-foreground shadow-[0_2px_0_0] shadow-foreground/30">
                P
              </span>

              <span className="font-display text-2xl leading-none tracking-tight">
                PizzaSystem
                <span className="text-primary">
                  .
                </span>
              </span>
            </button>

          </div>

        </header>

        <div className="mx-auto max-w-5xl px-3 py-5 sm:px-6 sm:py-8">

          <span className="font-mono-brand text-xs uppercase tracking-[0.2em] text-muted-foreground">
            (b) Finalizar
          </span>

          <h1 className="mt-1 font-display text-3xl sm:text-4xl tracking-tight sm:text-5xl">
            Seu pedido
          </h1>

          <div className="mt-8 rounded-2xl bg-card p-8 text-center ring-1 ring-black/5">

            <p className="font-display text-2xl tracking-tight">
              Carrinho vazio
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Adicione itens do cardápio para continuar.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/cardapio/${encodeURIComponent(
                    storeSlug
                  )}`
                )
              }
              className="mt-5 inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-[0_4px_0_0] shadow-foreground/30 transition-transform active:scale-95"
            >
              Ver cardápio
            </button>

          </div>

        </div>

      </main>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-white/70 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground";

  const storeName =
    storeStatus?.storeName ||
    "PizzaSystem";

  const brandInitial =
    storeName
      .trim()
      .charAt(
        0
      )
      .toUpperCase() ||
    "P";

  return (
    <main className="min-h-screen bg-background pb-16 font-body text-foreground antialiased selection:bg-butter">

      {/* =========================
          HEADER
      ========================= */}

      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">

          <button
            type="button"
            onClick={() =>
              router.push(
                `/cardapio/${encodeURIComponent(
                  storeSlug
                )}`
              )
            }
            className="flex items-center gap-2.5"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-display text-lg text-primary-foreground shadow-[0_2px_0_0] shadow-foreground/30">
              {brandInitial}
            </span>

            <span className="font-display text-2xl leading-none tracking-tight">
              {storeName}
              <span className="text-primary">
                .
              </span>
            </span>

          </button>

          <nav className="flex items-center gap-3 text-sm font-medium text-muted-foreground sm:gap-5">

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/cardapio/${encodeURIComponent(
                    storeSlug
                  )}`
                )
              }
              className="hidden transition-colors hover:text-foreground sm:block"
            >
              Cardápio
            </button>

            <span className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-cream">
              {totalItems}{" "}
              {totalItems ===
              1
                ? "item"
                : "itens"}
            </span>

          </nav>

        </div>

      </header>

      <div className="mx-auto max-w-5xl px-3 py-5 sm:px-6 sm:py-8">

        <span className="font-mono-brand text-xs uppercase tracking-[0.2em] text-muted-foreground">
          (b) Finalizar
        </span>

        <h1 className="mt-1 font-display text-3xl sm:text-4xl tracking-tight sm:text-5xl">
          Seu pedido
        </h1>

        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Confira seus itens, informe a entrega e escolha a forma de pagamento.
        </p>

        {!storeStatus?.open && (
          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">

            <p className="font-bold text-primary">
              Pedidos encerrados no momento
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {storeStatus?.message ||
                "O estabelecimento não está recebendo novos pedidos."}
            </p>

          </div>
        )}

        {checkoutError && (
          <div
            role="alert"
            className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4"
          >

            <div>

              <p className="font-bold text-primary">
                Não foi possível continuar
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {checkoutError}
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setCheckoutError(
                  ""
                )
              }
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-card text-sm font-bold"
              aria-label="Fechar mensagem"
            >
              ×
            </button>

          </div>
        )}

        <form
          onSubmit={
            handleSubmit
          }
          className="mt-6 grid gap-6 lg:grid-cols-5"
        >

          {/* =========================
              ESQUERDA
          ========================= */}

          <div className="space-y-6 lg:col-span-3">

            {/* ITENS */}

            <section className="rounded-2xl bg-card p-4 ring-1 ring-black/5">

              <div className="flex items-end justify-between gap-4">

                <div>

                  <p className="font-mono-brand text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Carrinho
                  </p>

                  <h2 className="mt-1 font-display text-xl tracking-tight">
                    Itens
                  </h2>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/cardapio/${encodeURIComponent(
                        storeSlug
                      )}`
                    )
                  }
                  className="font-mono-brand text-[11px] uppercase tracking-wider text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
                >
                  Adicionar mais
                </button>

              </div>

              <ul className="mt-3 divide-y divide-border">

                {cart.map(
                  (
                    item,
                    itemIndex
                  ) => {

                    const unitPrice =
                      getItemUnitPrice(
                        item
                      );

                    return (
                      <li
                        key={`${item.product.id}-${item.crust?.id ?? "no-crust"}-${(
                          item.addons ??
                          []
                        )
                          .map(
                            (
                              addon
                            ) =>
                              addon.id
                          )
                          .sort(
                            (
                              a,
                              b
                            ) =>
                              a -
                              b
                          )
                          .join(
                            "-"
                          )}-${itemIndex}`}
                        className="py-3.5"
                      >

                        <div className="flex items-start gap-3">

                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-secondary sm:h-16 sm:w-16">

                            {item.product.imageUrl ? (
                              <img
                                src={
                                  item.product.imageUrl
                                }
                                alt={
                                  item.product.name
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center font-display text-xl text-muted-foreground">
                                {item.product.name
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()}
                              </div>
                            )}

                          </div>

                          <div className="min-w-0 flex-1">

                            <p className="font-semibold leading-tight">
                              {item.product.name}
                            </p>

                            {item.crust && (
                              <p className="mt-1 font-mono-brand text-[11px] text-muted-foreground">
                                Borda{" "}
                                {item.crust.name}
                                {" · + "}
                                {formatMoney(
                                  Number(
                                    item.crust.price
                                  )
                                )}
                              </p>
                            )}

                            {(item.addons ?? []).map(
                              (
                                addon
                              ) => (
                                <p
                                  key={
                                    addon.id
                                  }
                                  className="mt-1 font-mono-brand text-[11px] text-muted-foreground"
                                >
                                  {addon.name}
                                  {Number(
                                    addon.price
                                  ) >
                                  0
                                    ? ` · + ${formatMoney(
                                        Number(
                                          addon.price
                                        )
                                      )}`
                                    : " · Grátis"}
                                </p>
                              )
                            )}

                            <p className="mt-1 font-mono-brand text-xs text-muted-foreground">
                              {formatMoney(
                                unitPrice
                              )}{" "}
                              cada
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                removeItem(
                                  itemIndex
                                )
                              }
                              className="mt-1 font-mono-brand text-[11px] uppercase tracking-wider text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
                            >
                              Remover
                            </button>

                          </div>

                          <div className="flex items-center gap-2 rounded-full border border-border p-1">

                            <button
                              type="button"
                              aria-label={`Diminuir ${item.product.name}`}
                              onClick={() =>
                                setItemQuantity(
                                  itemIndex,
                                  item.quantity -
                                    1
                                )
                              }
                              className="grid h-7 w-7 place-items-center rounded-full bg-secondary text-sm font-bold active:scale-95"
                            >
                              −
                            </button>

                            <span className="w-5 text-center font-mono-brand text-sm">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              aria-label={`Aumentar ${item.product.name}`}
                              onClick={() =>
                                setItemQuantity(
                                  itemIndex,
                                  item.quantity +
                                    1
                                )
                              }
                              className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-sm font-bold text-cream active:scale-95"
                            >
                              +
                            </button>

                          </div>

                          <p className="hidden w-24 shrink-0 text-right font-display text-lg text-primary sm:block">
                            {formatMoney(
                              unitPrice *
                                item.quantity
                            )}
                          </p>

                        </div>

                        <label className="mt-2.5 block">

                          <span className="font-mono-brand text-[10px] uppercase tracking-wider text-muted-foreground">
                            Observação
                          </span>

                          <textarea
                            value={
                              item.observation
                            }
                            onChange={(
                              event
                            ) =>
                              updateObservation(
                                itemIndex,
                                event.target.value
                              )
                            }
                            placeholder="Ex: sem cebola"
                            rows={1}
                            className="mt-1.5 min-h-11 w-full resize-y rounded-xl border border-border bg-white/60 px-3 py-2.5 text-sm outline-none transition focus:border-foreground"
                          />

                        </label>

                      </li>
                    );
                  }
                )}

              </ul>

            </section>

            {/* ENTREGA */}

            <section className="rounded-2xl bg-card p-4 ring-1 ring-black/5">

              <h2 className="font-display text-xl tracking-tight">
                Entrega
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Informe seus dados e o endereço.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">

                <input
                  className={
                    inputClass
                  }
                  placeholder="Seu nome"
                  required
                  value={
                    customerName
                  }
                  onChange={(
                    event
                  ) =>
                    setCustomerName(
                      event.target.value
                    )
                  }
                />

                <input
                  className={
                    inputClass
                  }
                  placeholder="Telefone / WhatsApp"
                  required
                  value={
                    customerPhone
                  }
                  onChange={(
                    event
                  ) =>
                    setCustomerPhone(
                      event.target.value
                    )
                  }
                />

                <input
                  className={
                    inputClass
                  }
                  placeholder="Rua"
                  required
                  value={
                    street
                  }
                  onChange={(
                    event
                  ) =>
                    setStreet(
                      event.target.value
                    )
                  }
                />

                <input
                  className={
                    inputClass
                  }
                  placeholder="Número"
                  required
                  value={
                    number
                  }
                  onChange={(
                    event
                  ) =>
                    setNumber(
                      event.target.value
                    )
                  }
                />

                <input
                  className={
                    inputClass
                  }
                  placeholder="Cidade"
                  required
                  value={
                    city
                  }
                  onChange={(
                    event
                  ) =>
                    setCity(
                      event.target.value
                    )
                  }
                />

                <input
                  className={
                    inputClass
                  }
                  placeholder="Bairro"
                  required
                  value={
                    neighborhood
                  }
                  onChange={(
                    event
                  ) =>
                    setNeighborhood(
                      event.target.value
                    )
                  }
                />

                <input
                  className={
                    inputClass
                  }
                  placeholder="Complemento / referência"
                  value={
                    complement
                  }
                  onChange={(
                    event
                  ) =>
                    setComplement(
                      event.target.value
                    )
                  }
                />

              </div>

              <div className="mt-4 rounded-xl border border-border bg-background p-4">

                {deliveryQuoteLoading ? (
                  <p className="text-sm font-medium text-muted-foreground">
                    Calculando distância e taxa de entrega...
                  </p>

                ) : deliveryQuote ? (
                  <div>

                    <div className="flex flex-wrap items-start justify-between gap-3">

                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {deliveryQuote.pricingMode ===
                          "FIXED"
                            ? "Taxa de entrega do bairro"
                            : "Entrega calculada pela rota"}
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {deliveryQuote.pricingMode ===
                          "FIXED"
                            ? `${deliveryQuote.neighborhood}, ${deliveryQuote.city}`
                            : `${Number(
                                deliveryQuote.distanceKm
                              ).toLocaleString(
                                "pt-BR",
                                {
                                  maximumFractionDigits:
                                    2,
                                }
                              )} km × ${formatMoney(
                                Number(
                                  deliveryQuote.feePerKm
                                )
                              )}/km`}
                        </p>
                      </div>

                      <strong className="text-sm text-foreground">
                        {deliveryQuote.freeDelivery
                          ? "Frete grátis"
                          : formatMoney(
                              Number(
                                deliveryQuote.fee
                              )
                            )}
                      </strong>

                    </div>

                    {deliveryQuote.freeDelivery &&
                      deliveryQuote.freeDeliveryAbove !=
                        null && (
                        <p className="mt-2 text-xs font-semibold text-emerald-700">
                          Frete grátis liberado para pedidos a partir de{" "}
                          {formatMoney(
                            Number(
                              deliveryQuote.freeDeliveryAbove
                            )
                          )}.
                        </p>
                      )}

                    {deliveryQuote.googleMapsUrl && (
                      <a
                        href={
                          deliveryQuote.googleMapsUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex text-xs font-bold text-primary underline underline-offset-2"
                      >
                        Ver rota no Google Maps
                      </a>
                    )}

                  </div>

                ) : deliveryQuoteError ? (
                  <p className="text-sm font-medium text-primary">
                    {deliveryQuoteError}
                  </p>

                ) : (
                  <p className="text-sm text-muted-foreground">
                    Informe rua, número, cidade e bairro para calcular a rota automaticamente.
                  </p>
                )}

              </div>

            </section>

            {/* PAGAMENTO */}

            <section className="rounded-2xl bg-card p-4 ring-1 ring-black/5">

              <h2 className="font-display text-xl tracking-tight">
                Pagamento
              </h2>

              <div className="mt-3 flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod(
                      "PIX"
                    )
                  }
                  className={
                    paymentMethod ===
                    "PIX"
                      ? "rounded-full border-2 border-foreground bg-foreground px-4 py-2 text-sm font-medium text-cream transition-transform active:scale-95"
                      : "rounded-full border border-border bg-white/60 px-4 py-2 text-sm font-medium text-muted-foreground transition-transform hover:text-foreground active:scale-95"
                  }
                >
                  Pix
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod(
                      "CREDIT_CARD"
                    )
                  }
                  className={
                    paymentMethod ===
                    "CREDIT_CARD"
                      ? "rounded-full border-2 border-foreground bg-foreground px-4 py-2 text-sm font-medium text-cream transition-transform active:scale-95"
                      : "rounded-full border border-border bg-white/60 px-4 py-2 text-sm font-medium text-muted-foreground transition-transform hover:text-foreground active:scale-95"
                  }
                >
                  Cartão de crédito
                </button>

                <span className="cursor-not-allowed rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-muted-foreground opacity-60">
                  Débito indisponível
                </span>

              </div>

            </section>

          </div>

          {/* =========================
              RESUMO
          ========================= */}

          <aside className="lg:col-span-2">

            <div className="sticky top-24 rounded-2xl border-2 border-foreground bg-foreground p-5 text-cream shadow-[0_6px_0_0] shadow-primary/40">

              <p className="font-mono-brand text-[11px] uppercase tracking-wider text-cream/60">
                Resumo
              </p>

              <div className="mt-4 border-b border-cream/15 pb-4">

                <label className="font-mono-brand text-[10px] uppercase tracking-wider text-cream/60">
                  Cupom de desconto
                </label>

                <div className="mt-2 flex gap-2">

                  <input
                    type="text"
                    value={
                      couponInput
                    }
                    disabled={
                      couponLoading
                    }
                    onChange={(
                      event
                    ) => {
                      setCouponInput(
                        event.target.value.toUpperCase()
                      );

                      if (
                        appliedCoupon
                      ) {
                        setAppliedCoupon(
                          null
                        );

                        setCouponMessage(
                          ""
                        );
                      }

                      setCouponError(
                        ""
                      );
                    }}
                    placeholder="DESCONTO10"
                    className="min-w-0 flex-1 rounded-xl border border-cream/15 bg-white/10 px-3 py-2.5 text-sm font-bold uppercase text-cream outline-none placeholder:text-cream/30 focus:border-cream/40"
                  />

                  {!appliedCoupon ? (
                    <button
                      type="button"
                      onClick={
                        handleApplyCoupon
                      }
                      disabled={
                        couponLoading
                      }
                      className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
                    >
                      {couponLoading
                        ? "..."
                        : "Aplicar"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={
                        handleRemoveCoupon
                      }
                      className="rounded-xl border border-cream/20 px-3 py-2 text-xs font-bold"
                    >
                      Remover
                    </button>
                  )}

                </div>

                {couponMessage && (
                  <p className="mt-2 text-xs font-semibold text-butter">
                    {couponMessage}
                  </p>
                )}

                {couponError && (
                  <p className="mt-2 text-xs font-semibold text-primary">
                    {couponError}
                  </p>
                )}

              </div>

              <dl className="mt-4 space-y-2 text-sm">

                <div className="flex justify-between">

                  <dt className="text-cream/70">
                    Subtotal
                  </dt>

                  <dd className="font-mono-brand">
                    {formatMoney(
                      subtotal
                    )}
                  </dd>

                </div>

                <div className="flex justify-between">

                  <dt className="text-cream/70">
                    Entrega
                  </dt>

                  <dd className="text-right font-mono-brand">
                    {!street ||
                    !number ||
                    !city ||
                    !neighborhood
                      ? "—"
                      : deliveryQuoteLoading
                        ? "Calculando..."
                        : deliveryQuote
                          ? deliveryQuote.freeDelivery
                            ? "Grátis"
                            : formatMoney(
                                deliveryFee
                              )
                          : "—"}

                    {deliveryQuote &&
                      deliveryQuote.distanceKm !=
                        null && (
                        <span className="mt-0.5 block text-[10px] text-cream/45">
                          {Number(
                            deliveryQuote.distanceKm
                          ).toLocaleString(
                            "pt-BR",
                            {
                              maximumFractionDigits:
                                2,
                            }
                          )}{" "}
                          km
                        </span>
                      )}
                  </dd>

                </div>

                {appliedCoupon && (
                  <div className="flex justify-between">

                    <dt className="text-butter">
                      Cupom{" "}
                      {appliedCoupon.code}
                    </dt>

                    <dd className="font-mono-brand text-butter">
                      -{" "}
                      {formatMoney(
                        discountAmount
                      )}
                    </dd>

                  </div>
                )}

              </dl>

              <div className="mt-4 flex items-end justify-between border-t border-cream/20 pt-4">

                <span className="font-mono-brand text-[11px] uppercase tracking-wider text-cream/60">
                  Total
                </span>

                <span className="font-display text-3xl tracking-tight text-butter">
                  {formatMoney(
                    total
                  )}
                </span>

              </div>

              <button
                type="submit"
                disabled={
                  submitting ||
                  deliveryQuoteLoading ||
                  !street ||
                  !number ||
                  !city ||
                  !neighborhood ||
                  !deliveryQuote ||
                  !paymentMethod ||
                  !storeStatus?.open
                }
                className="mt-5 w-full rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting
                  ? paymentMethod ===
                    "PIX"
                    ? "Gerando Pix..."
                    : "Processando..."
                  : paymentMethod ===
                    "PIX"
                    ? "Gerar Pix e continuar"
                    : "Confirmar pedido"}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/cardapio/${encodeURIComponent(
                      storeSlug
                    )}`
                  )
                }
                className="mt-3 block w-full text-center font-mono-brand text-xs text-cream/60 transition-colors hover:text-cream"
              >
                Continuar comprando
              </button>

            </div>

          </aside>

        </form>

      </div>

    </main>
  );
}

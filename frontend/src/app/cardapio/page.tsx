"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

type Category = {
  id: number;
  name: string;
};

type Product = {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  price: number;
  available: boolean;
  allowCrust: boolean;
  category: Category;
};

type Crust = {
  id: number;
  name: string;
  price: number;
  active: boolean;
  sortOrder: number;
};

type CartItem = {
  product: Product;
  quantity: number;
  observation: string;
  crust: Crust | null;
};

type StoreStatus = {
  storeName: string;
  manualOpen: boolean;
  open: boolean;
  message: string;
};

type ToastState = {
  type: "success" | "warning" | "error";
  title: string;
  message: string;
} | null;

function formatMoney(value: number) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(value);
}

function ShoppingBagIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 8h12l1 13H5L6 8Z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </svg>
  );
}

function SearchIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function PlusIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MinusIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

function TrashIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="m7 7 1 13h8l1-13" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

function XIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function ArrowRightIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  );
}

function CheckIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export default function CardapioPage() {
  const router =
    useRouter();

  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    cart,
    setCart,
  ] = useState<CartItem[]>([]);

  const [
    storeStatus,
    setStoreStatus,
  ] = useState<StoreStatus | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    cartLoaded,
    setCartLoaded,
  ] = useState(false);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    activeCategoryId,
    setActiveCategoryId,
  ] = useState<number | "ALL">(
    "ALL"
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    cartOpen,
    setCartOpen,
  ] = useState(false);

  const [
    toast,
    setToast,
  ] = useState<ToastState>(
    null
  );

  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState<Product | null>(
    null
  );

  const [
    selectedQuantity,
    setSelectedQuantity,
  ] = useState(1);

  const [
    selectedObservation,
    setSelectedObservation,
  ] = useState("");

  const [
    crusts,
    setCrusts,
  ] = useState<Crust[]>([]);

  const [
    selectedCrust,
    setSelectedCrust,
  ] = useState<Crust | null>(null);

  // =========================
  // CARRINHO LOCAL
  // =========================

  useEffect(() => {
    const savedCart =
      localStorage.getItem(
        "pizzasystem-cart"
      );

    if (savedCart) {
      try {
        const parsedCart:
          CartItem[] =
          JSON.parse(
            savedCart
          );

        const normalizedCart =
          parsedCart.map(
            (item) => ({
              ...item,

              observation:
                item.observation ??
                "",
              crust:
                item.crust ??
                null,
            })
          );

        setCart(
          normalizedCart
        );

      } catch {
        localStorage.removeItem(
          "pizzasystem-cart"
        );
      }
    }

    setCartLoaded(
      true
    );
  }, []);

  // =========================
  // DADOS DO CARDÁPIO
  // =========================

  useEffect(() => {
    let mounted =
      true;

    async function loadData() {
      try {
        setLoadError("");

        const [
          productsResponse,
          statusResponse,
          crustsResponse,
        ] =
          await Promise.all([
            fetch(
              "http://localhost:8080/api/products/available",
              {
                cache:
                  "no-store",
              }
            ),

            fetch(
              "http://localhost:8080/api/store/status",
              {
                cache:
                  "no-store",
              }
            ),

            fetch(
              "http://localhost:8080/api/crusts/active",
              {
                cache:
                  "no-store",
              }
            ),
          ]);

        if (
          !productsResponse.ok
        ) {
          throw new Error(
            "Erro ao buscar produtos"
          );
        }

        if (
          !statusResponse.ok
        ) {
          throw new Error(
            "Erro ao buscar status da pizzaria"
          );
        }

        if (
          !crustsResponse.ok
        ) {
          throw new Error(
            "Erro ao buscar bordas"
          );
        }

        const productsData:
          Product[] =
          await productsResponse.json();

        const statusData:
          StoreStatus =
          await statusResponse.json();

        const crustsData:
          Crust[] =
          await crustsResponse.json();

        if (!mounted) {
          return;
        }

        setProducts(
          productsData
        );

        setStoreStatus(
          statusData
        );

        setCrusts(
          crustsData
        );

      } catch (error) {
        console.error(
          error
        );

        if (mounted) {
          setLoadError(
            "Não foi possível carregar o cardápio agora. Tente novamente em instantes."
          );
        }

      } finally {
        if (mounted) {
          setLoading(
            false
          );
        }
      }
    }

    loadData();

    const interval =
      setInterval(
        async () => {
          try {
            const response =
              await fetch(
                "http://localhost:8080/api/store/status",
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

          } catch (error) {
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

      clearInterval(
        interval
      );
    };
  }, []);

  // =========================
  // BLOQUEAR FUNDO DO DRAWER
  // =========================

  useEffect(() => {
    if (!cartOpen && !selectedProduct) {
      document.body.style.overflow =
        "";

      return;
    }

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [cartOpen, selectedProduct]);

  // =========================
  // TOAST
  // =========================

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout =
      setTimeout(
        () => {
          setToast(
            null
          );
        },
        3200
      );

    return () =>
      clearTimeout(
        timeout
      );
  }, [toast]);

  function showToast(
    nextToast:
      Exclude<
        ToastState,
        null
      >
  ) {
    setToast(
      nextToast
    );
  }

  // =========================
  // PRODUTO
  // =========================

  function openProduct(
    product: Product
  ) {
    setSelectedProduct(product);
    setSelectedQuantity(1);
    setSelectedObservation("");
    setSelectedCrust(null);
  }

  function closeProduct() {
    setSelectedProduct(null);
    setSelectedQuantity(1);
    setSelectedObservation("");
    setSelectedCrust(null);
  }

  function addSelectedProductToCart() {
    if (!selectedProduct) {
      return;
    }

    if (!storeStatus?.open) {
      showToast({
        type: "error",
        title: "Pedidos indisponíveis",
        message:
          storeStatus?.message ||
          "A pizzaria não está recebendo pedidos agora.",
      });

      return;
    }

    const crustForItem =
      selectedProduct.allowCrust
        ? selectedCrust
        : null;

    const existingIndex =
      cart.findIndex(
        (item) =>
          item.product.id ===
            selectedProduct.id &&
          (item.crust?.id ?? null) ===
            (crustForItem?.id ?? null) &&
          item.observation.trim() ===
            selectedObservation.trim()
      );

    let updatedCart: CartItem[];

    if (existingIndex >= 0) {
      updatedCart =
        cart.map(
          (item, index) =>
            index === existingIndex
              ? {
                  ...item,
                  quantity:
                    item.quantity +
                    selectedQuantity,
                }
              : item
        );
    } else {
      updatedCart = [
        ...cart,
        {
          product: selectedProduct,
          quantity: selectedQuantity,
          observation:
            selectedObservation.trim(),
          crust: crustForItem,
        },
      ];
    }

    saveCart(updatedCart);

    showToast({
      type: "success",
      title: "Adicionado ao pedido",
      message: `${selectedQuantity}x ${selectedProduct.name}${
        crustForItem
          ? ` · Borda ${crustForItem.name}`
          : ""
      }`,
    });

    closeProduct();
  }

  // =========================
  // CARRINHO
  // =========================

  function saveCart(
    updatedCart:
      CartItem[]
  ) {
    setCart(
      updatedCart
    );

    localStorage.setItem(
      "pizzasystem-cart",
      JSON.stringify(
        updatedCart
      )
    );
  }

  function addToCart(
    product: Product
  ) {
    const existingItem =
      cart.find(
        (item) =>
          item.product.id ===
          product.id
      );

    let updatedCart:
      CartItem[];

    if (existingItem) {
      updatedCart =
        cart.map(
          (item) =>
            item.product.id ===
            product.id
              ? {
                  ...item,

                  quantity:
                    item.quantity +
                    1,
                }
              : item
        );

    } else {
      updatedCart = [
        ...cart,
        {
          product,
          quantity: 1,
          observation: "",
          crust: null,
        },
      ];
    }

    saveCart(
      updatedCart
    );

    showToast({
      type: "success",
      title:
        "Adicionado ao pedido",
      message:
        product.name,
    });
  }

  function increaseQuantity(
    itemIndex: number
  ) {
    const updatedCart =
      cart.map(
        (item, index) =>
          index === itemIndex
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
            : item
      );

    saveCart(updatedCart);
  }

  function decreaseQuantity(
    itemIndex: number
  ) {
    const updatedCart =
      cart
        .map(
          (item, index) =>
            index === itemIndex
              ? {
                  ...item,
                  quantity:
                    item.quantity - 1,
                }
              : item
        )
        .filter(
          (item) =>
            item.quantity > 0
        );

    saveCart(updatedCart);
  }

  function removeFromCart(
    itemIndex: number
  ) {
    const item =
      cart[itemIndex];

    const updatedCart =
      cart.filter(
        (_, index) =>
          index !== itemIndex
      );

    saveCart(updatedCart);

    if (item) {
      showToast({
        type: "warning",
        title: "Item removido",
        message:
          item.product.name,
      });
    }
  }

  function updateObservation(
    itemIndex: number,
    observation: string
  ) {
    const updatedCart =
      cart.map(
        (item, index) =>
          index === itemIndex
            ? {
                ...item,
                observation,
              }
            : item
      );

    saveCart(updatedCart);
  }

  function continueOrder() {
    if (
      !storeStatus?.open
    ) {
      showToast({
        type: "error",
        title:
          "Pedidos indisponíveis",
        message:
          storeStatus?.message ||
          "A pizzaria não está recebendo pedidos agora.",
      });

      return;
    }

    if (
      cart.length ===
      0
    ) {
      showToast({
        type: "warning",
        title:
          "Seu pedido está vazio",
        message:
          "Adicione pelo menos um item para continuar.",
      });

      return;
    }

    localStorage.setItem(
      "pizzasystem-cart",
      JSON.stringify(
        cart
      )
    );

    router.push(
      "/checkout"
    );
  }

  // =========================
  // VALORES
  // =========================

  const totalItems =
    useMemo(
      () =>
        cart.reduce(
          (
            total,
            item
          ) =>
            total +
            item.quantity,
          0
        ),
      [cart]
    );

  const subtotal =
    useMemo(
      () =>
        cart.reduce(
          (
            total,
            item
          ) =>
            total +
            (
              Number(
                item.product.price
              ) +
              Number(
                item.crust?.price ?? 0
              )
            ) *
              item.quantity,
          0
        ),
      [cart]
    );

  const selectedUnitPrice =
    selectedProduct
      ? Number(
          selectedProduct.price
        ) +
        Number(
          selectedCrust?.price ?? 0
        )
      : 0;

  const categories =
    useMemo(
      () =>
        Array.from(
          new Map(
            products.map(
              (
                product
              ) => [
                product
                  .category
                  .id,
                product
                  .category,
              ]
            )
          ).values()
        ),
      [products]
    );

  const filteredProducts =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();

        return products.filter(
          (product) => {
            const matchesCategory =
              activeCategoryId ===
                "ALL" ||
              product.category.id ===
                activeCategoryId;

            if (
              !matchesCategory
            ) {
              return false;
            }

            if (
              !normalizedSearch
            ) {
              return true;
            }

            return [
              product.name,
              product.description,
              product.category.name,
            ]
              .join(" ")
              .toLowerCase()
              .includes(
                normalizedSearch
              );
          }
        );
      },
      [
        products,
        activeCategoryId,
        search,
      ]
    );

  // =========================
  // LOADING
  // =========================

  if (
    loading ||
    !cartLoaded
  ) {
    return (
      <main className="min-h-screen bg-background pb-28">

        <header className="border-b border-border bg-background">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <div className="skeleton h-10 w-40" />
            <div className="skeleton h-10 w-24 rounded-full" />
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <div className="skeleton h-7 w-36 rounded-full" />
              <div className="skeleton mt-5 h-16 w-4/5" />
              <div className="skeleton mt-3 h-16 w-3/5" />
              <div className="skeleton mt-6 h-5 w-full max-w-md" />
              <div className="skeleton mt-2 h-5 w-4/5 max-w-md" />
            </div>

            <div className="skeleton aspect-[4/3] w-full rounded-3xl" />
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({
              length: 6,
            }).map(
              (_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <div className="skeleton aspect-[4/3] w-full rounded-none" />

                  <div className="p-5">
                    <div className="skeleton h-6 w-2/3" />
                    <div className="skeleton mt-3 h-4 w-full" />
                    <div className="skeleton mt-2 h-4 w-4/5" />
                    <div className="skeleton mt-5 h-11 w-full rounded-full" />
                  </div>
                </div>
              )
            )}
          </div>

        </div>

      </main>
    );
  }

  const storeName =
    storeStatus?.storeName ||
    "PizzaSystem";

  const brandInitial =
    storeName
      .trim()
      .charAt(0)
      .toUpperCase() ||
    "P";

  // =========================
  // TELA
  // =========================

  return (
    <main className="min-h-screen bg-background pb-32 text-foreground">

      {/* =========================
          HEADER
          ========================= */}

      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">

          <button
            type="button"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior:
                  "smooth",
              })
            }
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary font-display text-xl text-primary-foreground shadow-[0_3px_0_0] shadow-foreground/20">
              {brandInitial}
            </span>

            <span className="min-w-0">
              <span className="block truncate font-display text-2xl leading-none tracking-tight sm:text-3xl">
                {storeName}
                <span className="text-primary">
                  .
                </span>
              </span>

              <span className="mt-1 hidden font-mono-brand text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:block">
                Pedidos online
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setCartOpen(
                true
              )
            }
            className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-bold text-cream transition-transform active:scale-95"
          >
            <ShoppingBagIcon className="h-4 w-4" />

            <span className="hidden sm:inline">
              Pedido
            </span>

            <span
              key={totalItems}
              className={`grid h-6 min-w-6 place-items-center rounded-full bg-primary px-1.5 font-mono-brand text-[11px] text-primary-foreground ${
                totalItems > 0
                  ? "animate-badge"
                  : ""
              }`}
            >
              {totalItems}
            </span>
          </button>

        </div>

        {/* CATEGORIAS */}

        <div className="border-t border-border">

          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2.5 sm:px-6 [scrollbar-width:none]">

            <button
              type="button"
              onClick={() =>
                setActiveCategoryId(
                  "ALL"
                )
              }
              className={
                activeCategoryId ===
                "ALL"
                  ? "shrink-0 rounded-full bg-chrome px-4 py-2 text-sm font-bold text-white shadow-[0_2px_0_0] shadow-chrome/30 transition-transform active:scale-95"
                  : "brand-chip shrink-0 px-4 py-2 text-sm font-semibold active:scale-95"
              }
            >
              Todos
            </button>

            {categories.map(
              (category) => (
                <button
                  key={
                    category.id
                  }
                  type="button"
                  onClick={() =>
                    setActiveCategoryId(
                      category.id
                    )
                  }
                  className={
                    activeCategoryId ===
                    category.id
                      ? "shrink-0 rounded-full bg-chrome px-4 py-2 text-sm font-bold text-white shadow-[0_2px_0_0] shadow-chrome/30 transition-transform active:scale-95"
                      : "brand-chip shrink-0 px-4 py-2 text-sm font-semibold active:scale-95"
                  }
                >
                  {category.name}
                </button>
              )
            )}

          </div>

        </div>

      </header>

      {/* =========================
          CONTEÚDO
          ========================= */}

      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* HERO */}

        <section className="grid items-center gap-7 py-7 md:grid-cols-12 md:py-10">

          <div className="animate-fade-up md:col-span-6">

            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono-brand text-xs font-bold uppercase tracking-wide ${
                storeStatus?.open
                  ? "bg-lime/20 text-foreground"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  storeStatus?.open
                    ? "bg-lime"
                    : "bg-primary"
                }`}
              />

              {storeStatus?.open
                ? "Recebendo pedidos"
                : "Pedidos encerrados"}
            </div>

            <h1 className="mt-4 font-display text-[clamp(3.2rem,7.5vw,6.25rem)] leading-[0.86] tracking-[-0.035em]">
              ESCOLHA.
              <br />
              PEÇA.
              <br />
              <span className="text-primary">
                APROVEITE.
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Escolha seus favoritos, monte seu pedido e acompanhe tudo pelo site.
            </p>

            {!storeStatus?.open && (
              <div className="mt-5 max-w-xl rounded-2xl border border-primary/20 bg-primary/5 p-4">

                <p className="font-bold text-primary">
                  A loja não está recebendo novos pedidos agora.
                </p>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {storeStatus?.message ||
                    "Você pode consultar o cardápio e voltar quando os pedidos forem liberados."}
                </p>

              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">

              <a
                href="#menu"
                className="brand-button min-h-12 rounded-full px-7"
              >
                Ver cardápio

                <ArrowRightIcon className="h-4 w-4" />
              </a>

              {totalItems > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setCartOpen(
                      true
                    )
                  }
                  className="min-h-12 rounded-full border-2 border-foreground bg-transparent px-6 font-bold transition-colors hover:bg-foreground hover:text-cream"
                >
                  Ver meu pedido
                </button>
              )}

            </div>

          </div>

          <div className="animate-fade-up relative md:col-span-6">

            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_18px_60px_-30px] shadow-foreground/35">

              <img
                src="/pizzasystem/hero.jpg"
                alt="Destaque do cardápio"
                className="aspect-[16/10] w-full object-cover"
              />

            </div>

            <div className="animate-floaty absolute -left-2 top-5 rounded-full bg-butter px-4 py-2 font-mono-brand text-xs font-bold shadow-[0_3px_0_0] shadow-foreground/15 sm:-left-4">
              CARDÁPIO ONLINE
            </div>

            <div className="absolute -bottom-3 right-4 rounded-full bg-foreground px-5 py-2.5 font-display text-lg tracking-wide text-cream shadow-[0_4px_0_0] shadow-primary/50">
              {storeStatus?.open
                ? "ABERTO"
                : "FECHADO"}
            </div>

          </div>

        </section>

        {/* =========================
            MENU
            ========================= */}

        <section
          id="menu"
          className="scroll-mt-32 pb-5 pt-2"
        >

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <p className="font-mono-brand text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                O cardápio
              </p>

              <h2 className="mt-1 font-display text-4xl tracking-tight sm:text-5xl">
                Escolha o seu
              </h2>

            </div>

            <div className="relative w-full lg:max-w-sm">

              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                type="search"
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Buscar no cardápio"
                className="h-12 w-full rounded-full border border-border bg-white/70 pl-11 pr-5 text-sm font-semibold outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />

            </div>

          </div>

          {loadError && (
            <div className="mt-7 rounded-2xl border border-primary/20 bg-primary/5 p-5">

              <p className="font-bold text-primary">
                Não foi possível carregar o cardápio
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {loadError}
              </p>

            </div>
          )}

          {!loadError &&
            filteredProducts.length ===
              0 && (
              <div className="mt-8 rounded-3xl border border-border bg-card p-10 text-center">

                <p className="font-display text-3xl">
                  Nenhum item encontrado
                </p>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Tente outra categoria ou altere sua busca.
                </p>

                {(search ||
                  activeCategoryId !==
                    "ALL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch(
                        ""
                      );

                      setActiveCategoryId(
                        "ALL"
                      );
                    }}
                    className="mt-5 rounded-full border-2 border-foreground px-5 py-2.5 text-sm font-bold transition-colors hover:bg-foreground hover:text-cream"
                  >
                    Limpar filtros
                  </button>
                )}

              </div>
            )}

          <div
            key={String(activeCategoryId)}
            className="mt-6 grid animate-fade-up gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >

            {filteredProducts.map(
              (
                product,
                index
              ) => {

                const cartItem =
                  cart.find(
                    (item) =>
                      item.product.id ===
                      product.id
                  );

                return (
                  <article
                    key={
                      product.id
                    }
                    className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[0_12px_35px_-28px] shadow-foreground/50 transition-transform duration-200 hover:-translate-y-1"
                    style={{
                      animationDelay:
                        `${Math.min(
                          index * 45,
                          270
                        )}ms`,
                    }}
                  >

                    <div className="relative overflow-hidden bg-secondary">

                      {product.imageUrl ? (
                        <img
                          src={
                            product.imageUrl
                          }
                          alt={
                            product.name
                          }
                          loading="lazy"
                          className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid aspect-[4/3] place-items-center bg-[radial-gradient(circle_at_top_left,var(--butter),transparent_55%),linear-gradient(135deg,var(--secondary),var(--background))]">

                          <div className="rounded-full border border-foreground/10 bg-white/65 px-4 py-2 font-mono-brand text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                            Sem foto
                          </div>

                        </div>
                      )}

                      <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1.5 font-mono-brand text-[10px] font-bold uppercase tracking-wider backdrop-blur">
                        {product.category.name}
                      </span>

                      {cartItem && (
                        <span className="absolute right-3 top-3 grid h-8 min-w-8 place-items-center rounded-full bg-primary px-2 font-mono-brand text-xs font-bold text-primary-foreground shadow-lg">
                          {cartItem.quantity}
                        </span>
                      )}

                    </div>

                    <div className="flex flex-1 flex-col p-5">

                      <div className="flex items-start justify-between gap-4">

                        <h3 className="font-display text-2xl leading-none tracking-tight">
                          {product.name}
                        </h3>

                        <p className="shrink-0 font-display text-[1.65rem] leading-none text-primary">
                          {formatMoney(
                            Number(
                              product.price
                            )
                          )}
                        </p>

                      </div>

                      <p className="mt-3 line-clamp-2 flex-1 text-sm leading-6 text-muted-foreground">
                        {product.description ||
                          "Confira este item do nosso cardápio."}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          openProduct(
                            product
                          )
                        }
                        disabled={
                          !storeStatus?.open
                        }
                        className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-foreground bg-foreground px-5 text-sm font-bold text-cream transition-all hover:bg-transparent hover:text-foreground active:scale-[0.98] disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary disabled:text-muted-foreground"
                      >
                        <PlusIcon className="h-4 w-4" />

                        {storeStatus?.open
                          ? "Ver opções"
                          : "Indisponível agora"}
                      </button>

                    </div>

                  </article>
                );
              }
            )}

          </div>

        </section>

      </div>

      {/* =========================
          FOOTER
          ========================= */}

      <footer className="mt-16 border-t border-border pb-28 pt-10">

        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6">

          <div>

            <p className="font-display text-3xl tracking-tight">
              {storeName}
              <span className="text-primary">
                .
              </span>
            </p>

            <p className="mt-1 font-mono-brand text-xs uppercase tracking-[0.15em] text-muted-foreground">
              Pedidos online
            </p>

          </div>

          <a
            href="#menu"
            className="font-mono-brand text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Voltar ao cardápio
          </a>

        </div>

      </footer>

      {/* =========================
          BARRA FIXA DO PEDIDO
          ========================= */}

      {totalItems > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 animate-fade-up">

          <div className="flex items-center gap-3 rounded-2xl border-2 border-foreground bg-foreground p-2.5 pl-4 text-cream shadow-[0_7px_0_0] shadow-primary/40">

            <ShoppingBagIcon className="hidden h-6 w-6 shrink-0 text-butter sm:block" />

            <div className="min-w-0 flex-1 leading-tight">

              <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.15em] text-cream/60">
                Seu pedido
              </p>

              <p className="truncate font-display text-lg tracking-tight sm:text-xl">
                {totalItems}{" "}
                {totalItems === 1
                  ? "item"
                  : "itens"}{" "}
                <span className="text-butter">
                  ·{" "}
                  {formatMoney(
                    subtotal
                  )}
                </span>
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setCartOpen(
                  true
                )
              }
              className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-transform active:scale-95 sm:px-6"
            >
              Ver pedido
            </button>

          </div>

        </div>
      )}

      {/* =========================
          MODAL DO PRODUTO
          ========================= */}

      {selectedProduct && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Fechar produto"
            onClick={closeProduct}
            className="absolute inset-0 bg-foreground/50 backdrop-blur-[3px]"
          />

          <div className="animate-slide-up absolute bottom-0 left-1/2 flex max-h-[94vh] w-full max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-t-[2rem] bg-background shadow-2xl md:bottom-auto md:top-1/2 md:max-h-[86vh] md:-translate-y-1/2 md:rounded-[2rem]">
            {selectedProduct.imageUrl ? (
              <div className="relative h-[190px] shrink-0 overflow-hidden bg-secondary sm:h-[220px]">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="h-full w-full object-cover"
                />

                <button
                  type="button"
                  aria-label="Fechar"
                  onClick={closeProduct}
                  className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-background/90 shadow-lg backdrop-blur transition-transform hover:scale-105"
                >
                  <XIcon />
                </button>

                <span className="absolute bottom-4 left-4 rounded-full bg-background/90 px-3 py-1.5 font-mono-brand text-[10px] font-bold uppercase tracking-wider backdrop-blur">
                  {selectedProduct.category.name}
                </span>
              </div>
            ) : (
              <div className="relative shrink-0 border-b border-border bg-[linear-gradient(110deg,var(--butter),var(--background)_72%)] px-5 py-4 sm:px-7">
                <span className="inline-flex rounded-full border border-foreground/10 bg-background/75 px-3 py-1.5 font-mono-brand text-[10px] font-bold uppercase tracking-wider">
                  {selectedProduct.category.name}
                </span>

                <button
                  type="button"
                  aria-label="Fechar"
                  onClick={closeProduct}
                  className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background/90 shadow-md transition-transform hover:scale-105"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Monte seu item
                  </p>

                  <h2 className="mt-1 font-display text-4xl leading-none tracking-tight sm:text-5xl">
                    {selectedProduct.name}
                  </h2>
                </div>

                <p className="shrink-0 font-display text-3xl leading-none text-primary">
                  {formatMoney(
                    Number(selectedProduct.price)
                  )}
                </p>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
                {selectedProduct.description ||
                  "Confira este item do nosso cardápio."}
              </p>

              <div className="mt-6 border-t border-border pt-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                      Quantidade
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Quantos você quer?
                    </p>
                  </div>

                  <div className="flex items-center gap-2 rounded-full border border-border bg-card p-1.5">
                    <button
                      type="button"
                      aria-label="Diminuir quantidade"
                      onClick={() =>
                        setSelectedQuantity(
                          (quantity) =>
                            Math.max(
                              1,
                              quantity - 1
                            )
                        )
                      }
                      className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-secondary"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>

                    <span className="min-w-8 text-center font-mono-brand text-sm font-bold">
                      {selectedQuantity}
                    </span>

                    <button
                      type="button"
                      aria-label="Aumentar quantidade"
                      onClick={() =>
                        setSelectedQuantity(
                          (quantity) =>
                            quantity + 1
                        )
                      }
                      className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-secondary"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="selected-product-observation"
                  className="mb-2 block font-mono-brand text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground"
                >
                  Alguma observação?
                </label>

                <textarea
                  id="selected-product-observation"
                  value={selectedObservation}
                  onChange={(event) =>
                    setSelectedObservation(
                      event.target.value
                    )
                  }
                  placeholder="Ex: sem cebola, bem passado..."
                  rows={3}
                  maxLength={250}
                  className="w-full resize-none rounded-2xl border border-border bg-card p-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                />

                <p className="mt-2 text-right font-mono-brand text-[10px] text-muted-foreground">
                  {selectedObservation.length}/250
                </p>
              </div>

              {selectedProduct.allowCrust && (
                <div className="mt-6 border-t border-border pt-6">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                        Borda recheada
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Escolha uma opção para sua pizza.
                      </p>
                    </div>

                    {selectedCrust && (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCrust(null)
                        }
                        className="text-xs font-bold text-primary"
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  <div className="mt-4 grid gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCrust(null)
                      }
                      className={`flex min-h-14 items-center justify-between rounded-2xl border px-4 text-left transition ${
                        selectedCrust === null
                          ? "border-foreground bg-foreground text-cream"
                          : "border-border bg-card hover:border-foreground/30"
                      }`}
                    >
                      <span className="font-bold">
                        Sem borda
                      </span>
                      {selectedCrust === null && (
                        <CheckIcon className="h-4 w-4" />
                      )}
                    </button>

                    {crusts.map(
                      (crust) => (
                        <button
                          key={crust.id}
                          type="button"
                          onClick={() =>
                            setSelectedCrust(crust)
                          }
                          className={`flex min-h-14 items-center justify-between gap-4 rounded-2xl border px-4 text-left transition ${
                            selectedCrust?.id ===
                            crust.id
                              ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                              : "border-border bg-card hover:border-foreground/30"
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span
                              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                                selectedCrust?.id ===
                                crust.id
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border"
                              }`}
                            >
                              {selectedCrust?.id ===
                                crust.id && (
                                <CheckIcon className="h-3.5 w-3.5" />
                              )}
                            </span>

                            <span className="truncate font-bold">
                              {crust.name}
                            </span>
                          </span>

                          <span className="shrink-0 text-sm font-bold text-primary">
                            + {formatMoney(
                              Number(crust.price)
                            )}
                          </span>
                        </button>
                      )
                    )}
                  </div>

                  {crusts.length === 0 && (
                    <p className="mt-3 rounded-xl bg-secondary p-3 text-sm text-muted-foreground">
                      Nenhuma borda está disponível no momento.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-border bg-background px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={addSelectedProductToCart}
                disabled={!storeStatus?.open}
                className="brand-button min-h-14 w-full rounded-2xl px-5 text-base disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PlusIcon className="h-5 w-5" />

                {storeStatus?.open
                  ? `Adicionar ao pedido · ${formatMoney(
                      selectedUnitPrice *
                        selectedQuantity
                    )}`
                  : "Pedidos encerrados"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          DRAWER DO CARRINHO
          ========================= */}

      {cartOpen && (
        <div className="fixed inset-0 z-50">

          <button
            type="button"
            aria-label="Fechar pedido"
            onClick={() =>
              setCartOpen(
                false
              )
            }
            className="absolute inset-0 bg-foreground/45 backdrop-blur-[2px]"
          />

          <aside className="animate-slide-up absolute bottom-0 right-0 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[2rem] bg-background shadow-2xl md:bottom-auto md:top-0 md:h-full md:max-h-none md:max-w-md md:rounded-none md:rounded-l-[2rem]">

            <div className="flex items-center justify-between border-b border-border px-5 py-5 sm:px-6">

              <div>

                <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Seu pedido
                </p>

                <h2 className="mt-1 font-display text-3xl">
                  {totalItems}{" "}
                  {totalItems === 1
                    ? "item"
                    : "itens"}
                </h2>

              </div>

              <button
                type="button"
                aria-label="Fechar"
                onClick={() =>
                  setCartOpen(
                    false
                  )
                }
                className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card transition-colors hover:bg-secondary"
              >
                <XIcon />
              </button>

            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">

              {cart.length ===
              0 ? (
                <div className="grid min-h-64 place-items-center text-center">

                  <div>

                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
                      <ShoppingBagIcon className="h-6 w-6" />
                    </div>

                    <p className="mt-4 font-display text-2xl">
                      Seu pedido está vazio
                    </p>

                    <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                      Adicione itens do cardápio para começar.
                    </p>

                  </div>

                </div>

              ) : (
                <div className="space-y-4">

                  {cart.map(
                    (item, itemIndex) => (
                      <article
                        key={`${item.product.id}-${item.crust?.id ?? "no-crust"}-${itemIndex}`}
                        className="rounded-2xl border border-border bg-card p-4"
                      >

                        <div className="flex gap-4">

                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary">

                            {item.product.imageUrl ? (
                              <img
                                src={
                                  item.product.imageUrl
                                }
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-[linear-gradient(135deg,var(--butter),var(--secondary))]" />
                            )}

                          </div>

                          <div className="min-w-0 flex-1">

                            <div className="flex items-start justify-between gap-3">

                              <div className="min-w-0">

                                <h3 className="truncate font-display text-xl">
                                  {item.product.name}
                                </h3>

                                {item.crust && (
                                  <p className="mt-1 text-xs font-semibold text-muted-foreground">
                                    Borda: {item.crust.name} · + {formatMoney(
                                      Number(item.crust.price)
                                    )}
                                  </p>
                                )}

                                <p className="mt-1 text-sm font-bold text-primary">
                                  {formatMoney(
                                    (
                                      Number(
                                        item.product.price
                                      ) +
                                      Number(
                                        item.crust?.price ?? 0
                                      )
                                    ) *
                                      item.quantity
                                  )}
                                </p>

                              </div>

                              <button
                                type="button"
                                aria-label={`Remover ${item.product.name}`}
                                onClick={() =>
                                  removeFromCart(
                                    itemIndex
                                  )
                                }
                                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>

                            </div>

                            <div className="mt-4 flex items-center gap-2">

                              <button
                                type="button"
                                aria-label={`Diminuir quantidade de ${item.product.name}`}
                                onClick={() =>
                                  decreaseQuantity(
                                    itemIndex
                                  )
                                }
                                className="grid h-9 w-9 place-items-center rounded-full border border-border transition-colors hover:bg-secondary"
                              >
                                <MinusIcon className="h-4 w-4" />
                              </button>

                              <span className="min-w-8 text-center font-mono-brand text-sm font-bold">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                aria-label={`Aumentar quantidade de ${item.product.name}`}
                                onClick={() =>
                                  increaseQuantity(
                                    itemIndex
                                  )
                                }
                                className="grid h-9 w-9 place-items-center rounded-full border border-border transition-colors hover:bg-secondary"
                              >
                                <PlusIcon className="h-4 w-4" />
                              </button>

                            </div>

                          </div>

                        </div>

                        <div className="mt-4">

                          <label
                            htmlFor={`observation-${item.product.id}`}
                            className="mb-2 block font-mono-brand text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground"
                          >
                            Observação
                          </label>

                          <textarea
                            id={`observation-${item.product.id}`}
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
                            rows={2}
                            className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                          />

                        </div>

                      </article>
                    )
                  )}

                </div>
              )}

            </div>

            <div className="border-t border-border bg-background px-5 py-5 sm:px-6">

              <div className="flex items-end justify-between gap-4">

                <div>

                  <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Subtotal
                  </p>

                  <p className="mt-1 font-display text-3xl text-primary">
                    {formatMoney(
                      subtotal
                    )}
                  </p>

                </div>

                <p className="max-w-36 text-right text-xs leading-5 text-muted-foreground">
                  A entrega será calculada no checkout.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  continueOrder
                }
                disabled={
                  cart.length ===
                    0 ||
                  !storeStatus?.open
                }
                className="brand-button mt-5 min-h-13 w-full rounded-xl px-5"
              >
                {storeStatus?.open
                  ? "Continuar para checkout"
                  : "Pedidos encerrados"}

                {storeStatus?.open && (
                  <ArrowRightIcon className="h-4 w-4" />
                )}
              </button>

            </div>

          </aside>

        </div>
      )}

      {/* =========================
          TOAST
          ========================= */}

      {toast && (
        <div className="fixed left-1/2 top-5 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-slide-up">

          <div
            className={`flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-xl ${
              toast.type ===
              "error"
                ? "border-primary/25"
                : "border-border"
            }`}
          >

            <div
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                toast.type ===
                "success"
                  ? "bg-lime/20 text-foreground"
                  : toast.type ===
                      "error"
                    ? "bg-primary/10 text-primary"
                    : "bg-butter/40 text-foreground"
              }`}
            >
              {toast.type ===
              "success" ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <span className="font-display text-lg leading-none">
                  !
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">

              <p className="font-bold">
                {toast.title}
              </p>

              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {toast.message}
              </p>

            </div>

            <button
              type="button"
              aria-label="Fechar mensagem"
              onClick={() =>
                setToast(
                  null
                )
              }
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <XIcon className="h-4 w-4" />
            </button>

          </div>

        </div>
      )}

    </main>
  );
}

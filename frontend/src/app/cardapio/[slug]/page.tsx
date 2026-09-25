"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { setBrowserIcon } from "@/lib/browserIcon";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageProvider";

import ProductAddonSelector, {
  getSelectedAddonsPrice,
  validateAddonSelections,
  type ProductAddon,
  type ProductAddonGroup,
} from "@/components/ProductAddonSelector";

const API_URL = "";

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
  addonGroups?: ProductAddonGroup[];
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
  addons: ProductAddon[];
};

type StoreProfile = {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  headline: string | null;
  marqueeMessage: string | null;
  marqueeEnabled: boolean;
  heroTitleLine1: string | null;
  heroTitleLine2: string | null;
  heroTitleLine3: string | null;
  heroDescription: string | null;
  heroPrimaryButtonText: string | null;
  heroSecondaryButtonText: string | null;
  heroBadgeText: string | null;
  heroOpenStatusText: string | null;
  heroClosedStatusText: string | null;
  menuTitle: string | null;
  menuSubtitle: string | null;
  menuSearchPlaceholder: string | null;
  menuEmptyTitle: string | null;
  menuEmptyDescription: string | null;
  footerTagline: string | null;
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

type CustomerSession = {
  authenticated: boolean;
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  profileImageUrl?: string | null;
  emailVerified?: boolean;
  googleConnected?: boolean;
};

function resolveStoreImageUrl(
  value: string | null | undefined
) {
  if (!value) return "";

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  return `${API_URL}${value.startsWith("/") ? "" : "/"}${value}`;
}

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

function addonIdsKey(
  addons: ProductAddon[]
) {
  return addons
    .map((addon) => addon.id)
    .sort((a, b) => a - b)
    .join("-");
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

function AccountIcon({
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
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

export default function CardapioPage() {
  const router =
    useRouter();

  const {
    locale,
    text,
  } =
    useLanguage();

  const params =
    useParams<{
      slug: string;
    }>();

  const storeSlug =
    params.slug;

  const cartKey =
    `pizzasystem-cart:${storeSlug}`;

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
    storeProfile,
    setStoreProfile,
  ] = useState<StoreProfile | null>(
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
    selectedAddonIds,
    setSelectedAddonIds,
  ] = useState<number[]>([]);

  const [
    crusts,
    setCrusts,
  ] = useState<Crust[]>([]);

  const [
    selectedCrust,
    setSelectedCrust,
  ] = useState<Crust | null>(
    null
  );

  const [
    customer,
    setCustomer,
  ] = useState<CustomerSession | null>(
    null
  );

  const [
    customerSessionLoaded,
    setCustomerSessionLoaded,
  ] = useState(false);

  useEffect(() => {
    if (!storeProfile) {
      return;
    }

    setBrowserIcon(
      resolveStoreImageUrl(
        storeProfile.logoUrl
      )
    );

    document.title =
      `${storeProfile.name} | PizzaSystem`;

  }, [
    storeProfile,
  ]);

  // =========================
  // SESSÃO DO CLIENTE
  // =========================

  useEffect(() => {
    let mounted =
      true;

    async function loadCustomerSession() {
      try {
        const response =
          await fetch(
            `${API_URL}/api/customer-auth/me`,
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          );

        if (!mounted) {
          return;
        }

        if (!response.ok) {
          setCustomer(null);
          return;
        }

        const data:
          CustomerSession =
          await response.json();

        setCustomer(
          data?.authenticated
            ? data
            : null
        );
      } catch (error) {
        console.error(
          "Erro ao verificar conta do cliente:",
          error
        );

        if (mounted) {
          setCustomer(null);
        }
      } finally {
        if (mounted) {
          setCustomerSessionLoaded(
            true
          );
        }
      }
    }

    void loadCustomerSession();

    return () => {
      mounted =
        false;
    };
  }, []);

  // =========================
  // CARRINHO LOCAL
  // =========================

  useEffect(() => {
    const savedCart =
      localStorage.getItem(
        cartKey
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

              addons:
                Array.isArray(
                  item.addons
                )
                  ? item.addons
                  : [],
            })
          );

        setCart(
          normalizedCart
        );
      } catch {
        localStorage.removeItem(
          cartKey
        );
      }
    }

    setCartLoaded(
      true
    );
  }, [cartKey]);

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
          profileResponse,
        ] =
          await Promise.all([
            fetch(
              `${API_URL}/api/products/available?store=${encodeURIComponent(
                storeSlug
              )}`,
              {
                cache:
                  "no-store",
              }
            ),

            fetch(
              `${API_URL}/api/store/status?store=${encodeURIComponent(
                storeSlug
              )}`,
              {
                cache:
                  "no-store",
              }
            ),

            fetch(
              `${API_URL}/api/crusts/active?store=${encodeURIComponent(
                storeSlug
              )}`,
              {
                cache:
                  "no-store",
              }
            ),

            fetch(
              `${API_URL}/api/store/profile?store=${encodeURIComponent(
                storeSlug
              )}`,
              {
                cache:
                  "no-store",
              }
            ),
          ]);

        if (!productsResponse.ok) {
          throw new Error(
            "Erro ao buscar produtos"
          );
        }

        if (!statusResponse.ok) {
          throw new Error(
            "Erro ao buscar status do estabelecimento"
          );
        }

        if (!crustsResponse.ok) {
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

        const profileData:
          StoreProfile | null =
          profileResponse.ok
            ? await profileResponse.json()
            : null;

        if (!mounted) {
          return;
        }

        setProducts(
          productsData.map(
            (product) => ({
              ...product,
              addonGroups:
                product.addonGroups ??
                [],
            })
          )
        );

        setStoreStatus(
          statusData
        );

        setCrusts(
          crustsData
        );

        setStoreProfile(
          profileData
        );
      } catch (error) {
        console.error(
          error
        );

        if (mounted) {
          setLoadError(
            text("Não foi possível carregar o cardápio agora. Tente novamente em instantes.", "We could not load the menu right now. Please try again shortly.")
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

            if (!response.ok) {
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

      window.clearInterval(
        interval
      );
    };
  }, [storeSlug]);

  // =========================
  // BLOQUEAR FUNDO
  // =========================

  useEffect(() => {
    if (
      !cartOpen &&
      !selectedProduct
    ) {
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
  }, [
    cartOpen,
    selectedProduct,
  ]);

  // =========================
  // TOAST
  // =========================

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout =
      window.setTimeout(
        () => {
          setToast(
            null
          );
        },
        3200
      );

    return () =>
      window.clearTimeout(
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
    setSelectedProduct(
      product
    );

    setSelectedQuantity(
      1
    );

    setSelectedObservation(
      ""
    );

    setSelectedCrust(
      null
    );

    setSelectedAddonIds(
      []
    );
  }

  function closeProduct() {
    setSelectedProduct(
      null
    );

    setSelectedQuantity(
      1
    );

    setSelectedObservation(
      ""
    );

    setSelectedCrust(
      null
    );

    setSelectedAddonIds(
      []
    );
  }

  const selectedAddons =
    useMemo(() => {
      if (!selectedProduct) {
        return [];
      }

      const selected =
        new Set(
          selectedAddonIds
        );

      return (
        selectedProduct
          .addonGroups ??
        []
      )
        .flatMap(
          (group) =>
            group.addons ??
            []
        )
        .filter(
          (addon) =>
            addon.active &&
            selected.has(
              addon.id
            )
        );
    }, [
      selectedProduct,
      selectedAddonIds,
    ]);

  function addSelectedProductToCart() {
    if (!selectedProduct) {
      return;
    }

    if (!storeStatus?.open) {
      showToast({
        type: "error",
        title: text("Pedidos indisponíveis", "Ordering unavailable"),
        message:
          storeStatus?.message ||
          text("O estabelecimento não está recebendo pedidos agora.", "This store is not accepting orders right now."),
      });

      return;
    }

    const addonValidation =
      validateAddonSelections(
        selectedProduct
          .addonGroups ??
          [],
        selectedAddonIds,
        locale
      );

    if (!addonValidation.valid) {
      showToast({
        type: "warning",
        title: text("Complete suas escolhas", "Complete your selections"),
        message:
          addonValidation.message,
      });

      return;
    }

    const crustForItem =
      selectedProduct.allowCrust
        ? selectedCrust
        : null;

    const selectedAddonKey =
      addonIdsKey(
        selectedAddons
      );

    const existingIndex =
      cart.findIndex(
        (item) =>
          item.product.id ===
            selectedProduct.id &&
          (item.crust?.id ?? null) ===
            (crustForItem?.id ?? null) &&
          addonIdsKey(
            item.addons ??
              []
          ) ===
            selectedAddonKey &&
          item.observation.trim() ===
            selectedObservation.trim()
      );

    let updatedCart:
      CartItem[];

    if (existingIndex >= 0) {
      updatedCart =
        cart.map(
          (item, index) =>
            index ===
            existingIndex
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
          product:
            selectedProduct,

          quantity:
            selectedQuantity,

          observation:
            selectedObservation
              .trim(),

          crust:
            crustForItem,

          addons:
            selectedAddons,
        },
      ];
    }

    saveCart(
      updatedCart
    );

    showToast({
      type: "success",
      title:
        text("Adicionado ao pedido", "Added to your order"),
      message:
        `${selectedQuantity}x ${selectedProduct.name}`,
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
      cartKey,
      JSON.stringify(
        updatedCart
      )
    );
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
                  item.quantity +
                  1,
              }
            : item
      );

    saveCart(
      updatedCart
    );
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
                    item.quantity -
                    1,
                }
              : item
        )
        .filter(
          (item) =>
            item.quantity >
            0
        );

    saveCart(
      updatedCart
    );
  }

  function removeFromCart(
    itemIndex: number
  ) {
    const item =
      cart[
        itemIndex
      ];

    const updatedCart =
      cart.filter(
        (_, index) =>
          index !==
          itemIndex
      );

    saveCart(
      updatedCart
    );

    if (item) {
      showToast({
        type: "warning",
        title:
          text("Item removido", "Item removed"),
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

    saveCart(
      updatedCart
    );
  }

  function continueOrder() {
    if (!storeStatus?.open) {
      showToast({
        type: "error",
        title:
          text("Pedidos indisponíveis", "Ordering unavailable"),
        message:
          storeStatus?.message ||
          text("O estabelecimento não está recebendo pedidos agora.", "This store is not accepting orders right now."),
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
          text("Seu pedido está vazio", "Your order is empty"),
        message:
          text("Adicione pelo menos um item para continuar.", "Add at least one item to continue."),
      });

      return;
    }

    localStorage.setItem(
      cartKey,
      JSON.stringify(
        cart
      )
    );

    router.push(
      `/checkout?store=${encodeURIComponent(
        storeSlug
      )}`
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
          ) => {
            const addonsPrice =
              (
                item.addons ??
                []
              ).reduce(
                (
                  addonTotal,
                  addon
                ) =>
                  addonTotal +
                  Number(
                    addon.price
                  ),
                0
              );

            return (
              total +
              (
                Number(
                  item.product
                    .price
                ) +
                Number(
                  item.crust
                    ?.price ??
                    0
                ) +
                addonsPrice
              ) *
                item.quantity
            );
          },
          0
        ),
      [cart]
    );

  const selectedAddonsPrice =
    selectedProduct
      ? getSelectedAddonsPrice(
          selectedProduct
            .addonGroups ??
            [],
          selectedAddonIds
        )
      : 0;

  const selectedUnitPrice =
    selectedProduct
      ? Number(
          selectedProduct
            .price
        ) +
        Number(
          selectedCrust
            ?.price ??
            0
        ) +
        selectedAddonsPrice
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

            if (!matchesCategory) {
              return false;
            }

            if (!normalizedSearch) {
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
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <div className="skeleton h-10 w-40" />
            <div className="skeleton h-10 w-24 rounded-full" />
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">

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
    storeProfile?.name ||
    storeStatus?.storeName ||
    "PizzaSystem";

  const primaryColor =
    storeProfile?.primaryColor ||
    "#E63946";

  const secondaryColor =
    storeProfile?.secondaryColor ||
    "#F4C95D";

  const logoUrl =
    resolveStoreImageUrl(
      storeProfile?.logoUrl
    );

  const coverImageUrl =
    resolveStoreImageUrl(
      storeProfile?.coverImageUrl
    ) ||
    "/pizzasystem/hero.jpg";

  const brandInitial =
    storeName
      .trim()
      .charAt(0)
      .toUpperCase() ||
    "P";

  const customerFirstName =
    customer?.name
      ?.trim()
      .split(/\s+/)[0] ||
    "";

  const customerInitial =
    customerFirstName
      .charAt(0)
      .toUpperCase() ||
    "?";

  return (
    <main
      className="min-h-screen bg-background pb-32 text-foreground"
      style={{
        "--primary":
          primaryColor,

        "--secondary":
          secondaryColor,
      } as CSSProperties}
    >

      {/* =========================
          HEADER
      ========================= */}

      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">

        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3">

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

            {logoUrl ? (
              <span className="flex h-9 w-14 shrink-0 items-center justify-center sm:h-14 sm:w-24">
                <img
                  src={
                    logoUrl
                  }
                  alt={`Logo ${storeName}`}
                  className="h-full w-full object-contain"
                />
              </span>
            ) : (
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary font-display text-xl text-primary-foreground shadow-[0_3px_0_0] shadow-foreground/20">
                {brandInitial}
              </span>
            )}

            <span className="min-w-0">

              <span className="block max-w-[34vw] truncate font-display text-lg leading-none tracking-tight min-[390px]:max-w-[42vw] min-[390px]:text-xl sm:max-w-none sm:text-3xl">
                {storeName}
                <span className="text-primary">
                  .
                </span>
              </span>

              <span className="mt-1 hidden font-mono-brand text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:block">
                {storeProfile?.footerTagline ||
                  text("Pedidos online", "Online ordering")}
              </span>

            </span>

          </button>

          <div className="flex shrink-0 items-center gap-2">

            <LanguageSwitcher />

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/conta?store=${encodeURIComponent(
                    storeSlug
                  )}`
                )
              }
              className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-xs font-bold transition-colors hover:border-foreground/30 hover:bg-secondary sm:min-h-10 sm:gap-2 sm:px-4 sm:text-sm"
              aria-label={
                customer
                  ? text("Abrir minha conta", "Open my account")
                  : text("Entrar ou criar conta", "Sign in or create account")
              }
            >

              {customer?.profileImageUrl ? (
                <img
                  src={
                    customer.profileImageUrl
                  }
                  alt=""
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : customer ? (
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary font-mono-brand text-[10px] font-bold text-primary-foreground">
                  {customerInitial}
                </span>
              ) : (
                <AccountIcon className="h-4 w-4" />
              )}

              <span className="hidden max-w-24 truncate sm:inline">
                {!customerSessionLoaded
                  ? text("Conta", "Account")
                  : customer
                    ? customerFirstName
                    : text("Entrar", "Sign in")}
              </span>

            </button>

            <button
              type="button"
              onClick={() =>
                setCartOpen(
                  true
                )
              }
              className="flex h-9 items-center gap-1.5 rounded-full bg-foreground px-2.5 text-xs font-bold text-cream transition-transform active:scale-95 sm:h-auto sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
            >

              <ShoppingBagIcon className="h-4 w-4" />

              <span className="hidden sm:inline">
                {text("Pedido", "Order")}
              </span>

              <span
                key={
                  totalItems
                }
                className={`grid h-6 min-w-6 place-items-center rounded-full bg-primary px-1.5 font-mono-brand text-[11px] text-primary-foreground ${
                  totalItems >
                  0
                    ? "animate-badge"
                    : ""
                }`}
              >
                {totalItems}
              </span>

            </button>

          </div>

        </div>

        <div className="border-t border-border">

          <div className="mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-3 py-2 sm:gap-2 sm:px-6 sm:py-2.5 [scrollbar-width:none]">

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
                  ? "shrink-0 rounded-full bg-chrome px-3 py-1.5 text-xs font-bold text-white shadow-[0_2px_0_0] shadow-chrome/30 transition-transform active:scale-95 sm:px-4 sm:py-2 sm:text-sm"
                  : "brand-chip shrink-0 px-3 py-1.5 text-xs font-semibold active:scale-95 sm:px-4 sm:py-2 sm:text-sm"
              }
            >
              {text("Todos", "All")}
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
                      ? "shrink-0 rounded-full bg-chrome px-3 py-1.5 text-xs font-bold text-white shadow-[0_2px_0_0] shadow-chrome/30 transition-transform active:scale-95 sm:px-4 sm:py-2 sm:text-sm"
                      : "brand-chip shrink-0 px-3 py-1.5 text-xs font-semibold active:scale-95 sm:px-4 sm:py-2 sm:text-sm"
                  }
                >
                  {category.name}
                </button>
              )
            )}

          </div>

        </div>

      </header>

      {storeProfile?.marqueeEnabled ===
        true &&
        Boolean(
          storeProfile
            ?.marqueeMessage
            ?.trim()
        ) && (
          <div className="border-b border-border bg-secondary px-4 py-2 text-center font-mono-brand text-[11px] font-bold uppercase tracking-[0.12em] text-foreground">
            {storeProfile.marqueeMessage}
          </div>
        )}

      {/* =========================
          CONTEÚDO
      ========================= */}

      <div className="mx-auto max-w-6xl px-3 sm:px-6">

        <section className="grid items-center gap-4 py-4 sm:gap-5 sm:py-5 md:grid-cols-12 md:py-8">

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
                ? storeProfile?.heroOpenStatusText ||
                  text("Recebendo pedidos", "Accepting orders")
                : storeProfile?.heroClosedStatusText ||
                  text("Pedidos encerrados", "Ordering closed")}
            </div>

            <h1 className="mt-2 font-display text-[2.2rem] leading-[0.92] tracking-[-0.035em] min-[390px]:text-[2.5rem] sm:mt-3 sm:text-[3.5rem] lg:text-[5rem]">
              {storeProfile?.heroTitleLine1 ||
                text("ESCOLHA.", "CHOOSE.")}
              <br />
              {storeProfile?.heroTitleLine2 ||
                text("PEÇA.", "ORDER.")}
              <br />
              <span className="text-primary">
                {storeProfile?.heroTitleLine3 ||
                  text("APROVEITE.", "ENJOY.")}
              </span>
            </h1>

            <p className="mt-2 max-w-xl text-[13px] leading-5 text-muted-foreground sm:mt-3 sm:text-base sm:leading-6">
              {storeProfile?.heroDescription ||
                text("Escolha seus favoritos, monte seu pedido e acompanhe tudo pelo site.", "Choose your favorites, build your order and track everything online.")}
            </p>

            {!storeStatus?.open && (
              <div className="mt-5 max-w-xl rounded-2xl border border-primary/20 bg-primary/5 p-4">

                <p className="font-bold text-primary">
                  A loja não está recebendo novos pedidos agora.
                </p>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {storeStatus?.message ||
                    text("Você pode consultar o cardápio e voltar quando os pedidos forem liberados.", "You can browse the menu and come back when ordering is available.")}
                </p>

              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">

              <a
                href="#menu"
                className="brand-button min-h-10 rounded-full px-5 text-sm sm:min-h-12 sm:px-7"
              >
                {storeProfile?.heroPrimaryButtonText ||
                  "Ver cardápio"}

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
                  className="min-h-10 rounded-full border-2 border-foreground bg-transparent px-5 text-sm font-bold transition-colors hover:bg-foreground hover:text-cream sm:min-h-12 sm:px-6"
                >
                  {storeProfile?.heroSecondaryButtonText ||
                    "Ver meu pedido"}
                </button>
              )}

            </div>

          </div>

          <div className="animate-fade-up relative md:col-span-6">

            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_18px_60px_-30px] shadow-foreground/35">

              <img
                src={
                  coverImageUrl
                }
                alt=text("Destaque do cardápio", "Menu highlight")
                className="aspect-[16/7] max-h-44 w-full object-cover sm:aspect-[16/9] sm:max-h-none"
              />

            </div>

            <div className="animate-floaty absolute -left-2 top-5 rounded-full bg-butter px-4 py-2 font-mono-brand text-xs font-bold shadow-[0_3px_0_0] shadow-foreground/15 sm:-left-4">
              {storeProfile?.heroBadgeText ||
                "CARDÁPIO ONLINE"}
            </div>

            <div className="absolute -bottom-3 right-4 rounded-full bg-foreground px-5 py-2.5 font-display text-lg tracking-wide text-cream shadow-[0_4px_0_0] shadow-primary/50">
              {storeStatus?.open
                ? storeProfile?.heroOpenStatusText ||
                  "ABERTO"
                : storeProfile?.heroClosedStatusText ||
                  "FECHADO"}
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
                {storeProfile?.menuTitle ||
                  "O cardápio"}
              </p>

              <h2 className="mt-1 font-display text-3xl tracking-tight sm:text-5xl">
                {storeProfile?.menuSubtitle ||
                  "Escolha o seu"}
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
                placeholder={
                  storeProfile?.menuSearchPlaceholder ||
                  text("Buscar no cardápio", "Search the menu")
                }
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
                  {products.length === 0 &&
                  !search &&
                  activeCategoryId === "ALL"
                    ? text("Cardápio em preparação", "Menu coming soon")
                    : storeProfile?.menuEmptyTitle ||
                      text("Nenhum item encontrado", "No items found")}
                </p>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  {products.length === 0 &&
                  !search &&
                  activeCategoryId === "ALL"
                    ? text("Esta loja ainda não publicou produtos. Volte em breve.", "This store has not published any products yet. Check back soon.")
                    : storeProfile?.menuEmptyDescription ||
                      text("Tente outra categoria ou altere sua busca.", "Try another category or change your search.")}
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
                    {text("Limpar filtros", "Clear filters")}
                  </button>
                )}

              </div>
            )}

          <div
            key={
              String(
                activeCategoryId
              )
            }
            className="mt-4 grid grid-cols-2 animate-fade-up gap-2.5 sm:mt-5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
          >

            {filteredProducts.map(
              (
                product,
                index
              ) => {

                const cartQuantity =
                  cart
                    .filter(
                      (item) =>
                        item.product.id ===
                        product.id
                    )
                    .reduce(
                      (
                        total,
                        item
                      ) =>
                        total +
                        item.quantity,
                      0
                    );

                return (
                  <article
                    key={
                      product.id
                    }
                    className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_10px_28px_-24px] shadow-foreground/40 transition-transform duration-200 hover:-translate-y-0.5 sm:rounded-2xl"
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
                          className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:aspect-[16/10]"
                        />
                      ) : (
                        <div className="grid aspect-square place-items-center bg-[radial-gradient(circle_at_top_left,var(--butter),transparent_55%),linear-gradient(135deg,var(--secondary),var(--background))] sm:aspect-[16/10]">

                          <div className="rounded-full border border-foreground/10 bg-white/65 px-2 py-1 font-mono-brand text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.18em]">
                            Sem foto
                          </div>

                        </div>
                      )}

                      <span className="absolute left-2 top-2 max-w-[75%] truncate rounded-full bg-background/90 px-2 py-1 font-mono-brand text-[8px] font-bold uppercase tracking-wide backdrop-blur sm:left-3 sm:top-3 sm:px-3 sm:py-1.5 sm:text-[10px]">
                        {product.category.name}
                      </span>

                      {cartQuantity > 0 && (
                        <span className="absolute right-3 top-3 grid h-8 min-w-8 place-items-center rounded-full bg-primary px-2 font-mono-brand text-xs font-bold text-primary-foreground shadow-lg">
                          {cartQuantity}
                        </span>
                      )}

                    </div>

                    <div className="flex flex-1 flex-col p-2.5 sm:p-4">

                      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">

                        <h3 className="line-clamp-2 min-w-0 font-display text-base leading-[1.05] tracking-tight sm:text-xl sm:leading-none">
                          {product.name}
                        </h3>

                        <p className="shrink-0 font-display text-base leading-none text-primary sm:text-[1.35rem]">
                          {formatMoney(
                            Number(
                              product.price
                            )
                          )}
                        </p>

                      </div>

                      <p className="mt-1.5 hidden flex-1 text-[13px] leading-5 text-muted-foreground sm:line-clamp-2 sm:block">
                        {product.description ||
                          text("Confira este item do nosso cardápio.", "Check out this item from our menu.")}
                      </p>

                      {(product.addonGroups ?? []).some(
                        (group) =>
                          group.active &&
                          (group.addons ?? []).some(
                            (addon) =>
                              addon.active
                          )
                      ) && (
                        <p className="mt-3 text-xs font-bold text-primary">
                          Personalizável
                        </p>
                      )}

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
                        className="mt-2.5 flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-foreground bg-foreground px-2 text-[11px] font-bold text-cream transition-all hover:bg-transparent hover:text-foreground active:scale-[0.98] disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary disabled:text-muted-foreground sm:mt-3 sm:min-h-10 sm:gap-2 sm:border-2 sm:px-4 sm:text-xs"
                      >
                        <PlusIcon className="h-4 w-4" />

                        {storeStatus?.open
                          ? "Ver opções"
                          : text("Indisponível agora", "Unavailable right now")}
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

        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6">

          <div>

            <p className="font-display text-3xl tracking-tight">
              {storeName}
              <span className="text-primary">
                .
              </span>
            </p>

            <p className="mt-1 font-mono-brand text-xs uppercase tracking-[0.15em] text-muted-foreground">
              {storeProfile?.footerTagline ||
                text("Pedidos online", "Online ordering")}
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
          BARRA FIXA
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
            aria-label=text("Fechar produto", "Close product")
            onClick={
              closeProduct
            }
            className="absolute inset-0 bg-foreground/50 backdrop-blur-[3px]"
          />

          <div className="animate-slide-up absolute bottom-0 left-1/2 flex max-h-[94vh] w-full max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-t-[2rem] bg-background shadow-2xl md:bottom-auto md:top-1/2 md:max-h-[86vh] md:-translate-y-1/2 md:rounded-[2rem]">

            {selectedProduct.imageUrl ? (
              <div className="relative h-[190px] shrink-0 overflow-hidden bg-secondary sm:h-[220px]">

                <img
                  src={
                    selectedProduct.imageUrl
                  }
                  alt={
                    selectedProduct.name
                  }
                  className="h-full w-full object-cover"
                />

                <button
                  type="button"
                  aria-label="Fechar"
                  onClick={
                    closeProduct
                  }
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
                  onClick={
                    closeProduct
                  }
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
                    Number(
                      selectedProduct.price
                    )
                  )}
                </p>

              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
                {selectedProduct.description ||
                  text("Confira este item do nosso cardápio.", "Check out this item from our menu.")}
              </p>

              <ProductAddonSelector
                groups={
                  selectedProduct
                    .addonGroups ??
                    []
                }
                selectedAddonIds={
                  selectedAddonIds
                }
                onChange={
                  setSelectedAddonIds
                }
              />

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
                          setSelectedCrust(
                            null
                          )
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
                        setSelectedCrust(
                          null
                        )
                      }
                      className={`flex min-h-14 items-center justify-between rounded-2xl border px-4 text-left transition ${
                        selectedCrust ===
                        null
                          ? "border-foreground bg-foreground text-cream"
                          : "border-border bg-card hover:border-foreground/30"
                      }`}
                    >

                      <span className="font-bold">
                        Sem borda
                      </span>

                      {selectedCrust ===
                        null && (
                        <CheckIcon className="h-4 w-4" />
                      )}

                    </button>

                    {crusts.map(
                      (crust) => (
                        <button
                          key={
                            crust.id
                          }
                          type="button"
                          onClick={() =>
                            setSelectedCrust(
                              crust
                            )
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
                            +{" "}
                            {formatMoney(
                              Number(
                                crust.price
                              )
                            )}
                          </span>

                        </button>
                      )
                    )}

                  </div>

                  {crusts.length ===
                    0 && (
                    <p className="mt-3 rounded-xl bg-secondary p-3 text-sm text-muted-foreground">
                      Nenhuma borda está disponível no momento.
                    </p>
                  )}

                </div>
              )}

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
                      aria-label=text("Diminuir quantidade", "Decrease quantity")
                      onClick={() =>
                        setSelectedQuantity(
                          (
                            quantity
                          ) =>
                            Math.max(
                              1,
                              quantity -
                                1
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
                      aria-label=text("Aumentar quantidade", "Increase quantity")
                      onClick={() =>
                        setSelectedQuantity(
                          (
                            quantity
                          ) =>
                            quantity +
                            1
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
                  value={
                    selectedObservation
                  }
                  onChange={(
                    event
                  ) =>
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

            </div>

            <div className="shrink-0 border-t border-border bg-background px-5 py-4 sm:px-6">

              <button
                type="button"
                onClick={
                  addSelectedProductToCart
                }
                disabled={
                  !storeStatus?.open
                }
                className="brand-button min-h-14 w-full rounded-2xl px-5 text-base disabled:cursor-not-allowed disabled:opacity-50"
              >

                <PlusIcon className="h-5 w-5" />

                {storeStatus?.open
                  ? `Adicionar ao pedido · ${formatMoney(
                      selectedUnitPrice *
                        selectedQuantity
                    )}`
                  : text("Pedidos encerrados", "Ordering closed")}

              </button>

            </div>

          </div>

        </div>
      )}

      {/* =========================
          CARRINHO
      ========================= */}

      {cartOpen && (
        <div className="fixed inset-0 z-50">

          <button
            type="button"
            aria-label=text("Fechar pedido", "Close order")
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

              {cart.length === 0 ? (
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
                    (
                      item,
                      itemIndex
                    ) => {

                      const itemAddonsPrice =
                        (
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

                      const itemUnitPrice =
                        Number(
                          item.product
                            .price
                        ) +
                        Number(
                          item.crust
                            ?.price ??
                            0
                        ) +
                        itemAddonsPrice;

                      return (
                        <article
                          key={`${item.product.id}-${item.crust?.id ?? "no-crust"}-${addonIdsKey(
                            item.addons ?? []
                          )}-${itemIndex}`}
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
                                      Borda:{" "}
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
                                        className="mt-1 text-xs font-semibold text-muted-foreground"
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
                                          : ""}
                                      </p>
                                    )
                                  )}

                                  <p className="mt-1 text-sm font-bold text-primary">
                                    {formatMoney(
                                      itemUnitPrice *
                                        item.quantity
                                    )}
                                  </p>

                                </div>

                                <button
                                  type="button"
                                  aria-label={text(`Remover ${item.product.name}`, `Remove ${item.product.name}`)}
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
                                  aria-label={text(`Diminuir quantidade de ${item.product.name}`, `Decrease quantity of ${item.product.name}`)}
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
                                  aria-label={text(`Aumentar quantidade de ${item.product.name}`, `Increase quantity of ${item.product.name}`)}
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
                              htmlFor={`observation-${itemIndex}`}
                              className="mb-2 block font-mono-brand text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground"
                            >
                              Observação
                            </label>

                            <textarea
                              id={`observation-${itemIndex}`}
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
                      );
                    }
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
                  ? text("Continuar para checkout", "Continue to checkout")
                  : text("Pedidos encerrados", "Ordering closed")}

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

"use client";

import { useEffect, useMemo, useState } from "react";
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
  category: Category;
};

type CartItem = {
  product: Product;
  quantity: number;
};

export default function CardapioPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartLoaded, setCartLoaded] = useState(false);

  // Carrega o carrinho salvo no navegador
  useEffect(() => {
    const savedCart = localStorage.getItem("pizzasystem-cart");

    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      } catch {
        localStorage.removeItem("pizzasystem-cart");
      }
    }

    setCartLoaded(true);
  }, []);

  // Salva o carrinho sempre que ele mudar
  useEffect(() => {
    if (!cartLoaded) {
      return;
    }

    localStorage.setItem(
      "pizzasystem-cart",
      JSON.stringify(cart)
    );
  }, [cart, cartLoaded]);

  // Busca os produtos disponíveis
  useEffect(() => {
    fetch("http://localhost:8080/api/products/available")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao buscar produtos");
        }

        return response.json();
      })
      .then((data: Product[]) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erro:", error);
        setLoading(false);
      });
  }, []);

  function addToCart(product: Product) {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.product.id === product.id
      );

      if (existingItem) {
        return currentCart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          product,
          quantity: 1,
        },
      ];
    });
  }

  function increaseQuantity(productId: number) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  }

  function decreaseQuantity(productId: number) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.product.id === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(productId: number) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.product.id !== productId
      )
    );
  }

  function continueOrder() {
    if (cart.length === 0) {
      return;
    }

    router.push("/checkout");
  }

  const totalItems = useMemo(() => {
    return cart.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total +
        Number(item.product.price) * item.quantity,
      0
    );
  }, [cart]);

  const categories = Array.from(
    new Map(
      products.map((product) => [
        product.category.id,
        product.category,
      ])
    ).values()
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <p>Carregando cardápio...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-20 border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-3xl font-bold">
              Cardápio
            </h1>

            <p className="mt-1 text-sm text-gray-600">
              Escolha seus sabores favoritos
            </p>
          </div>

          <div className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">
            Carrinho: {totalItems}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[1fr_360px]">
        <div>
          {products.length === 0 && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-gray-500">
                Nenhum produto disponível no momento.
              </p>
            </div>
          )}

          <div className="space-y-10">
            {categories.map((category) => {
              const categoryProducts = products.filter(
                (product) =>
                  product.category.id === category.id
              );

              return (
                <section key={category.id}>
                  <h2 className="mb-4 text-2xl font-bold">
                    {category.name}
                  </h2>

                  <div className="grid gap-4 md:grid-cols-2">
                    {categoryProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex overflow-hidden rounded-xl bg-white shadow-sm"
                      >
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-40 w-40 object-cover"
                          />
                        )}

                        <div className="flex flex-1 flex-col p-5">
                          <h3 className="text-lg font-bold">
                            {product.name}
                          </h3>

                          <p className="mt-1 flex-1 text-sm text-gray-600">
                            {product.description}
                          </p>

                          <div className="mt-5 flex items-center justify-between">
                            <span className="text-lg font-bold">
                              R${" "}
                              {Number(product.price)
                                .toFixed(2)
                                .replace(".", ",")}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                addToCart(product)
                              }
                              className="rounded-lg bg-black px-4 py-2 font-semibold text-white hover:bg-gray-800"
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <aside className="h-fit rounded-xl bg-white p-5 shadow-sm lg:sticky lg:top-28">
          <h2 className="text-xl font-bold">
            Seu pedido
          </h2>

          {cart.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              Seu carrinho está vazio.
            </p>
          ) : (
            <>
              <div className="mt-5 space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="border-b pb-4"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-semibold">
                          {item.product.name}
                        </p>

                        <p className="text-sm text-gray-500">
                          R${" "}
                          {Number(item.product.price)
                            .toFixed(2)
                            .replace(".", ",")}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(item.product.id)
                        }
                        className="text-sm text-red-600 hover:underline"
                      >
                        Remover
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            decreaseQuantity(item.product.id)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full border text-lg"
                        >
                          -
                        </button>

                        <span className="font-semibold">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            increaseQuantity(item.product.id)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full border text-lg"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-semibold">
                        R${" "}
                        {(
                          Number(item.product.price) *
                          item.quantity
                        )
                          .toFixed(2)
                          .replace(".", ",")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Subtotal</span>

                  <span>
                    R${" "}
                    {subtotal
                      .toFixed(2)
                      .replace(".", ",")}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={continueOrder}
                  className="mt-5 w-full rounded-lg bg-black px-4 py-3 font-semibold text-white hover:bg-gray-800"
                >
                  Continuar pedido
                </button>
              </div>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
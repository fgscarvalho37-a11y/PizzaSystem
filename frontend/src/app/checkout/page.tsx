"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: number;
  name: string;
  price: number;
};

type CartItem = {
  product: Product;
  quantity: number;
};

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [complement, setComplement] = useState("");

  useEffect(() => {
    const savedCart = localStorage.getItem("pizzasystem-cart");

    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        localStorage.removeItem("pizzasystem-cart");
      }
    }

    setLoaded(true);
  }, []);

  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total + Number(item.product.price) * item.quantity,
      0
    );
  }, [cart]);

  // Temporário. Depois a taxa será calculada pelo bairro.
  const deliveryFee = 5;

  const total = subtotal + deliveryFee;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    console.log({
      customerName,
      customerPhone,
      street,
      number,
      neighborhood,
      complement,
      cart,
      subtotal,
      deliveryFee,
      total,
    });
  }

  if (!loaded) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <p>Carregando...</p>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">
            Seu carrinho está vazio
          </h1>

          <button
            onClick={() => router.push("/cardapio")}
            className="mt-5 rounded-lg bg-black px-5 py-3 font-semibold text-white"
          >
            Voltar ao cardápio
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.push("/cardapio")}
          className="mb-5 text-sm font-semibold"
        >
          ← Voltar ao cardápio
        </button>

        <h1 className="text-3xl font-bold">
          Finalizar pedido
        </h1>

        <p className="mt-2 text-gray-600">
          Informe seus dados para entrega.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-xl bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold">
              Seus dados
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Nome
                </label>

                <input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-lg border p-3 outline-none focus:border-black"
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">
                  WhatsApp
                </label>

                <input
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-lg border p-3 outline-none focus:border-black"
                  placeholder="(19) 99999-9999"
                />
              </div>

              <h2 className="pt-4 text-xl font-bold">
                Endereço de entrega
              </h2>

              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Rua
                </label>

                <input
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full rounded-lg border p-3 outline-none focus:border-black"
                  placeholder="Nome da rua"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Número
                  </label>

                  <input
                    required
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full rounded-lg border p-3 outline-none focus:border-black"
                    placeholder="123"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Bairro
                  </label>

                  <input
                    required
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full rounded-lg border p-3 outline-none focus:border-black"
                    placeholder="Centro"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Complemento
                </label>

                <input
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  className="w-full rounded-lg border p-3 outline-none focus:border-black"
                  placeholder="Apartamento, bloco, referência..."
                />
              </div>

              <button
                type="submit"
                className="mt-3 w-full rounded-lg bg-black px-4 py-3 font-semibold text-white hover:bg-gray-800"
              >
                Finalizar pedido
              </button>
            </div>
          </form>

          <aside className="h-fit rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              Resumo do pedido
            </h2>

            <div className="mt-5 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex justify-between gap-4 border-b pb-4"
                >
                  <div>
                    <p className="font-semibold">
                      {item.quantity}x {item.product.name}
                    </p>

                    <p className="text-sm text-gray-500">
                      R$ {Number(item.product.price)
                        .toFixed(2)
                        .replace(".", ",")} cada
                    </p>
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
              ))}
            </div>

            <div className="mt-5 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>
                  R$ {subtotal.toFixed(2).replace(".", ",")}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Taxa de entrega</span>
                <span>
                  R$ {deliveryFee.toFixed(2).replace(".", ",")}
                </span>
              </div>

              <div className="flex justify-between border-t pt-3 text-lg font-bold">
                <span>Total</span>
                <span>
                  R$ {total.toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
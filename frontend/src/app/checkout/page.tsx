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
  observation: string;
};

type DeliveryArea = {
  id: number;
  neighborhood: string;
  fee: number;
  active: boolean;
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

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryAreas, setDeliveryAreas] =
    useState<DeliveryArea[]>([]);
  const [storeStatus, setStoreStatus] =
    useState<StoreStatus | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [complement, setComplement] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod | "">("");

  useEffect(() => {
    const savedCart = localStorage.getItem(
      "pizzasystem-cart"
    );

    if (savedCart) {
      try {
        const parsed: CartItem[] =
          JSON.parse(savedCart);

        const normalized = parsed.map((item) => ({
          ...item,
          observation: item.observation || "",
        }));

        setCart(normalized);
      } catch (error) {
        console.error(
          "Erro ao carregar carrinho:",
          error
        );
      }
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [areasResponse, statusResponse] =
          await Promise.all([
            fetch(
              "http://localhost:8080/api/delivery-areas/active"
            ),
            fetch(
              "http://localhost:8080/api/store/status"
            ),
          ]);

        if (!areasResponse.ok) {
          throw new Error(
            "Erro ao carregar bairros"
          );
        }

        if (!statusResponse.ok) {
          throw new Error(
            "Erro ao carregar status"
          );
        }

        const areasData: DeliveryArea[] =
          await areasResponse.json();

        const statusData: StoreStatus =
          await statusResponse.json();

        setDeliveryAreas(areasData);
        setStoreStatus(statusData);
      } catch (error) {
        console.error(error);
      }
    }

    loadData();

    const interval = setInterval(() => {
      fetch(
        "http://localhost:8080/api/store/status"
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              "Erro ao atualizar status"
            );
          }

          return response.json();
        })
        .then((data: StoreStatus) => {
          setStoreStatus(data);
        })
        .catch((error) => {
          console.error(error);
        });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  function updateObservation(
    productId: number,
    observation: string
  ) {
    setCart((currentCart) => {
      const updatedCart = currentCart.map(
        (item) =>
          item.product.id === productId
            ? {
                ...item,
                observation,
              }
            : item
      );

      localStorage.setItem(
        "pizzasystem-cart",
        JSON.stringify(updatedCart)
      );

      return updatedCart;
    });
  }

  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total +
        Number(item.product.price) *
          item.quantity,
      0
    );
  }, [cart]);

  const selectedArea = deliveryAreas.find(
    (area) =>
      area.neighborhood === neighborhood
  );

  const deliveryFee = selectedArea
    ? Number(selectedArea.fee)
    : 0;

  const total = subtotal + deliveryFee;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!storeStatus?.open) {
      alert(
        storeStatus?.message ||
          "A pizzaria não está recebendo pedidos agora."
      );
      return;
    }

    if (cart.length === 0) {
      alert("Carrinho vazio.");
      return;
    }

    if (!neighborhood) {
      alert("Selecione o bairro.");
      return;
    }

    if (!paymentMethod) {
      alert(
        "Selecione a forma de pagamento."
      );
      return;
    }

    // Proteção extra:
    // débito está temporariamente desativado.
    if (paymentMethod === "DEBIT_CARD") {
      alert(
        "O pagamento com cartão de débito está temporariamente indisponível."
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        customerName,
        customerPhone,
        street,
        number,
        neighborhood,
        complement,
        paymentMethod,

        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          observation: item.observation,
        })),
      };

      const orderResponse = await fetch(
        "http://localhost:8080/api/orders",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(payload),
        }
      );

      if (!orderResponse.ok) {
        const text =
          await orderResponse.text();

        console.error(
          "Erro ao criar pedido:",
          text
        );

        throw new Error(
          "Erro ao criar pedido"
        );
      }

      const order =
        await orderResponse.json();

      // =========================
      // PIX
      // =========================

      if (paymentMethod === "PIX") {
        const pixResponse = await fetch(
          `http://localhost:8080/api/payments/${order.id}/pix`,
          {
            method: "POST",
          }
        );

        if (!pixResponse.ok) {
          const text =
            await pixResponse.text();

          console.error(
            "Erro ao gerar Pix:",
            text
          );

          throw new Error(
            "Pedido criado, mas não foi possível gerar o Pix"
          );
        }

        localStorage.removeItem(
          "pizzasystem-cart"
        );

        router.push(
          `/pagamento/${order.id}`
        );

        return;
      }

      // =========================
      // CARTÃO DE CRÉDITO
      // =========================

      if (
        paymentMethod === "CREDIT_CARD"
      ) {
        localStorage.removeItem(
          "pizzasystem-cart"
        );

        router.push(
          `/pagamento/cartao/${order.id}`
        );

        return;
      }

      localStorage.removeItem(
        "pizzasystem-cart"
      );

      router.push(
        `/pedido/${order.id}`
      );
    } catch (error) {
      console.error(error);

      alert(
        "Não foi possível finalizar o pedido."
      );
    } finally {
      setSubmitting(false);
    }
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
        <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold">
            Seu carrinho está vazio
          </h1>

          <button
            onClick={() =>
              router.push("/cardapio")
            }
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
          onClick={() =>
            router.push("/cardapio")
          }
          className="mb-5 font-semibold"
        >
          ← Voltar ao cardápio
        </button>

        <h1 className="text-3xl font-bold">
          Finalizar pedido
        </h1>

        {!storeStatus?.open && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="font-bold text-red-700">
              Pedidos encerrados no momento
            </p>

            <p className="mt-1 text-sm text-red-600">
              {storeStatus?.message ||
                "A pizzaria não está recebendo novos pedidos."}
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">

          <form
            onSubmit={handleSubmit}
            className="rounded-xl bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold">
              Seus dados
            </h2>

            <div className="mt-5 space-y-4">

              <div>
                <label className="mb-1 block font-semibold">
                  Nome
                </label>

                <input
                  required
                  value={customerName}
                  onChange={(e) =>
                    setCustomerName(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border p-3"
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold">
                  WhatsApp
                </label>

                <input
                  required
                  value={customerPhone}
                  onChange={(e) =>
                    setCustomerPhone(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border p-3"
                  placeholder="(19) 99999-9999"
                />
              </div>

              <h2 className="pt-4 text-xl font-bold">
                Endereço
              </h2>

              <div>
                <label className="mb-1 block font-semibold">
                  Rua
                </label>

                <input
                  required
                  value={street}
                  onChange={(e) =>
                    setStreet(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border p-3"
                  placeholder="Nome da rua"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-1 block font-semibold">
                    Número
                  </label>

                  <input
                    required
                    value={number}
                    onChange={(e) =>
                      setNumber(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border p-3"
                    placeholder="123"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold">
                    Bairro
                  </label>

                  <select
                    required
                    value={neighborhood}
                    onChange={(e) =>
                      setNeighborhood(
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border bg-white p-3"
                  >
                    <option value="">
                      Selecione o bairro
                    </option>

                    {deliveryAreas.map(
                      (area) => (
                        <option
                          key={area.id}
                          value={
                            area.neighborhood
                          }
                        >
                          {area.neighborhood} - R${" "}
                          {Number(area.fee)
                            .toFixed(2)
                            .replace(
                              ".",
                              ","
                            )}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold">
                  Complemento
                </label>

                <input
                  value={complement}
                  onChange={(e) =>
                    setComplement(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border p-3"
                  placeholder="Apartamento, bloco, referência..."
                />
              </div>

              {/* =========================
                  FORMA DE PAGAMENTO
                  ========================= */}

              <div className="pt-4">

                <h2 className="text-xl font-bold">
                  Forma de pagamento
                </h2>

                <div className="mt-4 space-y-3">

                  {/* PIX */}

                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${
                      paymentMethod === "PIX"
                        ? "border-black bg-gray-50"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={
                        paymentMethod === "PIX"
                      }
                      onChange={() =>
                        setPaymentMethod(
                          "PIX"
                        )
                      }
                    />

                    <div>
                      <p className="font-semibold">
                        Pix
                      </p>

                      <p className="text-sm text-gray-500">
                        QR Code e Pix copia e cola
                      </p>
                    </div>
                  </label>

                  {/* CARTÃO DE CRÉDITO */}

                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${
                      paymentMethod ===
                      "CREDIT_CARD"
                        ? "border-black bg-gray-50"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={
                        paymentMethod ===
                        "CREDIT_CARD"
                      }
                      onChange={() =>
                        setPaymentMethod(
                          "CREDIT_CARD"
                        )
                      }
                    />

                    <div>
                      <p className="font-semibold">
                        Cartão de crédito
                      </p>

                      <p className="text-sm text-gray-500">
                        Pagamento online seguro
                      </p>
                    </div>
                  </label>

                  {/* CARTÃO DE DÉBITO - DESATIVADO */}

                  <div
                    className="
                      flex
                      cursor-not-allowed
                      items-center
                      gap-3
                      rounded-xl
                      border
                      border-gray-200
                      bg-gray-50
                      p-4
                      opacity-60
                    "
                  >
                    <input
                      type="radio"
                      name="paymentMethodDisabled"
                      disabled
                      checked={false}
                      readOnly
                      className="cursor-not-allowed"
                    />

                    <div className="flex-1">

                      <div className="flex items-center justify-between gap-3">

                        <p className="font-semibold text-gray-500">
                          Cartão de débito
                        </p>

                        <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600">
                          Indisponível
                        </span>

                      </div>

                      <p className="mt-1 text-sm text-gray-400">
                        Temporariamente indisponível
                      </p>

                    </div>
                  </div>

                </div>
              </div>

              <button
                type="submit"
                disabled={
                  submitting ||
                  !neighborhood ||
                  !paymentMethod ||
                  !storeStatus?.open
                }
                className="mt-4 w-full rounded-lg bg-black p-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {submitting
                  ? paymentMethod === "PIX"
                    ? "Gerando Pix..."
                    : "Processando..."
                  : paymentMethod === "PIX"
                    ? "Gerar Pix e continuar"
                    : "Continuar para pagamento"}
              </button>

            </div>
          </form>

          {/* =========================
              RESUMO DO PEDIDO
              ========================= */}

          <aside className="h-fit rounded-xl bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold">
              Resumo do pedido
            </h2>

            <div className="mt-5 space-y-5">

              {cart.map((item) => (

                <div
                  key={item.product.id}
                  className="border-b pb-5"
                >

                  <div className="flex justify-between gap-4">

                    <div>
                      <p className="font-semibold">
                        {item.quantity}x{" "}
                        {item.product.name}
                      </p>

                      <p className="text-sm text-gray-500">
                        R${" "}
                        {Number(
                          item.product.price
                        )
                          .toFixed(2)
                          .replace(
                            ".",
                            ","
                          )}{" "}
                        cada
                      </p>
                    </div>

                    <span className="font-semibold">
                      R${" "}
                      {(
                        Number(
                          item.product.price
                        ) *
                        item.quantity
                      )
                        .toFixed(2)
                        .replace(
                          ".",
                          ","
                        )}
                    </span>

                  </div>

                  {item.observation && (
                    <p className="mt-2 text-sm font-medium text-red-600">
                      Obs:{" "}
                      {item.observation}
                    </p>
                  )}

                  <div className="mt-4">

                    <label className="mb-1 block text-sm font-semibold">
                      Observação deste item
                    </label>

                    <textarea
                      value={
                        item.observation
                      }
                      onChange={(e) =>
                        updateObservation(
                          item.product.id,
                          e.target.value
                        )
                      }
                      placeholder="Ex: sem cebola"
                      rows={2}
                      className="w-full resize-none rounded-lg border p-3 text-sm"
                    />

                  </div>

                </div>
              ))}

            </div>

            <div className="mt-5 space-y-2">

              <div className="flex justify-between">
                <span>Subtotal</span>

                <span>
                  R${" "}
                  {subtotal
                    .toFixed(2)
                    .replace(
                      ".",
                      ","
                    )}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Entrega</span>

                <span>
                  {neighborhood
                    ? `R$ ${deliveryFee
                        .toFixed(2)
                        .replace(
                          ".",
                          ","
                        )}`
                    : "Selecione o bairro"}
                </span>
              </div>

              <div className="flex justify-between border-t pt-3 text-xl font-bold">

                <span>Total</span>

                <span>
                  R${" "}
                  {total
                    .toFixed(2)
                    .replace(
                      ".",
                      ","
                    )}
                </span>

              </div>

            </div>

          </aside>

        </div>
      </div>
    </main>
  );
}
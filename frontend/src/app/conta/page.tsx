"use client";

import {
  FormEvent,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";

import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";

const API_URL = "";

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??
  "833087922183-krk0sjmge2rhdpotcs0alq9ooof48umv.apps.googleusercontent.com";

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: any;
  }
}

type Customer = {
  authenticated: boolean;
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  profileImageUrl?: string | null;
  emailVerified: boolean;
  googleConnected: boolean;
};

type CustomerOrder = {
  id: number;
  storeId: number | null;
  storeName: string | null;
  storeSlug: string | null;
  customerName: string;
  customerPhone: string;
  total: number | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  createdAt: string;
  publicAccessToken: string;
};

type LoyaltyTransaction = {
  id: number;
  points: number;
  type: string;
  description: string | null;
  createdAt: string;
  orderId: number | null;
};

type LoyaltyAccount = {
  id: number;
  storeId: number;
  storeName: string | null;
  points: number;
  lifetimePoints: number;
  rewardsRedeemed: number;
  createdAt: string;
  updatedAt: string | null;
  loyaltyEnabled: boolean;
  stampGoal: number;
  rewardDescription: string | null;
  rewardAvailable: boolean;
  pointsMissing: number;
  transactions: LoyaltyTransaction[];
};

type LoyaltyRedemption = {
  id: number;
  storeId: number;
  storeName: string | null;
  pointsUsed: number;
  rewardDescription: string;
  status: string;
  createdAt: string;
  usedAt: string | null;
  cancelledAt: string | null;
};

type LoyaltyResponse = {
  customerId: number;
  totalPoints: number;
  totalLifetimePoints: number;
  totalRewardsRedeemed: number;
  accounts: LoyaltyAccount[];
  redemptions?: LoyaltyRedemption[];
};

function ContaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawStoreSlug =
    searchParams.get("store");

  const storeSlug =
    rawStoreSlug?.trim() || null;

  function goBackToStore() {
    if (storeSlug) {
      router.push(
        `/cardapio/${encodeURIComponent(
          storeSlug
        )}`
      );
      return;
    }

    router.push("/");
  }

  const [mode, setMode] =
    useState<"login" | "register" | "forgot" | "reset">(
      "login"
    );

  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [loadingSession, setLoadingSession] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const googleButtonRef =
    useRef<HTMLDivElement | null>(null);

  const [orders, setOrders] =
    useState<CustomerOrder[]>([]);

  const [ordersOpen, setOrdersOpen] =
    useState(false);

  const [loadingOrders, setLoadingOrders] =
    useState(false);

  const [ordersError, setOrdersError] =
    useState("");

  const [loyalty, setLoyalty] =
    useState<LoyaltyResponse | null>(null);

  const [loyaltyOpen, setLoyaltyOpen] =
    useState(false);

  const [loadingLoyalty, setLoadingLoyalty] =
    useState(false);

  const [loyaltyError, setLoyaltyError] =
    useState("");

  const [redeemingStoreId, setRedeemingStoreId] =
    useState<number | null>(null);

  const [redeemMessage, setRedeemMessage] =
    useState("");

  const [redeemError, setRedeemError] =
    useState("");

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [resetEmail, setResetEmail] =
    useState("");

  const [resetCode, setResetCode] =
    useState("");

  const [resetNewPassword, setResetNewPassword] =
    useState("");

  const [resetConfirmPassword, setResetConfirmPassword] =
    useState("");

  const [resetSubmitting, setResetSubmitting] =
    useState(false);

  const [resetError, setResetError] =
    useState("");

  const [resetMessage, setResetMessage] =
    useState("");

  const [verificationCode, setVerificationCode] =
    useState("");

  const [verificationError, setVerificationError] =
    useState("");

  const [verificationMessage, setVerificationMessage] =
    useState("");

  const [verificationSubmitting, setVerificationSubmitting] =
    useState(false);

  const [verificationSending, setVerificationSending] =
    useState(false);

  const [verificationCooldown, setVerificationCooldown] =
    useState(0);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [profileName, setProfileName] =
    useState("");

  const [profileEmail, setProfileEmail] =
    useState("");

  const [profilePhone, setProfilePhone] =
    useState("");

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmNewPassword, setConfirmNewPassword] =
    useState("");

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [profileError, setProfileError] =
    useState("");

  const [profileMessage, setProfileMessage] =
    useState("");

  function openProfile() {
    if (!customer) {
      return;
    }

    setProfileName(customer.name ?? "");
    setProfileEmail(customer.email ?? "");
    setProfilePhone(customer.phone ?? "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setProfileError("");
    setProfileMessage("");
    setProfileOpen(true);
  }

  async function saveProfile() {
    if (!customer || savingProfile) {
      return;
    }

    setProfileError("");
    setProfileMessage("");

    if (!profileName.trim()) {
      setProfileError("Informe seu nome.");
      return;
    }

    if (!profileEmail.trim()) {
      setProfileError("Informe seu e-mail.");
      return;
    }

    if (
      newPassword &&
      newPassword.length < 8
    ) {
      setProfileError(
        "A nova senha deve ter pelo menos 8 caracteres."
      );
      return;
    }

    if (
      newPassword !==
      confirmNewPassword
    ) {
      setProfileError(
        "A confirmação da nova senha não confere."
      );
      return;
    }

    try {
      setSavingProfile(true);

      const csrfResponse = await fetch(
        `${API_URL}/api/auth/csrf`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!csrfResponse.ok) {
        throw new Error(
          "Não foi possível validar a segurança da sessão."
        );
      }

      const csrf = await csrfResponse.json();

      const response = await fetch(
        `${API_URL}/api/customer-auth/me`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
            [csrf.headerName]:
              csrf.token,
          },
          body: JSON.stringify({
            name: profileName.trim(),
            email: profileEmail.trim(),
            phone: profilePhone.trim(),
            currentPassword,
            newPassword,
          }),
        }
      );

      const responseText =
        await response.text();

      let data: any = {};

      if (responseText) {
        try {
          data =
            JSON.parse(responseText);
        } catch {
          // O backend pode responder sem JSON em alguns erros.
        }
      }

      if (!response.ok) {
        throw new Error(
          data?.message ??
            `Não foi possível atualizar seus dados (${response.status}).`
        );
      }

      setCustomer(data);
      setProfileName(data.name ?? "");
      setProfileEmail(data.email ?? "");
      setProfilePhone(data.phone ?? "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setProfileMessage(
        data?.message ??
          "Dados atualizados com sucesso."
      );
    } catch (err) {
      setProfileError(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar seus dados."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  function formatMoney(
    value: number | null
  ) {
    return new Intl.NumberFormat(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    ).format(value ?? 0);
  }

  function formatDate(
    value: string
  ) {
    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        dateStyle: "short",
        timeStyle: "short",
      }
    ).format(date);
  }

  function formatOrderDate(
    value: string
  ) {
    return formatDate(value);
  }

  function orderStatusLabel(
    status: string
  ) {
    const labels:
      Record<string, string> = {
        PENDING_PAYMENT:
          "Aguardando pagamento",
        RECEIVED:
          "Pedido recebido",
        PREPARING:
          "Em preparo",
        READY:
          "Pronto",
        OUT_FOR_DELIVERY:
          "Saiu para entrega",
        DELIVERED:
          "Entregue",
        CANCELLED:
          "Cancelado",
      };

    return labels[status] ?? status;
  }

  function transactionTypeLabel(
    type: string
  ) {
    const labels:
      Record<string, string> = {
        ORDER_REWARD:
          "Pontos do pedido",
        REWARD_REDEMPTION:
          "Resgate de recompensa",
        REWARD_REFUND:
          "Pontos devolvidos",
        MANUAL_CREDIT:
          "Crédito manual",
        MANUAL_DEBIT:
          "Débito manual",
      };

    return labels[type] ?? type;
  }

  function redemptionStatusLabel(
    status: string
  ) {
    const labels:
      Record<string, string> = {
        PENDING: "Aguardando utilização",
        USED: "Utilizada",
        CANCELLED: "Cancelada",
      };

    return labels[status] ?? status;
  }

  async function loadOrders() {
    if (loadingOrders) {
      return;
    }

    setOrdersOpen(true);
    setLoadingOrders(true);
    setOrdersError("");

    try {
      const response =
        await fetch(
          `${API_URL}/api/customer/orders`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ??
            "Não foi possível carregar seus pedidos."
        );
      }

      setOrders(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (error) {
      setOrdersError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar seus pedidos."
      );

    } finally {
      setLoadingOrders(false);
    }
  }

  async function loadLoyalty() {
    if (loadingLoyalty) {
      return;
    }

    setLoyaltyOpen(true);
    setLoadingLoyalty(true);
    setLoyaltyError("");

    try {
      const response =
        await fetch(
          `${API_URL}/api/customer/loyalty`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

      let data: LoyaltyResponse & {
        message?: string;
      };

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "Não foi possível carregar sua fidelidade."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ??
            "Não foi possível carregar sua fidelidade."
        );
      }

      setLoyalty(data);

    } catch (error) {
      setLoyalty(null);

      setLoyaltyError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar sua fidelidade."
      );

    } finally {
      setLoadingLoyalty(false);
    }
  }

  async function redeemReward(
    account: LoyaltyAccount
  ) {
    if (redeemingStoreId !== null) {
      return;
    }

    setRedeemingStoreId(account.storeId);
    setRedeemMessage("");
    setRedeemError("");

    try {
      const response =
        await fetch(
          `${API_URL}/api/customer/loyalty/${account.storeId}/redeem`,
          {
            method: "POST",
            credentials: "include",
          }
        );

      let data: {
        success?: boolean;
        message?: string;
      };

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Não foi possível processar o resgate."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ??
            "Não foi possível resgatar a recompensa."
        );
      }

      setRedeemMessage(
        data?.message ??
          "Recompensa resgatada com sucesso."
      );

      await loadLoyalty();

    } catch (error) {
      setRedeemError(
        error instanceof Error
          ? error.message
          : "Não foi possível resgatar a recompensa."
      );

    } finally {
      setRedeemingStoreId(null);
    }
  }

  function openOrder(
    order: CustomerOrder
  ) {
    const token =
      order.publicAccessToken;

    if (!token) {
      setOrdersError(
        "Este pedido não possui acesso público disponível."
      );
      return;
    }

    router.push(
      `/pedido/${order.id}?token=${encodeURIComponent(
        token
      )}`
    );
  }

  // =========================
  // CARREGAR SESSÃO
  // =========================

  async function loadSession() {
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

      if (!response.ok) {
        setCustomer(null);
        return;
      }

      const data =
        await response.json();

      if (data?.authenticated) {
        setCustomer(data);
      } else {
        setCustomer(null);
      }

    } catch {
      setCustomer(null);

    } finally {
      setLoadingSession(false);
    }
  }

  useEffect(() => {
    void loadSession();
  }, []);

  // =========================
  // GOOGLE LOGIN
  // =========================

  async function handleGoogleCredential(
    googleResponse: GoogleCredentialResponse
  ) {
    const credential =
      googleResponse?.credential;

    if (!credential) {
      setError(
        "O Google não retornou uma credencial válida."
      );
      return;
    }

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const csrfResponse =
        await fetch(
          `${API_URL}/api/auth/csrf`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

      if (!csrfResponse.ok) {
        throw new Error(
          "Não foi possível validar a segurança da sessão."
        );
      }

      const csrf =
        await csrfResponse.json();

      const response =
        await fetch(
          `${API_URL}/api/customer-auth/google`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
              [csrf.headerName]:
                csrf.token,
            },
            body: JSON.stringify({
              credential,
            }),
          }
        );

      const responseText =
        await response.text();

      let data: any = {};

      if (responseText) {
        try {
          data =
            JSON.parse(
              responseText
            );
        } catch {
          // Mantém mensagem genérica abaixo.
        }
      }

      if (!response.ok) {
        throw new Error(
          data?.message ??
            "Não foi possível entrar com Google."
        );
      }

      setCustomer(data);
      setPassword("");

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar com Google."
      );

    } finally {
      setSubmitting(false);
    }
  }

  function initializeGoogleSignIn() {
    if (
      !window.google?.accounts?.id ||
      !googleButtonRef.current
    ) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id:
        GOOGLE_CLIENT_ID,
      callback:
        handleGoogleCredential,
      auto_select:
        false,
      cancel_on_tap_outside:
        true,
    });

    googleButtonRef.current.innerHTML =
      "";

    window.google.accounts.id.renderButton(
      googleButtonRef.current,
      {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: 400,
        logo_alignment: "left",
      }
    );
  }

  useEffect(() => {
    if (
      !customer &&
      window.google?.accounts?.id
    ) {
      initializeGoogleSignIn();
    }
  }, [customer, mode]);

  useEffect(() => {
    if (verificationCooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setVerificationCooldown((current) =>
        current <= 1 ? 0 : current - 1
      );
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [verificationCooldown]);

  async function getCsrfToken() {
    const csrfResponse = await fetch(
      `${API_URL}/api/auth/csrf`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

    if (!csrfResponse.ok) {
      throw new Error(
        "Não foi possível validar a segurança da sessão."
      );
    }

    return csrfResponse.json();
  }

  async function sendVerificationCode(
    showSuccessMessage = true
  ) {
    if (
      verificationSending ||
      verificationSubmitting
    ) {
      return false;
    }

    setVerificationSending(true);
    setVerificationError("");

    if (showSuccessMessage) {
      setVerificationMessage("");
    }

    try {
      const csrf = await getCsrfToken();

      const response = await fetch(
        `${API_URL}/api/customer-auth/email-verification/send`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            [csrf.headerName]: csrf.token,
          },
        }
      );

      const responseText = await response.text();

      let data: any = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          // Mantém mensagem genérica abaixo.
        }
      }

      if (!response.ok) {
        throw new Error(
          data?.message ??
            "Não foi possível enviar o código de verificação."
        );
      }

      setVerificationCooldown(60);

      if (showSuccessMessage) {
        setVerificationMessage(
          data?.message ??
            "Enviamos um novo código para o seu e-mail."
        );
      }

      return true;
    } catch (error) {
      setVerificationError(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o código de verificação."
      );

      return false;
    } finally {
      setVerificationSending(false);
    }
  }

  async function handleVerifyEmail(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      verificationSubmitting ||
      verificationSending
    ) {
      return;
    }

    const normalizedCode =
      verificationCode.replace(/\D/g, "");

    if (normalizedCode.length !== 6) {
      setVerificationError(
        "Digite o código de 6 dígitos enviado para o seu e-mail."
      );
      return;
    }

    setVerificationSubmitting(true);
    setVerificationError("");
    setVerificationMessage("");

    try {
      const csrf = await getCsrfToken();

      const response = await fetch(
        `${API_URL}/api/customer-auth/email-verification/verify`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            [csrf.headerName]: csrf.token,
          },
          body: JSON.stringify({
            code: normalizedCode,
          }),
        }
      );

      const responseText = await response.text();

      let data: any = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          // Mantém mensagem genérica abaixo.
        }
      }

      if (!response.ok) {
        throw new Error(
          data?.message ??
            "Não foi possível verificar o e-mail."
        );
      }

      setVerificationCode("");
      setVerificationMessage(
        data?.message ??
          "E-mail verificado com sucesso."
      );
      setCustomer(data);
    } catch (error) {
      setVerificationError(
        error instanceof Error
          ? error.message
          : "Não foi possível verificar o e-mail."
      );
    } finally {
      setVerificationSubmitting(false);
    }
  }

  async function handleResendVerificationCode() {
    if (
      verificationCooldown > 0 ||
      verificationSending ||
      verificationSubmitting
    ) {
      return;
    }

    await sendVerificationCode(true);
  }

  // =========================
  // RECUPERAÇÃO DE SENHA
  // =========================

  async function handleRequestPasswordReset(
    event: FormEvent
  ) {
    event.preventDefault();

    if (resetSubmitting) {
      return;
    }

    const normalizedEmail =
      resetEmail.trim();

    if (!normalizedEmail) {
      setResetError("Informe seu e-mail.");
      return;
    }

    setResetSubmitting(true);
    setResetError("");
    setResetMessage("");

    try {
      const csrf = await getCsrfToken();

      const response = await fetch(
        `${API_URL}/api/customer-auth/password-reset/request`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            [csrf.headerName]: csrf.token,
          },
          body: JSON.stringify({
            email: normalizedEmail,
          }),
        }
      );

      const responseText =
        await response.text();

      let data: any = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          // Mantém mensagem genérica abaixo.
        }
      }

      if (!response.ok) {
        throw new Error(
          data?.message ??
            "Não foi possível solicitar a recuperação de senha."
        );
      }

      setResetEmail(normalizedEmail);
      setResetCode("");
      setResetNewPassword("");
      setResetConfirmPassword("");
      setResetMessage(
        data?.message ??
          "Se existir uma conta com esse e-mail, enviaremos um código de recuperação."
      );
      setMode("reset");
    } catch (error) {
      setResetError(
        error instanceof Error
          ? error.message
          : "Não foi possível solicitar a recuperação de senha."
      );
    } finally {
      setResetSubmitting(false);
    }
  }

  async function handleResetPassword(
    event: FormEvent
  ) {
    event.preventDefault();

    if (resetSubmitting) {
      return;
    }

    const normalizedCode =
      resetCode.replace(/\D/g, "");

    if (normalizedCode.length !== 6) {
      setResetError(
        "Digite o código de 6 dígitos enviado para o seu e-mail."
      );
      return;
    }

    if (resetNewPassword.length < 8) {
      setResetError(
        "A nova senha deve ter pelo menos 8 caracteres."
      );
      return;
    }

    if (
      resetNewPassword !==
      resetConfirmPassword
    ) {
      setResetError(
        "A confirmação da nova senha não confere."
      );
      return;
    }

    setResetSubmitting(true);
    setResetError("");
    setResetMessage("");

    try {
      const csrf = await getCsrfToken();

      const validateResponse = await fetch(
        `${API_URL}/api/customer-auth/password-reset/validate`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            [csrf.headerName]: csrf.token,
          },
          body: JSON.stringify({
            email: resetEmail.trim(),
            code: normalizedCode,
          }),
        }
      );

      const validateText =
        await validateResponse.text();

      let validateData: any = {};

      if (validateText) {
        try {
          validateData =
            JSON.parse(validateText);
        } catch {
          // Mantém mensagem genérica abaixo.
        }
      }

      if (!validateResponse.ok) {
        throw new Error(
          validateData?.message ??
            "Código de recuperação inválido ou expirado."
        );
      }

      const resetResponse = await fetch(
        `${API_URL}/api/customer-auth/password-reset/reset`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            [csrf.headerName]: csrf.token,
          },
          body: JSON.stringify({
            email: resetEmail.trim(),
            code: normalizedCode,
            newPassword: resetNewPassword,
          }),
        }
      );

      const resetText =
        await resetResponse.text();

      let resetData: any = {};

      if (resetText) {
        try {
          resetData =
            JSON.parse(resetText);
        } catch {
          // Mantém mensagem genérica abaixo.
        }
      }

      if (!resetResponse.ok) {
        throw new Error(
          resetData?.message ??
            "Não foi possível redefinir sua senha."
        );
      }

      setEmail(resetEmail.trim());
      setPassword("");
      setResetCode("");
      setResetNewPassword("");
      setResetConfirmPassword("");
      setResetError("");
      setResetMessage("");
      setError("");
      setMode("login");
    } catch (error) {
      setResetError(
        error instanceof Error
          ? error.message
          : "Não foi possível redefinir sua senha."
      );
    } finally {
      setResetSubmitting(false);
    }
  }

  // =========================
  // LOGIN
  // =========================

  async function handleLogin(
    event: FormEvent
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/api/customer-auth/login`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              email,
              password,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ??
            "Não foi possível entrar."
        );
      }

      setCustomer(data);

      setPassword("");

      if (data?.emailVerified === false) {
        setVerificationCode("");
        setVerificationError("");
        setVerificationMessage("");

        await sendVerificationCode(false);
      }

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar."
      );

    } finally {
      setSubmitting(false);
    }
  }

  // =========================
  // CADASTRO
  // =========================

  async function handleRegister(
    event: FormEvent
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/api/customer-auth/register`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              name,
              email,
              phone,
              password,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ??
            "Não foi possível criar a conta."
        );
      }

      setCustomer(data);

      setPassword("");
      setVerificationCode("");
      setVerificationError("");
      setVerificationMessage("");

      if (data?.emailVerified === false) {
        await sendVerificationCode(false);
      }

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível criar a conta."
      );

    } finally {
      setSubmitting(false);
    }
  }

  // =========================
  // LOGOUT
  // =========================

  async function handleLogout() {
    try {
      await fetch(
        `${API_URL}/api/customer-auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );
    } finally {
      setCustomer(null);
      setMode("login");

      setVerificationCode("");
      setVerificationError("");
      setVerificationMessage("");
      setVerificationCooldown(0);

      setOrders([]);
      setOrdersOpen(false);
      setOrdersError("");

      setLoyalty(null);
      setLoyaltyOpen(false);
      setLoyaltyError("");
      setRedeemMessage("");
      setRedeemError("");
      setRedeemingStoreId(null);
    }
  }

  // =========================
  // CARREGANDO
  // =========================

  if (loadingSession) {
    return (
      <main className="min-h-screen bg-background px-4 py-12 text-foreground">
        <div className="mx-auto max-w-4xl">
          <div className="skeleton h-10 w-48 rounded-xl" />

          <div className="mt-8 grid gap-6 md:grid-cols-[1fr_360px]">
            <div className="skeleton h-72 rounded-[28px]" />
            <div className="skeleton h-72 rounded-[28px]" />
          </div>
        </div>
      </main>
    );
  }

  // =========================
  // VERIFICAÇÃO DE E-MAIL
  // =========================

  if (
    customer &&
    !customer.emailVerified &&
    !customer.googleConnected
  ) {
    return (
      <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={goBackToStore}
            className="text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Voltar ao cardápio
          </button>

          <div className="mt-6 rounded-[30px] border border-border bg-card p-6 shadow-[0_18px_60px_-30px] shadow-foreground/40 sm:p-8">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-3xl">
              ✉
            </div>

            <p className="mt-6 text-center font-mono-brand text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Verificação de e-mail
            </p>

            <h1 className="mt-2 text-center font-display text-4xl tracking-tight">
              Confira seu e-mail
            </h1>

            <p className="mt-3 text-center text-sm leading-6 text-muted-foreground">
              Enviamos um código de 6 dígitos para
              <br />
              <strong className="text-foreground">
                {customer.email}
              </strong>
            </p>

            <form
              onSubmit={handleVerifyEmail}
              className="mt-7"
            >
              <label className="block text-center text-sm font-bold">
                Código de verificação
              </label>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={verificationCode}
                onChange={(event) => {
                  const value =
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6);

                  setVerificationCode(value);
                  setVerificationError("");
                }}
                autoFocus
                className="mt-3 h-16 w-full rounded-2xl border border-border bg-background px-4 text-center font-mono text-3xl font-bold tracking-[0.35em] outline-none transition focus:border-primary"
                placeholder="000000"
              />

              {verificationError && (
                <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                  <p className="text-sm font-semibold text-destructive">
                    {verificationError}
                  </p>
                </div>
              )}

              {verificationMessage && (
                <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-primary">
                    {verificationMessage}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  verificationSubmitting ||
                  verificationSending ||
                  verificationCode.length !== 6
                }
                className="brand-button mt-5 min-h-12 w-full rounded-2xl px-5 py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {verificationSubmitting
                  ? "Verificando..."
                  : "Verificar e-mail"}
              </button>
            </form>

            <div className="mt-6 border-t border-border pt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Não recebeu o código?
              </p>

              <button
                type="button"
                onClick={() =>
                  void handleResendVerificationCode()
                }
                disabled={
                  verificationCooldown > 0 ||
                  verificationSending ||
                  verificationSubmitting
                }
                className="mt-2 text-sm font-bold text-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                {verificationSending
                  ? "Enviando..."
                  : verificationCooldown > 0
                    ? `Reenviar em ${verificationCooldown}s`
                    : "Reenviar código"}
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-secondary p-4">
              <p className="text-center text-xs leading-5 text-muted-foreground">
                O código expira em 15 minutos. Você precisa confirmar seu e-mail para acessar sua conta.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void handleLogout()
              }
              className="mt-5 w-full text-center text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              Sair da conta
            </button>
          </div>
        </div>
      </main>
    );
  }

  // =========================
  // CLIENTE LOGADO
  // =========================

  if (customer) {
    return (
      <main className="min-h-screen bg-background pb-16 text-foreground">
        <header className="border-b border-border bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={
                goBackToStore
              }
              className="text-sm font-bold"
            >
              ← Voltar ao cardápio
            </button>

            <span className="font-display text-2xl tracking-tight">
              Minha conta
            </span>

            <button
              type="button"
              onClick={() =>
                void handleLogout()
              }
              className="text-sm font-bold text-primary"
            >
              Sair
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <section className="rounded-[30px] border border-border bg-card p-6 shadow-[0_18px_60px_-30px] shadow-foreground/40 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-3xl font-bold text-primary-foreground">
                {customer.profileImageUrl ? (
                  <img
                    src={
                      customer.profileImageUrl
                    }
                    alt={customer.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  customer.name
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>

              <div>
                <p className="font-mono-brand text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Cliente
                </p>

                <h1 className="mt-1 font-display text-4xl tracking-tight sm:text-5xl">
                  Olá,{" "}
                  {customer.name}
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                  {customer.email}
                </p>
              </div>
            </div>
          </section>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <button
              type="button"
              onClick={() =>
                void loadOrders()
              }
              className="rounded-[26px] border border-border bg-card p-6 text-left shadow-[0_14px_45px_-30px] shadow-foreground/40 transition-transform hover:-translate-y-0.5"
            >
              <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Histórico
              </p>

              <h2 className="mt-2 font-display text-2xl tracking-tight">
                Meus pedidos
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Acompanhe pedidos feitos com sua conta.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                void loadLoyalty()
              }
              className="relative overflow-hidden rounded-[26px] border border-border bg-card p-6 text-left shadow-[0_14px_45px_-30px] shadow-foreground/40 transition-transform hover:-translate-y-0.5"
            >
              <div className="absolute -right-4 -top-6 text-7xl opacity-[0.06]">
                ★
              </div>

              <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Fidelidade
              </p>

              <h2 className="mt-2 font-display text-2xl tracking-tight">
                Meus pontos
              </h2>

              {loyalty ? (
                <p className="mt-2 font-display text-3xl tracking-tight text-primary">
                  {loyalty.totalPoints}{" "}
                  {loyalty.totalPoints === 1
                    ? "ponto"
                    : "pontos"}
                </p>
              ) : (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Veja seus pontos e benefícios em cada loja.
                </p>
              )}
            </button>

            <button
              type="button"
              onClick={openProfile}
              className="rounded-[26px] border border-border bg-card p-6 text-left shadow-[0_14px_45px_-30px] shadow-foreground/40 transition-transform hover:-translate-y-0.5"
            >
              <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Perfil
              </p>

              <h2 className="mt-2 font-display text-2xl tracking-tight">
                Meus dados
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Altere seu nome, telefone, e-mail e senha.
              </p>
            </button>
          </div>

          {profileOpen && (
            <section className="mt-6 rounded-[28px] border border-border bg-card p-6 sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                    Perfil
                  </p>

                  <h2 className="mt-1 font-display text-3xl tracking-tight">
                    Meus dados
                  </h2>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Atualize as informações usadas na sua conta.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="self-start rounded-full border border-border px-4 py-2 text-sm font-bold transition-colors hover:bg-secondary"
                >
                  Fechar
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold">
                    Nome
                  </span>
                  <input
                    value={profileName}
                    onChange={(event) =>
                      setProfileName(event.target.value)
                    }
                    autoComplete="name"
                    className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
                    placeholder="Seu nome"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold">
                    Telefone
                  </span>
                  <input
                    value={profilePhone}
                    onChange={(event) =>
                      setProfilePhone(event.target.value)
                    }
                    autoComplete="tel"
                    className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
                    placeholder="(19) 99999-9999"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-sm font-bold">
                    E-mail
                  </span>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(event) =>
                      setProfileEmail(event.target.value)
                    }
                    autoComplete="email"
                    className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
                    placeholder="voce@email.com"
                  />
                </label>
              </div>

              <div className="mt-7 border-t border-border pt-6">
                <div>
                  <p className="font-display text-xl tracking-tight">
                    Alterar senha
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Deixe estes campos vazios se não quiser trocar sua senha.
                  </p>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-sm font-bold">
                      Senha atual
                    </span>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(event) =>
                        setCurrentPassword(event.target.value)
                      }
                      autoComplete="current-password"
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
                      placeholder="Sua senha atual"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold">
                      Nova senha
                    </span>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) =>
                        setNewPassword(event.target.value)
                      }
                      autoComplete="new-password"
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
                      placeholder="Mínimo 8 caracteres"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold">
                      Confirmar nova senha
                    </span>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(event) =>
                        setConfirmNewPassword(event.target.value)
                      }
                      autoComplete="new-password"
                      className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary"
                      placeholder="Repita a nova senha"
                    />
                  </label>
                </div>
              </div>

              {profileError && (
                <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-semibold text-red-600">
                  {profileError}
                </div>
              )}

              {profileMessage && (
                <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary">
                  {profileMessage}
                </div>
              )}

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  disabled={savingProfile}
                  className="rounded-full border border-border px-5 py-3 text-sm font-bold transition-colors hover:bg-secondary disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => void saveProfile()}
                  disabled={savingProfile}
                  className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingProfile
                    ? "Salvando..."
                    : "Salvar alterações"}
                </button>
              </div>
            </section>
          )}

          {loyaltyOpen && (
            <section className="mt-6 rounded-[28px] border border-border bg-card p-6 sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                    Fidelidade
                  </p>

                  <h2 className="mt-1 font-display text-3xl tracking-tight">
                    Meus pontos
                  </h2>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Acompanhe seus pontos e o histórico de cada loja.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setLoyaltyOpen(false)
                  }
                  className="self-start rounded-full border border-border px-4 py-2 text-sm font-bold transition-colors hover:bg-secondary"
                >
                  Fechar
                </button>
              </div>

              {loadingLoyalty ? (
                <div className="mt-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="skeleton h-28 rounded-2xl" />
                    <div className="skeleton h-28 rounded-2xl" />
                    <div className="skeleton h-28 rounded-2xl" />
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="skeleton h-24 rounded-2xl" />
                    <div className="skeleton h-24 rounded-2xl" />
                  </div>
                </div>
              ) : loyaltyError ? (
                <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-primary">
                    {loyaltyError}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      void loadLoyalty()
                    }
                    className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : !loyalty ? (
                <div className="mt-6 rounded-2xl bg-secondary p-5">
                  <p className="font-bold">
                    Não foi possível encontrar seus pontos.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[22px] bg-primary p-5 text-primary-foreground">
                      <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">
                        Saldo atual
                      </p>

                      <p className="mt-2 font-display text-4xl tracking-tight">
                        {loyalty.totalPoints}
                      </p>

                      <p className="mt-1 text-sm font-semibold opacity-90">
                        {loyalty.totalPoints === 1
                          ? "ponto disponível"
                          : "pontos disponíveis"}
                      </p>
                    </div>

                    <div className="rounded-[22px] bg-secondary p-5">
                      <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        Total conquistado
                      </p>

                      <p className="mt-2 font-display text-4xl tracking-tight">
                        {loyalty.totalLifetimePoints}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        pontos desde o início
                      </p>
                    </div>

                    <div className="rounded-[22px] bg-secondary p-5">
                      <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        Recompensas
                      </p>

                      <p className="mt-2 font-display text-4xl tracking-tight">
                        {loyalty.totalRewardsRedeemed}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        resgatadas até agora
                      </p>
                    </div>
                  </div>

                  {redeemMessage && (
                    <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                      <p className="text-sm font-semibold text-primary">
                        {redeemMessage}
                      </p>
                    </div>
                  )}

                  {redeemError && (
                    <div className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                      <p className="text-sm font-semibold text-destructive">
                        {redeemError}
                      </p>
                    </div>
                  )}

                  {loyalty.accounts.length === 0 ? (
                    <div className="mt-6 rounded-2xl bg-secondary p-5">
                      <p className="font-bold">
                        Você ainda não possui pontos.
                      </p>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Quando um pedido elegível for aprovado, seus pontos aparecerão aqui.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-5">
                      {loyalty.accounts.map(
                        (account) => (
                          <article
                            key={account.id}
                            className="overflow-hidden rounded-[24px] border border-border bg-background"
                          >
                            <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                  Loja
                                </p>

                                <h3 className="mt-1 font-display text-2xl tracking-tight">
                                  {account.storeName ??
                                    "Loja"}
                                </h3>
                              </div>

                              <div className="sm:text-right">
                                <p className="font-display text-3xl tracking-tight text-primary">
                                  {account.points}{" "}
                                  {account.points === 1
                                    ? "ponto"
                                    : "pontos"}
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                  {account.lifetimePoints} conquistados no total
                                </p>
                              </div>
                            </div>

                            {account.loyaltyEnabled && (
                              <div className="border-b border-border p-5">
                                <div className="rounded-[22px] bg-secondary p-5">
                                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                        Recompensa
                                      </p>

                                      <h4 className="mt-1 font-display text-2xl tracking-tight">
                                        {account.rewardDescription?.trim() ||
                                          "Recompensa da fidelidade"}
                                      </h4>

                                      <p className="mt-2 text-sm text-muted-foreground">
                                        {account.rewardAvailable
                                          ? `Você completou ${account.stampGoal} pontos e já pode resgatar.`
                                          : `Faltam ${account.pointsMissing} ${
                                              account.pointsMissing === 1
                                                ? "ponto"
                                                : "pontos"
                                            } para resgatar.`}
                                      </p>

                                      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-background">
                                        <div
                                          className="h-full rounded-full bg-primary transition-all"
                                          style={{
                                            width: `${Math.min(
                                              100,
                                              account.stampGoal > 0
                                                ? (account.points / account.stampGoal) * 100
                                                : 0
                                            )}%`,
                                          }}
                                        />
                                      </div>

                                      <p className="mt-2 text-xs font-semibold text-muted-foreground">
                                        {Math.min(account.points, account.stampGoal)}/{account.stampGoal} pontos
                                      </p>
                                    </div>

                                    <button
                                      type="button"
                                      disabled={
                                        !account.rewardAvailable ||
                                        redeemingStoreId !== null
                                      }
                                      onClick={() =>
                                        void redeemReward(account)
                                      }
                                      className="min-h-12 shrink-0 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {redeemingStoreId === account.storeId
                                        ? "Resgatando..."
                                        : account.rewardAvailable
                                          ? "Resgatar recompensa"
                                          : "Ainda não disponível"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {(loyalty.redemptions ?? []).filter(
                              (redemption) =>
                                redemption.storeId === account.storeId
                            ).length > 0 && (
                              <div className="border-t border-border p-5">
                                <div className="flex items-end justify-between gap-3">
                                  <div>
                                    <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                      Resgates
                                    </p>

                                    <h4 className="mt-1 font-display text-xl tracking-tight">
                                      Minhas recompensas
                                    </h4>
                                  </div>

                                  <span className="text-xs font-semibold text-muted-foreground">
                                    {
                                      (loyalty.redemptions ?? []).filter(
                                        (redemption) =>
                                          redemption.storeId === account.storeId
                                      ).length
                                    }{" "}
                                    resgate(s)
                                  </span>
                                </div>

                                <div className="mt-4 space-y-3">
                                  {[...(loyalty.redemptions ?? [])]
                                    .filter(
                                      (redemption) =>
                                        redemption.storeId === account.storeId
                                    )
                                    .sort((a, b) => {
                                      if (
                                        a.status === "PENDING" &&
                                        b.status !== "PENDING"
                                      ) {
                                        return -1;
                                      }

                                      if (
                                        b.status === "PENDING" &&
                                        a.status !== "PENDING"
                                      ) {
                                        return 1;
                                      }

                                      return (
                                        new Date(b.createdAt).getTime() -
                                        new Date(a.createdAt).getTime()
                                      );
                                    })
                                    .map((redemption) => {
                                      const isPending =
                                        redemption.status === "PENDING";

                                      const isUsed =
                                        redemption.status === "USED";

                                      const isCancelled =
                                        redemption.status === "CANCELLED";

                                      if (isPending) {
                                        return (
                                          <article
                                            key={redemption.id}
                                            className="rounded-[20px] border border-primary/20 bg-secondary p-4"
                                          >
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                              <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                  <span className="rounded-full bg-primary px-3 py-1 font-mono-brand text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                                                    Aguardando utilização
                                                  </span>
                                                </div>

                                                <h5 className="mt-3 font-display text-xl tracking-tight">
                                                  {redemption.rewardDescription}
                                                </h5>

                                                <p className="mt-1 text-xs text-muted-foreground">
                                                  Resgatada em{" "}
                                                  {formatDate(
                                                    redemption.createdAt
                                                  )}
                                                </p>

                                                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                                                  Apresente esta recompensa à loja para utilizar o benefício.
                                                </p>
                                              </div>

                                              <div className="shrink-0 sm:text-right">
                                                <p className="font-display text-2xl tracking-tight">
                                                  -{redemption.pointsUsed}
                                                </p>

                                                <p className="text-[11px] font-semibold text-muted-foreground">
                                                  pontos utilizados
                                                </p>
                                              </div>
                                            </div>
                                          </article>
                                        );
                                      }

                                      return (
                                        <article
                                          key={redemption.id}
                                          className="rounded-[18px] bg-secondary px-4 py-3"
                                        >
                                          <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                              <div className="flex flex-wrap items-center gap-2">
                                                <span className="rounded-full bg-background px-2.5 py-1 font-mono-brand text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
                                                  {isUsed
                                                    ? "Utilizada"
                                                    : isCancelled
                                                      ? "Cancelada"
                                                      : redemptionStatusLabel(
                                                          redemption.status
                                                        )}
                                                </span>
                                              </div>

                                              <h5 className="mt-2 font-display text-lg tracking-tight">
                                                {redemption.rewardDescription}
                                              </h5>

                                              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                                <span>
                                                  Resgatada em{" "}
                                                  {formatDate(
                                                    redemption.createdAt
                                                  )}
                                                </span>

                                                {isUsed &&
                                                  redemption.usedAt && (
                                                    <span>
                                                      • Utilizada em{" "}
                                                      {formatDate(
                                                        redemption.usedAt
                                                      )}
                                                    </span>
                                                  )}

                                                {isCancelled &&
                                                  redemption.cancelledAt && (
                                                    <span>
                                                      • Cancelada em{" "}
                                                      {formatDate(
                                                        redemption.cancelledAt
                                                      )}
                                                    </span>
                                                  )}
                                              </div>
                                            </div>

                                            <div className="shrink-0 text-right">
                                              {isCancelled ? (
                                                <>
                                                  <p className="font-display text-2xl tracking-tight text-primary">
                                                    +{redemption.pointsUsed}
                                                  </p>

                                                  <p className="text-[11px] font-semibold text-primary">
                                                    pontos devolvidos
                                                  </p>
                                                </>
                                              ) : (
                                                <>
                                                  <p className="font-display text-2xl tracking-tight">
                                                    -{redemption.pointsUsed}
                                                  </p>

                                                  <p className="text-[11px] font-semibold text-muted-foreground">
                                                    pontos utilizados
                                                  </p>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </article>
                                      );
                                    })}
                                </div>
                              </div>
                            )}

                            <div className="p-5">
                              <div className="flex items-center justify-between gap-3">
                                <h4 className="font-display text-xl tracking-tight">
                                  Histórico de pontos
                                </h4>

                                <span className="text-xs font-semibold text-muted-foreground">
                                  {account.transactions.length}{" "}
                                  {account.transactions.length === 1
                                    ? "movimentação"
                                    : "movimentações"}
                                </span>
                              </div>

                              {account.transactions.length === 0 ? (
                                <div className="mt-4 rounded-2xl bg-secondary p-4">
                                  <p className="text-sm text-muted-foreground">
                                    Nenhuma movimentação registrada ainda.
                                  </p>
                                </div>
                              ) : (
                                <div className="mt-4 space-y-3">
                                  {account.transactions.map(
                                    (transaction) => (
                                      <div
                                        key={transaction.id}
                                        className="flex flex-col gap-4 rounded-2xl bg-secondary p-4 sm:flex-row sm:items-center sm:justify-between"
                                      >
                                        <div className="min-w-0">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-background px-3 py-1 font-mono-brand text-[9px] font-bold uppercase tracking-wider">
                                              {transactionTypeLabel(
                                                transaction.type
                                              )}
                                            </span>

                                            {transaction.orderId != null && (
                                              <span className="text-xs font-bold text-muted-foreground">
                                                Pedido #{transaction.orderId}
                                              </span>
                                            )}
                                          </div>

                                          <p className="mt-3 text-sm font-semibold">
                                            {transaction.description ??
                                              "Movimentação de pontos"}
                                          </p>

                                          <p className="mt-1 text-xs text-muted-foreground">
                                            {formatDate(
                                              transaction.createdAt
                                            )}
                                          </p>
                                        </div>

                                        <div className="shrink-0 sm:text-right">
                                          <p
                                            className={`font-display text-3xl tracking-tight ${
                                              transaction.points >= 0
                                                ? "text-primary"
                                                : "text-foreground"
                                            }`}
                                          >
                                            {transaction.points > 0
                                              ? "+"
                                              : ""}
                                            {transaction.points}
                                          </p>

                                          <p className="text-xs font-semibold text-muted-foreground">
                                            {Math.abs(
                                              transaction.points
                                            ) === 1
                                              ? "ponto"
                                              : "pontos"}
                                          </p>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          </article>
                        )
                      )}
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {ordersOpen && (
            <section className="mt-6 rounded-[28px] border border-border bg-card p-6 sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono-brand text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Histórico
                  </p>

                  <h2 className="mt-1 font-display text-3xl tracking-tight">
                    Meus pedidos
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setOrdersOpen(false)
                  }
                  className="self-start rounded-full border border-border px-4 py-2 text-sm font-bold transition-colors hover:bg-secondary"
                >
                  Fechar
                </button>
              </div>

              {loadingOrders ? (
                <div className="mt-6 space-y-3">
                  <div className="skeleton h-28 rounded-2xl" />
                  <div className="skeleton h-28 rounded-2xl" />
                </div>
              ) : ordersError ? (
                <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-primary">
                    {ordersError}
                  </p>
                </div>
              ) : orders.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-secondary p-5">
                  <p className="font-bold">
                    Você ainda não tem pedidos vinculados a esta conta.
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Os próximos pedidos feitos enquanto você estiver logado aparecerão aqui.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {orders.map(
                    (order) => (
                      <article
                        key={order.id}
                        className="rounded-2xl border border-border bg-background p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-foreground px-3 py-1 font-mono-brand text-[10px] font-bold uppercase tracking-wider text-background">
                                Pedido #{order.id}
                              </span>

                              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">
                                {orderStatusLabel(
                                  order.status
                                )}
                              </span>
                            </div>

                            <h3 className="mt-3 truncate font-display text-2xl tracking-tight">
                              {order.storeName ??
                                "Loja"}
                            </h3>

                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatOrderDate(
                                order.createdAt
                              )}
                            </p>
                          </div>

                          <div className="sm:text-right">
                            <p className="font-display text-2xl tracking-tight text-primary">
                              {formatMoney(
                                order.total
                              )}
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                openOrder(
                                  order
                                )
                              }
                              className="mt-3 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-transform active:scale-95"
                            >
                              Ver pedido
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  )}
                </div>
              )}
            </section>
          )}

          <section className="mt-6 rounded-[28px] border border-border bg-card p-6">
            <h2 className="font-display text-2xl tracking-tight">
              Status da conta
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-secondary p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  E-mail
                </p>

                <p className="mt-1 font-semibold">
                  {customer.emailVerified
                    ? "Verificado"
                    : "Ainda não verificado"}
                </p>
              </div>

              <div className="rounded-2xl bg-secondary p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Google
                </p>

                <p className="mt-1 font-semibold">
                  {customer.googleConnected
                    ? "Conectado"
                    : "Não conectado"}
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // =========================
  // LOGIN / CADASTRO / RECUPERAÇÃO
  // =========================

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogleSignIn}
      />

      <div className="mx-auto max-w-lg">
        <button
          type="button"
          onClick={
            mode === "forgot" || mode === "reset"
              ? () => {
                  setMode("login");
                  setResetError("");
                  setResetMessage("");
                }
              : goBackToStore
          }
          className="text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          {mode === "forgot" || mode === "reset"
            ? "← Voltar ao login"
            : "← Voltar ao cardápio"}
        </button>

        <div className="mt-6 rounded-[30px] border border-border bg-card p-6 shadow-[0_18px_60px_-30px] shadow-foreground/40 sm:p-8">
          <p className="font-mono-brand text-xs font-bold uppercase tracking-[0.18em] text-primary">
            PizzaSystem
          </p>

          <h1 className="mt-2 font-display text-4xl tracking-tight">
            {mode === "login"
              ? "Entrar na sua conta"
              : mode === "register"
                ? "Criar sua conta"
                : mode === "forgot"
                  ? "Recuperar senha"
                  : "Criar nova senha"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {mode === "forgot"
              ? "Informe o e-mail da sua conta. Se ele estiver cadastrado, enviaremos um código de recuperação."
              : mode === "reset"
                ? `Digite o código de 6 dígitos enviado para ${resetEmail} e escolha uma nova senha.`
                : "A conta é opcional. Você pode continuar comprando sem login normalmente."}
          </p>

          {(mode === "login" || mode === "register") && (
            <div className="mt-6 grid grid-cols-2 rounded-2xl bg-secondary p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                  mode === "login"
                    ? "bg-card shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Entrar
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                  mode === "register"
                    ? "bg-card shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Criar conta
              </button>
            </div>
          )}

          {mode === "forgot" ? (
            <form
              onSubmit={handleRequestPasswordReset}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="text-sm font-bold">
                  E-mail
                </label>

                <input
                  type="email"
                  value={resetEmail}
                  onChange={(event) => {
                    setResetEmail(event.target.value);
                    setResetError("");
                  }}
                  required
                  autoComplete="email"
                  autoFocus
                  className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none transition focus:border-primary"
                  placeholder="voce@email.com"
                />
              </div>

              {resetError && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                  <p className="text-sm font-semibold text-destructive">
                    {resetError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={resetSubmitting}
                className="brand-button min-h-12 w-full rounded-2xl px-5 py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resetSubmitting
                  ? "Enviando..."
                  : "Enviar código"}
              </button>
            </form>
          ) : mode === "reset" ? (
            <form
              onSubmit={handleResetPassword}
              className="mt-6 space-y-4"
            >
              {resetMessage && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-primary">
                    {resetMessage}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-bold">
                  Código de recuperação
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={resetCode}
                  onChange={(event) => {
                    setResetCode(
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    );
                    setResetError("");
                  }}
                  autoFocus
                  className="mt-2 h-16 w-full rounded-2xl border border-border bg-background px-4 text-center font-mono text-3xl font-bold tracking-[0.35em] outline-none transition focus:border-primary"
                  placeholder="000000"
                />
              </div>

              <div>
                <label className="text-sm font-bold">
                  Nova senha
                </label>

                <input
                  type="password"
                  value={resetNewPassword}
                  onChange={(event) => {
                    setResetNewPassword(event.target.value);
                    setResetError("");
                  }}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none transition focus:border-primary"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div>
                <label className="text-sm font-bold">
                  Confirmar nova senha
                </label>

                <input
                  type="password"
                  value={resetConfirmPassword}
                  onChange={(event) => {
                    setResetConfirmPassword(event.target.value);
                    setResetError("");
                  }}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none transition focus:border-primary"
                  placeholder="Repita a nova senha"
                />
              </div>

              {resetError && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                  <p className="text-sm font-semibold text-destructive">
                    {resetError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  resetSubmitting ||
                  resetCode.length !== 6
                }
                className="brand-button min-h-12 w-full rounded-2xl px-5 py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resetSubmitting
                  ? "Alterando senha..."
                  : "Redefinir senha"}
              </button>

              <button
                type="button"
                disabled={resetSubmitting}
                onClick={() => {
                  setMode("forgot");
                  setResetCode("");
                  setResetNewPassword("");
                  setResetConfirmPassword("");
                  setResetError("");
                  setResetMessage("");
                }}
                className="w-full text-center text-sm font-bold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                Solicitar outro código
              </button>
            </form>
          ) : (
            <>
              <form
                onSubmit={
                  mode === "login"
                    ? handleLogin
                    : handleRegister
                }
                className="mt-6 space-y-4"
              >
                {mode === "register" && (
                  <>
                    <div>
                      <label className="text-sm font-bold">
                        Nome
                      </label>

                      <input
                        type="text"
                        value={name}
                        onChange={(event) =>
                          setName(
                            event.target.value
                          )
                        }
                        required
                        className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none transition focus:border-primary"
                        placeholder="Seu nome"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold">
                        Telefone
                      </label>

                      <input
                        type="tel"
                        value={phone}
                        onChange={(event) =>
                          setPhone(
                            event.target.value
                          )
                        }
                        className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none transition focus:border-primary"
                        placeholder="(19) 99999-9999"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="text-sm font-bold">
                    E-mail
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    required
                    className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none transition focus:border-primary"
                    placeholder="voce@email.com"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-bold">
                      Senha
                    </label>

                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(email.trim());
                          setResetCode("");
                          setResetNewPassword("");
                          setResetConfirmPassword("");
                          setResetError("");
                          setResetMessage("");
                          setError("");
                          setMode("forgot");
                        }}
                        className="text-xs font-bold text-primary"
                      >
                        Esqueci minha senha
                      </button>
                    )}
                  </div>

                  <input
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    required
                    minLength={8}
                    className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 outline-none transition focus:border-primary"
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>

                {error && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <p className="text-sm font-semibold text-primary">
                      {error}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="brand-button min-h-12 w-full rounded-2xl px-5 py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Aguarde..."
                    : mode === "login"
                      ? "Entrar"
                      : "Criar conta"}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />

                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  ou
                </span>

                <div className="h-px flex-1 bg-border" />
              </div>

              <div
                className={`flex min-h-12 w-full items-center justify-center ${
                  submitting
                    ? "pointer-events-none opacity-50"
                    : ""
                }`}
              >
                <div
                  ref={googleButtonRef}
                  className="flex w-full justify-center"
                />
              </div>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Use sua conta Google para entrar ou criar sua conta automaticamente.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ContaPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background px-4 py-12 text-foreground">
          <div className="mx-auto max-w-4xl">
            <div className="skeleton h-10 w-48 rounded-xl" />

            <div className="mt-8 grid gap-6 md:grid-cols-[1fr_360px]">
              <div className="skeleton h-72 rounded-[28px]" />
              <div className="skeleton h-72 rounded-[28px]" />
            </div>
          </div>
        </main>
      }
    >
      <ContaContent />
    </Suspense>
  );
}
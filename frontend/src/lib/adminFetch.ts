type CsrfResponse = {
  token: string;
  headerName: string;
  parameterName: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8080";

let cachedCsrfToken:
  CsrfResponse | null = null;

let csrfRequest:
  Promise<CsrfResponse> | null = null;

/* =========================
   TOKEN CSRF
========================= */

async function fetchCsrfToken():
Promise<CsrfResponse> {
  const response =
    await fetch(
      `${API_URL}/api/auth/csrf`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",

        headers: {
          Accept:
            "application/json",
        },
      }
    );

  if (!response.ok) {
    throw new Error(
      "Não foi possível obter o token de segurança."
    );
  }

  const data:
    CsrfResponse =
    await response.json();

  if (
    !data?.token ||
    !data?.headerName
  ) {
    throw new Error(
      "Resposta de segurança inválida."
    );
  }

  cachedCsrfToken =
    data;

  return data;
}

async function getCsrfToken():
Promise<CsrfResponse> {
  if (cachedCsrfToken) {
    return cachedCsrfToken;
  }

  /*
   * Evita várias chamadas simultâneas ao endpoint
   * de CSRF quando múltiplas ações começam juntas.
   */
  if (!csrfRequest) {
    csrfRequest =
      fetchCsrfToken()
        .finally(() => {
          csrfRequest = null;
        });
  }

  return csrfRequest;
}

/* =========================
   HELPERS
========================= */

function isUnsafeMethod(
  method: string
) {
  return (
    method === "POST" ||
    method === "PUT" ||
    method === "PATCH" ||
    method === "DELETE"
  );
}

function isSameOriginAdminRequest(
  input: string
) {
  try {
    const requestUrl =
      new URL(
        input,
        window.location.origin
      );

    const apiUrl =
      new URL(
        API_URL,
        window.location.origin
      );

    return (
      requestUrl.origin ===
      apiUrl.origin
    );

  } catch {
    return false;
  }
}

/* =========================
   FETCH ADMINISTRATIVO
========================= */

export async function adminFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const method =
    (
      init.method ??
      "GET"
    ).toUpperCase();

  const headers =
    new Headers(
      init.headers
    );

  headers.set(
    "Accept",
    headers.get(
      "Accept"
    ) ??
      "application/json"
  );

  /*
   * Só anexa o CSRF em métodos que alteram estado
   * e apenas para o backend configurado do sistema.
   */
  if (
    isUnsafeMethod(
      method
    ) &&
    isSameOriginAdminRequest(
      input
    )
  ) {
    const csrf =
      await getCsrfToken();

    headers.set(
      csrf.headerName,
      csrf.token
    );
  }

  let response =
    await fetch(
      input,
      {
        ...init,

        method,

        headers,

        credentials:
          "include",
      }
    );

  /*
   * Se o backend invalidar/rotacionar o token CSRF,
   * limpamos o cache e tentamos UMA vez novamente.
   *
   * Não repetimos automaticamente em 401 para evitar
   * mascarar sessão expirada.
   */
  if (
    response.status ===
      403 &&
    isUnsafeMethod(
      method
    ) &&
    isSameOriginAdminRequest(
      input
    )
  ) {
    clearAdminCsrfToken();

    const retryHeaders =
      new Headers(
        init.headers
      );

    retryHeaders.set(
      "Accept",
      retryHeaders.get(
        "Accept"
      ) ??
        "application/json"
    );

    const csrf =
      await getCsrfToken();

    retryHeaders.set(
      csrf.headerName,
      csrf.token
    );

    response =
      await fetch(
        input,
        {
          ...init,

          method,

          headers:
            retryHeaders,

          credentials:
            "include",
        }
      );
  }

  /*
   * Sessão inválida/expirada: o token CSRF em cache
   * não deve continuar sendo reutilizado.
   *
   * O redirecionamento continua sendo responsabilidade
   * do layout/da tela, evitando acoplar navegação aqui.
   */
  if (
    response.status ===
      401 ||
    response.status ===
      403
  ) {
    clearAdminCsrfToken();
  }

  return response;
}

/* =========================
   LIMPAR TOKEN
========================= */

export function clearAdminCsrfToken() {
  cachedCsrfToken =
    null;

  csrfRequest =
    null;
}

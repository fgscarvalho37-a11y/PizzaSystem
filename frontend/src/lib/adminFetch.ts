type CsrfResponse = {
  token: string;
  headerName: string;
  parameterName: string;
};

let cachedCsrfToken:
  CsrfResponse | null = null;

// =========================
// BUSCAR TOKEN CSRF
// =========================

async function getCsrfToken():
  Promise<CsrfResponse> {

  if (cachedCsrfToken) {
    return cachedCsrfToken;
  }

  const response =
    await fetch(
      "http://localhost:8080/api/auth/csrf",
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      "Não foi possível obter o token de segurança."
    );
  }

  const data: CsrfResponse =
    await response.json();

  cachedCsrfToken =
    data;

  return data;
}

// =========================
// FETCH ADMINISTRATIVO
// =========================

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

  const unsafeMethod =
    method === "POST" ||
    method === "PUT" ||
    method === "PATCH" ||
    method === "DELETE";

  if (unsafeMethod) {

    const csrf =
      await getCsrfToken();

    headers.set(
      csrf.headerName,
      csrf.token
    );
  }

  return fetch(
    input,
    {
      ...init,

      headers,

      credentials:
        "include",
    }
  );
}

// =========================
// LIMPAR TOKEN
// =========================

export function clearAdminCsrfToken() {
  cachedCsrfToken =
    null;
}
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL =
  process.env.PIZZASYSTEM_BACKEND_URL ??
  "https://pizzasystem-api.onrender.com";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

function buildUpstreamHeaders(
  request: NextRequest
) {
  const headers =
    new Headers();

  const accept =
    request.headers.get(
      "accept"
    );

  const contentType =
    request.headers.get(
      "content-type"
    );

  const cookie =
    request.headers.get(
      "cookie"
    );

  const csrfToken =
    request.headers.get(
      "x-xsrf-token"
    );

  if (accept) {
    headers.set(
      "accept",
      accept
    );
  }

  if (contentType) {
    headers.set(
      "content-type",
      contentType
    );
  }

  if (cookie) {
    headers.set(
      "cookie",
      cookie
    );
  }

  if (csrfToken) {
    headers.set(
      "x-xsrf-token",
      csrfToken
    );
  }

  headers.set(
    "x-forwarded-proto",
    "https"
  );

  return headers;
}

function normalizeSetCookie(
  value: string
) {
  /*
   * O cookie precisa pertencer ao domínio do
   * frontend (Vercel), e não ao domínio do Render.
   *
   * Se o backend algum dia enviar Domain=..., nós
   * removemos esse atributo e deixamos o navegador
   * criar um cookie host-only no domínio atual.
   */
  return value.replace(
    /;\s*Domain=[^;]+/gi,
    ""
  );
}

async function proxyAuthRequest(
  request: NextRequest,
  context: RouteContext
) {
  const {
    path,
  } =
    await context.params;

  const upstreamUrl =
    new URL(
      `/api/auth/${path.join("/")}`,
      BACKEND_URL
    );

  upstreamUrl.search =
    request.nextUrl.search;

  const method =
    request.method.toUpperCase();

  const body =
    method === "GET" ||
    method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  const upstreamResponse =
    await fetch(
      upstreamUrl,
      {
        method,
        headers:
          buildUpstreamHeaders(
            request
          ),
        body,
        cache:
          "no-store",
        redirect:
          "manual",
      }
    );

  const responseBody =
    await upstreamResponse.arrayBuffer();

  const response =
    new NextResponse(
      responseBody,
      {
        status:
          upstreamResponse.status,
      }
    );

  const contentType =
    upstreamResponse.headers.get(
      "content-type"
    );

  if (contentType) {
    response.headers.set(
      "content-type",
      contentType
    );
  }

  response.headers.set(
    "cache-control",
    "no-store, no-cache, must-revalidate"
  );

  /*
   * Rewrites externas podem perder Set-Cookie.
   * Aqui copiamos explicitamente TODOS os cookies
   * devolvidos pelo Spring para a resposta do
   * próprio domínio do PizzaSystem.
   */
  const responseHeaders =
    upstreamResponse.headers as Headers & {
      getSetCookie?: () => string[];
    };

  const setCookies =
    typeof responseHeaders
      .getSetCookie === "function"
      ? responseHeaders.getSetCookie()
      : [];

  if (setCookies.length > 0) {
    for (
      const setCookie
      of setCookies
    ) {
      response.headers.append(
        "set-cookie",
        normalizeSetCookie(
          setCookie
        )
      );
    }
  } else {
    const setCookie =
      upstreamResponse.headers.get(
        "set-cookie"
      );

    if (setCookie) {
      response.headers.append(
        "set-cookie",
        normalizeSetCookie(
          setCookie
        )
      );
    }
  }

  return response;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  return proxyAuthRequest(
    request,
    context
  );
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  return proxyAuthRequest(
    request,
    context
  );
}

export async function OPTIONS() {
  return new NextResponse(
    null,
    {
      status: 204,
      headers: {
        "cache-control":
          "no-store",
      },
    }
  );
}

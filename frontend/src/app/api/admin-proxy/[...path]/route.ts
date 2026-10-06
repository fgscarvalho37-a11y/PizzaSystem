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
  const headers = new Headers();

  for (const name of [
    "accept",
    "content-type",
    "cookie",
    "x-xsrf-token",
    "authorization",
    "user-agent",
  ]) {
    const value =
      request.headers.get(name);

    if (value) {
      headers.set(name, value);
    }
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
  return value.replace(
    /;\s*Domain=[^;]+/gi,
    ""
  );
}

function forwardSetCookies(
  upstreamResponse: Response,
  response: NextResponse
) {
  const responseHeaders =
    upstreamResponse.headers as Headers & {
      getSetCookie?: () => string[];
    };

  const setCookies =
    typeof responseHeaders.getSetCookie ===
      "function"
      ? responseHeaders.getSetCookie()
      : [];

  const cookiesToForward =
    setCookies.length > 0
      ? setCookies
      : (() => {
          const value =
            upstreamResponse.headers.get(
              "set-cookie"
            );

          return value
            ? [value]
            : [];
        })();

  for (const cookie of cookiesToForward) {
    response.headers.append(
      "set-cookie",
      normalizeSetCookie(cookie)
    );
  }
}

async function proxyAdminRequest(
  request: NextRequest,
  context: RouteContext
) {
  const { path } =
    await context.params;

  if (
    !Array.isArray(path) ||
    path.length === 0
  ) {
    return NextResponse.json(
      {
        message:
          "Rota de API inválida.",
      },
      {
        status: 400,
      }
    );
  }

  const upstreamUrl =
    new URL(
      `/api/${path.join("/")}`,
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

  let upstreamResponse: Response;

  try {
    upstreamResponse =
      await fetch(
        upstreamUrl,
        {
          method,
          headers:
            buildUpstreamHeaders(
              request
            ),
          body,
          cache: "no-store",
          redirect: "manual",
        }
      );
  } catch {
    return NextResponse.json(
      {
        message:
          "Não foi possível conectar ao servidor. Tente novamente.",
      },
      {
        status: 502,
      }
    );
  }

  const responseBody =
    await upstreamResponse
      .arrayBuffer();

  const response =
    new NextResponse(
      responseBody,
      {
        status:
          upstreamResponse.status,
      }
    );

  for (const headerName of [
    "content-type",
    "location",
  ]) {
    const value =
      upstreamResponse.headers.get(
        headerName
      );

    if (value) {
      response.headers.set(
        headerName,
        value
      );
    }
  }

  forwardSetCookies(
    upstreamResponse,
    response
  );

  response.headers.set(
    "cache-control",
    "no-store, no-cache, must-revalidate"
  );

  response.headers.set(
    "x-pizzasystem-admin-proxy",
    "active"
  );

  return response;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  return proxyAdminRequest(
    request,
    context
  );
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  return proxyAdminRequest(
    request,
    context
  );
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  return proxyAdminRequest(
    request,
    context
  );
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  return proxyAdminRequest(
    request,
    context
  );
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  return proxyAdminRequest(
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

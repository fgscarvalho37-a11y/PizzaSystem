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

function buildUpstreamHeaders(request: NextRequest) {
  const headers = new Headers();

  for (const name of [
    "accept",
    "content-type",
    "cookie",
    "x-xsrf-token",
    "user-agent",
  ]) {
    const value = request.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }

  headers.set("x-forwarded-proto", "https");
  return headers;
}

async function proxyStoreImageRequest(
  request: NextRequest,
  context: RouteContext
) {
  const { path } = await context.params;

  const upstreamUrl = new URL(
    `/api/store/images/${path.join("/")}`,
    BACKEND_URL
  );

  upstreamUrl.search = request.nextUrl.search;

  const method = request.method.toUpperCase();

  const body =
    method === "GET" || method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  let upstreamResponse: Response;

  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method,
      headers: buildUpstreamHeaders(request),
      body,
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return NextResponse.json(
      {
        message:
          "Não foi possível conectar ao servidor de imagens. Tente novamente.",
      },
      { status: 502 }
    );
  }

  const responseBody = await upstreamResponse.arrayBuffer();

  const response = new NextResponse(responseBody, {
    status: upstreamResponse.status,
  });

  const contentType =
    upstreamResponse.headers.get("content-type");

  if (contentType) {
    response.headers.set("content-type", contentType);
  }

  response.headers.set(
    "cache-control",
    "no-store, no-cache, must-revalidate"
  );

  response.headers.set(
    "x-pizzasystem-image-proxy",
    "active"
  );

  return response;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  return proxyStoreImageRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  return proxyStoreImageRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  return proxyStoreImageRequest(request, context);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "cache-control": "no-store",
    },
  });
}

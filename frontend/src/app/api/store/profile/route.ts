import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL =
  process.env.PIZZASYSTEM_BACKEND_URL ??
  "https://pizzasystem-api.onrender.com";

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

async function proxyStoreProfile(request: NextRequest) {
  const upstreamUrl = new URL(
    "/api/store/profile",
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
          "Não foi possível conectar ao servidor da loja. Tente novamente.",
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
    "x-pizzasystem-store-profile-proxy",
    "active"
  );

  return response;
}

export async function GET(request: NextRequest) {
  return proxyStoreProfile(request);
}

export async function PUT(request: NextRequest) {
  return proxyStoreProfile(request);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "cache-control": "no-store",
    },
  });
}

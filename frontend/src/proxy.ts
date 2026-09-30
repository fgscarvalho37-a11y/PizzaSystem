import {
  NextRequest,
  NextResponse,
} from "next/server";

const STOREFRONT_BASE_DOMAIN =
  (
    process.env.STOREFRONT_BASE_DOMAIN ??
    "orbitta.space"
  )
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

const PIZZASYSTEM_PUBLIC_HOST =
  (
    process.env.PIZZASYSTEM_PUBLIC_HOST ??
    "pizzasystem.orbitta.space"
  )
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

const LEGACY_PRODUCTION_HOST =
  "pizza-system-nine.vercel.app";

export function proxy(
  request: NextRequest
) {
  const host =
    (
      request.headers.get(
        "host"
      ) ??
      ""
    )
      .split(":")[0]
      .toLowerCase();

  if (
    host ===
      LEGACY_PRODUCTION_HOST &&
    PIZZASYSTEM_PUBLIC_HOST
  ) {
    const canonicalUrl =
      new URL(
        request.nextUrl.pathname +
          request.nextUrl.search,
        `https://${PIZZASYSTEM_PUBLIC_HOST}`
      );

    return NextResponse.redirect(
      canonicalUrl,
      308
    );
  }

  if (
    host ===
      PIZZASYSTEM_PUBLIC_HOST
  ) {
    return NextResponse.next();
  }

  const suffix =
    `.${STOREFRONT_BASE_DOMAIN}`;

  if (
    !STOREFRONT_BASE_DOMAIN ||
    !host.endsWith(
      suffix
    )
  ) {
    return NextResponse.next();
  }

  const slug =
    host.slice(
      0,
      -suffix.length
    );

  if (
    !slug ||
    slug.includes(".")
  ) {
    return NextResponse.next();
  }

  /*
   * Segurança extra para o domínio institucional.
   * Se o wildcard receber www.orbitta.space,
   * não tentamos abrir uma loja chamada "www".
   */
  if (
    slug === "www"
  ) {
    const institutionalUrl =
      new URL(
        request.nextUrl.pathname +
          request.nextUrl.search,
        `https://${STOREFRONT_BASE_DOMAIN}`
      );

    return NextResponse.redirect(
      institutionalUrl
    );
  }

  const pathname =
    request.nextUrl.pathname;

  if (
    pathname.startsWith(
      "/api/"
    ) ||
    pathname.startsWith(
      "/uploads/"
    ) ||
    pathname.startsWith(
      "/_next/"
    )
  ) {
    return NextResponse.next();
  }

  /*
   * O domínio da loja aponta a raiz para o cardápio
   * do tenant. As rotas internas continuam normais.
   */
  if (
    pathname === "/"
  ) {
    const url =
      request.nextUrl.clone();

    url.pathname =
      `/cardapio/${slug}`;

    return NextResponse.rewrite(
      url
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!favicon.ico).*)",
  ],
};

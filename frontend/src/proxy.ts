import {
  NextRequest,
  NextResponse,
} from "next/server";

const STOREFRONT_BASE_DOMAIN =
  (
    process.env.STOREFRONT_BASE_DOMAIN ??
    "loja.orbitta.space"
  )
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

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

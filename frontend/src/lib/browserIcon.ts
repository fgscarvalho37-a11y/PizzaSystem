export function setBrowserIcon(
  href: string | null | undefined
) {
  if (
    typeof document ===
    "undefined"
  ) {
    return;
  }

  const finalHref =
    href?.trim() ||
    "/icon.svg";

  let link =
    document.querySelector<HTMLLinkElement>(
      'link[rel="icon"]'
    );

  if (!link) {
    link =
      document.createElement(
        "link"
      );

    link.rel =
      "icon";

    document.head.appendChild(
      link
    );
  }

  link.href =
    finalHref;
}

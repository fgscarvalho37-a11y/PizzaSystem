type GuideIconKind =
  | "dashboard"
  | "menu"
  | "store"
  | "kitchen"
  | "delivery"
  | "payment"
  | "reports"
  | "palette"
  | "guide"
  | "settings"
  | "coupon";

type GuideFeatureIconProps = {
  kind: GuideIconKind;
  className?: string;
};

export default function GuideFeatureIcon({
  kind,
  className = "h-5 w-5",
}: GuideFeatureIconProps) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (kind) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );

    case "menu":
      return (
        <svg {...common}>
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h10" />
        </svg>
      );

    case "store":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a15 15 0 0 1 0 18" />
        </svg>
      );

    case "kitchen":
      return (
        <svg {...common}>
          <path d="M5 11h14" />
          <path d="M7 11a5 5 0 0 1 10 0" />
          <path d="M4 15h16" />
          <path d="M8 19h8" />
        </svg>
      );

    case "delivery":
      return (
        <svg {...common}>
          <path d="M3 6h11v11H3Z" />
          <path d="M14 10h4l3 3v4h-7Z" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
        </svg>
      );

    case "payment":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 9h18" />
          <path d="M7 15h4" />
        </svg>
      );

    case "reports":
      return (
        <svg {...common}>
          <path d="M4 20V10" />
          <path d="M10 20V4" />
          <path d="M16 20v-7" />
          <path d="M22 20H2" />
        </svg>
      );

    case "palette":
      return (
        <svg {...common}>
          <path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 0-4H12a1.5 1.5 0 0 1 0-3h2a7 7 0 0 0 7-7 4 4 0 0 0-4-4h-5Z" />
          <circle cx="8" cy="9" r=".8" fill="currentColor" stroke="none" />
          <circle cx="12" cy="6.5" r=".8" fill="currentColor" stroke="none" />
          <circle cx="16" cy="9" r=".8" fill="currentColor" stroke="none" />
        </svg>
      );

    case "guide":
      return (
        <svg {...common}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z" />
          <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22V5.5Z" />
        </svg>
      );

    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2" />
          <path d="M12 19v2" />
          <path d="M3 12h2" />
          <path d="M19 12h2" />
          <path d="m5.6 5.6 1.4 1.4" />
          <path d="m17 17 1.4 1.4" />
          <path d="m18.4 5.6-1.4 1.4" />
          <path d="m7 17-1.4 1.4" />
        </svg>
      );

    case "coupon":
      return (
        <svg {...common}>
          <path d="M4 7a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-3a2 2 0 0 0 0-4V7Z" />
          <path d="m9 15 6-6" />
          <path d="M9 9h.01" />
          <path d="M15 15h.01" />
        </svg>
      );
  }
}

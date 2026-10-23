import React from "react";

/**
 * A small, consistent set of line icons (24x24, 1.75px stroke, currentColor)
 * used throughout the app -- replaces the earlier emoji-based nav icons,
 * which rendered inconsistently across platforms and didn't take on the
 * app's own color palette.
 */
const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const IconHome = (p) => (
  <svg {...base} {...p}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10v9a1 1 0 0 0 1 1H9.5a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-9" />
  </svg>
);

export const IconSearch = (p) => (
  <svg {...base} {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20 20-4.35-4.35" />
  </svg>
);

export const IconClock = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const IconUser = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20c1.4-3.8 4.3-5.5 7.5-5.5s6.1 1.7 7.5 5.5" />
  </svg>
);

export const IconClipboard = (p) => (
  <svg {...base} {...p}>
    <rect x="5.5" y="4.5" width="13" height="16" rx="1.5" />
    <path d="M9 4.5V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v.5" />
    <path d="M9 11h6M9 15h6" />
  </svg>
);

export const IconShield = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3 4.5 6v6c0 4.6 3.1 7.9 7.5 9 4.4-1.1 7.5-4.4 7.5-9V6L12 3Z" />
    <path d="m9 12 2 2 4-4.5" />
  </svg>
);

export const IconBarChart = (p) => (
  <svg {...base} {...p}>
    <path d="M4 20V10M12 20V4M20 20v-7" />
  </svg>
);

export const IconSparkles = (p) => (
  <svg {...base} {...p}>
    <path d="M11 4.5 12.4 8l3.5 1.4-3.5 1.4L11 14.3 9.6 10.8 6.1 9.4l3.5-1.4L11 4.5Z" />
    <path d="M18 15.5 18.7 17.2 20.5 18l-1.8.8-.7 1.7-.7-1.7-1.8-.8 1.8-.8.7-1.7Z" />
  </svg>
);

export const IconPower = (p) => (
  <svg {...base} width={18} height={18} {...p}>
    <path d="M12 3v7.5" />
    <path d="M7 6.2a8 8 0 1 0 10 0" />
  </svg>
);

export const IconMenu = (p) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const IconX = (p) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconStethoscope = (p) => (
  <svg {...base} {...p}>
    <path d="M6 4v6.5a4.5 4.5 0 0 0 9 0V4" />
    <path d="M10.5 4h-3M17.5 4h-3" />
    <circle cx="19" cy="14" r="2" />
    <path d="M15 11v1a4 4 0 0 1-8 0v-1.5" />
  </svg>
);

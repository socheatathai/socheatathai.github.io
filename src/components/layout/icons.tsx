import type { ReactNode } from "react";
import type { LayoutIconName, LayoutIconProps, SocialProfile } from "./types";

const emailPath = (
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </>
);

const paths: Record<LayoutIconName, ReactNode> = {
  home: (
    <>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v12h14V9M9 21v-8h6v8" />
    </>
  ),
  blog: <path d="M5 3h11l3 3v15H5zM15 3v5h4M8 12h8M8 16h6" />,
  about: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
    </>
  ),
  contact: emailPath,
  email: emailPath,
  language: <path d="M3 5h12M9 3v2M5 5c0 5 4 9 8 11M13 5c0 5-4 9-9 12M14 21l4-10 4 10M16 17h4" />,
  phone: (
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1Z" />
  ),
  location: (
    <>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
};

export function LayoutIcon({ name, size = 19, strokeWidth = 1.65, ...props }: LayoutIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

const socialPaths: Record<SocialProfile, ReactNode> = {
  github: (
    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.87c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.64.35-1.08.64-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.82c.85 0 1.71.12 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.76c0 .26.18.58.69.48A10 10 0 0 0 12 2Z" />
  ),
  linkedin: (
    <path d="M5.3 7.5a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2ZM3.5 9h3.6v12H3.5V9Zm5.9 0h3.5v1.6h.1c.5-1 1.7-2 3.5-2 3.7 0 4.5 2.4 4.5 5.5V21h-3.7v-6.1c0-1.5 0-3.4-2.1-3.4s-2.4 1.6-2.4 3.3V21H9.4V9Z" />
  ),
  telegram: <path d="m21 3-4 18-6-6-4 3v-6L3 9l18-6ZM7 12 21 3M11 15 21 3" />,
};

export function SocialIcon({ name }: { name: SocialProfile }) {
  const outlined = name === "telegram";
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill={outlined ? "none" : "currentColor"}
      stroke={outlined ? "currentColor" : undefined}
      strokeWidth={outlined ? "1.7" : undefined}
      strokeLinecap={outlined ? "round" : undefined}
      strokeLinejoin={outlined ? "round" : undefined}
      aria-hidden="true"
    >
      {socialPaths[name]}
    </svg>
  );
}

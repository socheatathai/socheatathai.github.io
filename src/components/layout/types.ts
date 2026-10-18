import type Link from "next/link";
import type { ComponentProps, ReactNode, Ref, SVGProps } from "react";
import type { NavigationId } from "@/lib/navigation";

export type NavigationActionProps = {
  onNavigate?: () => void;
};

export type LayoutChildrenProps = {
  children: ReactNode;
};

export type SidebarContactDetails = {
  email?: string;
  phone?: string;
};

export type SidebarProps = {
  id: string;
  collapsed: boolean;
  onClose: () => void;
  closeButtonRef: Ref<HTMLButtonElement>;
};

export type PageLinkProps = ComponentProps<typeof Link> & {
  direction?: "forward" | "back";
};

export type LayoutIconName =
  NavigationId | "language" | "email" | "phone" | "location" | "menu" | "close";

export type LayoutIconProps = SVGProps<SVGSVGElement> & {
  name: LayoutIconName;
  size?: number;
};

export type SocialProfile = "github" | "linkedin" | "telegram";

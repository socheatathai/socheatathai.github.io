import Link from "next/link";
import type { PageLinkProps } from "./types";

export default function PageLink({
  direction = "forward",
  transitionTypes,
  ...props
}: PageLinkProps) {
  return <Link {...props} transitionTypes={transitionTypes ?? [`page-${direction}`]} />;
}

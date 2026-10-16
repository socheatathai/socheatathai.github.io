import Link from "next/link";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Link> & {
  direction?: "forward" | "back";
};

export default function PageLink({ direction = "forward", transitionTypes, ...props }: Props) {
  return <Link {...props} transitionTypes={transitionTypes ?? [`page-${direction}`]} />;
}

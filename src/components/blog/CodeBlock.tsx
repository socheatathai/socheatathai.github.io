"use client";

import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { useCopyCode } from "@/hooks/useCopyCode";

function textContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textContent(node.props.children);
  return "";
}

/** Used as the MDX `pre` component, preserving the nested code element. */
export default function CodeBlock({ children, ...props }: ComponentPropsWithoutRef<"pre">) {
  const { content } = useLanguage();
  const { status, copyCode } = useCopyCode(textContent(children));
  const codeElement = Children.toArray(children).find((child) => isValidElement(child));
  const className = isValidElement<{ className?: string }>(codeElement)
    ? codeElement.props.className
    : undefined;
  const language = className?.match(/language-([\w-]+)/)?.[1] ?? content.code.title;

  return (
    <div className="code-block">
      <div className="code-toolbar">
        <span>{language}</span>
        <button className="copy-button" type="button" onClick={copyCode}>
          {status === "copied" ? content.code.copied : content.code.copy}
        </button>
      </div>
      <pre {...props}>{children}</pre>
      <span className="sr-only" role="status" aria-live="polite">
        {status === "copied" && content.code.copiedStatus}
        {status === "failed" && content.code.failedStatus}
      </span>
    </div>
  );
}

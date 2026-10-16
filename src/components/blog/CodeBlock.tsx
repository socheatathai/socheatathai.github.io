"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { useLanguage } from "@/components/LanguageProvider";

function textContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textContent(node.props.children);
  return "";
}

/** Used as the MDX `pre` component, preserving the nested code element. */
export default function CodeBlock({ children, ...props }: ComponentPropsWithoutRef<"pre">) {
  const { language: interfaceLanguage } = useLanguage();
  const km = interfaceLanguage === "km";
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const codeElement = Children.toArray(children).find((child) => isValidElement(child));
  const className = isValidElement<{ className?: string }>(codeElement)
    ? codeElement.props.className
    : undefined;
  const language = className?.match(/language-([\w-]+)/)?.[1] ?? (km ? "កូដ" : "Code");

  useEffect(() => () => clearTimeout(timeout.current), []);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(textContent(children));
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <div className="code-block">
      <div className="code-toolbar">
        <span>{language}</span>
        <button className="copy-button" type="button" onClick={copyCode}>
          {status === "copied" ? (km ? "បានចម្លង!" : "Copied!") : (km ? "ចម្លងកូដ" : "Copy code")}
        </button>
      </div>
      <pre {...props}>{children}</pre>
      <span className="sr-only" role="status" aria-live="polite">
        {status === "copied" && (km ? "បានចម្លងកូដទៅក្តារតម្បៀតខ្ទាស់។" : "Code copied to clipboard.")}
        {status === "failed" && (km ? "មិនអាចចម្លងបានទេ។ សូមជ្រើសរើសកូដ ហើយចម្លងដោយខ្លួនឯង។" : "Unable to copy. Select the code and copy it manually.")}
      </span>
    </div>
  );
}

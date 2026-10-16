import type { Language } from "@/types/language";

export function formatLocalizedNumber(
  value: number,
  language: Language,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(language === "km" ? "km-KH" : "en", {
    numberingSystem: language === "km" ? "khmr" : "latn",
    ...options,
  }).format(value);
}

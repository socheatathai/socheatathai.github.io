import contentByLocale from "./public/data/content.json";

export default defineI18nConfig(() => ({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages: contentByLocale
}));

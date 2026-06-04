import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  vite: {
    plugins: [tailwindcss()]
  },
  modules: ["@nuxtjs/i18n"],
  css: ["~/assets/css/style.css"],
  i18n: {
    defaultLocale: "en",
    strategy: "no_prefix",
    detectBrowserLanguage: false,
    locales: [
      {
        code: "en",
        name: "English"
      },
      {
        code: "km",
        name: "Khmer"
      }
    ],
    vueI18n: "./i18n.config.ts"
  },
  app: {
    head: {
      htmlAttrs: {
        lang: "en"
      },
      title: "Thai Socheata | Portfolio",
      meta: [
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1.0, viewport-fit=cover"
        },
        {
          name: "description",
          content:
            "This is the portfolio website of Thai Socheata, a passionate web developer specializing in frontend development. Explore my projects, skills, and experience in creating beautiful and functional websites."
        }
      ],
      link: [
        {
          rel: "icon",
          type: "image/webp",
          href: "/images/cheata.jpg"
        },
        {
          rel: "shortcut icon",
          type: "image/webp",
          href: "/images/cheata.jpg"
        },
        {
          rel: "preconnect",
          href: "https://fonts.googleapis.com"
        },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: ""
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Battambang:wght@400;700&family=Poppins:wght@300;400;500;600;700;800&display=swap"
        }
      ]
    }
  }
});
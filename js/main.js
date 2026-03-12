document.addEventListener("DOMContentLoaded", async () => {
  setupMobileMenu();
  const contentByLang = await loadContent();
  setupLanguage(contentByLang);
});

function setupMobileMenu() {
  const menuToggle = document.getElementById("menu-toggle");
  const navOverlay = document.getElementById("nav-overlay");
  const siteNav = document.getElementById("site-nav");

  if (!menuToggle || !siteNav || !navOverlay) {
    return;
  }

  const closeMenu = () => {
    document.body.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
  };

  const toggleMenu = () => {
    const isOpen = document.body.classList.toggle("menu-open");
    menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  };

  menuToggle.addEventListener("click", toggleMenu);
  navOverlay.addEventListener("click", closeMenu);

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      closeMenu();
    }
  });

  closeMenu();
}

async function loadContent() {
  try {
    const response = await fetch("data/content.json");
    if (!response.ok) {
      throw new Error("Could not load content JSON");
    }

    return await response.json();
  } catch (error) {
    return {
      en: {
        metaDescription: "Cheata.Dev portfolio website",
        logo: "Cheata.Dev",
        nav: { home: "Home", projects: "Projects", about: "About" },
        buttons: {
          theme: "Toggle Theme",
          language: "ខ្មែរ",
          contact: "Contact Me",
          about: "About Me",
          projectLink: "Explore Project"
        },
        hero: {
          badge: "Cheata Profile",
          title: "Hi There, I'm Cheata",
          intro1: "Welcome to my portfolio.",
          intro2: "I love building modern web products.",
          imageAlt: "Cheata Profile"
        },
        projects: {
          title: "Here is My Project",
          description: "Some projects from my journey.",
          items: []
        },
        about: { title: "About Me", paragraphs: [], facts: [] },
        contact: { title: "Contact", description: "", fields: [] },
        footer: "© 2026 Cheata.Dev All rights reserve"
      },
      km: null
    };
  }
}

function setupLanguage(contentByLang) {
  const languageToggles = Array.from(document.querySelectorAll(".language-toggle"));
  const languageToggleTexts = Array.from(document.querySelectorAll(".language-toggle-text"));
  const hasKhmer = Boolean(contentByLang.km);
  const savedLang = localStorage.getItem("lang");
  let currentLang = savedLang && contentByLang[savedLang] ? savedLang : "en";

  renderContent(contentByLang[currentLang], currentLang);

  if (!languageToggles.length) {
    return;
  }

  if (!hasKhmer) {
    languageToggles.forEach((button) => {
      button.style.display = "none";
    });
    return;
  }

  languageToggles.forEach((button) => {
    button.addEventListener("click", () => {
      currentLang = currentLang === "en" ? "km" : "en";
      localStorage.setItem("lang", currentLang);
      renderContent(contentByLang[currentLang], currentLang);
    });
  });

  if (!languageToggleTexts.length) {
    return;
  }
}

function renderContent(content, lang) {
  if (!content) {
    return;
  }

  document.documentElement.lang = lang;
  setText("logo-text", content.logo);
  setText("nav-home", content.nav.home);
  setText("nav-projects", content.nav.projects);
  setText("nav-about", content.nav.about);
  setText("language-toggle-text", content.buttons.language);
  setText("language-toggle-mobile-text", content.buttons.language);
  setText("hero-title", content.hero.title);
  setText("hero-intro-1", content.hero.intro1);
  setText("hero-intro-2", content.hero.intro2);
  setText("btn-contact", content.buttons.contact);
  setText("btn-about", content.buttons.about);

  const heroImage = document.getElementById("hero-image-alt");
  if (heroImage) {
    heroImage.alt = content.hero.imageAlt;
  }

  setText("projects-title", content.projects.title);
  setText("projects-desc", content.projects.description);
  renderProjects(content.projects.items, content.buttons.projectLink);

  setText("about-title", content.about.title);
  setText("about-p1", content.about.paragraphs[0]);
  setText("about-p2", content.about.paragraphs[1]);
  setText("about-p3", content.about.paragraphs[2]);
  renderProfileFacts(content.about.facts);

  setText("contact-title", content.contact.title);
  setText("contact-desc", content.contact.description);
  renderContactDetails(content.contact.fields);

  setText("footer-text", content.footer);

  const descriptionTag = document.querySelector('meta[name="description"]');
  if (descriptionTag) {
    descriptionTag.setAttribute("content", content.metaDescription);
  }
}

function renderProjects(projects, projectLinkText) {
  const projectsGrid = document.getElementById("projects-grid");
  if (!projectsGrid) {
    return;
  }

  projectsGrid.innerHTML = "";

  projects.forEach((project) => {
    const card = document.createElement("article");
    card.className = "project-card";

    const head = document.createElement("div");
    head.className = "project-head";

    const icon = document.createElement("span");
    icon.className = "project-icon";
    icon.innerHTML = getProjectIconSvg(project.icon);

    const title = document.createElement("h3");
    title.textContent = project.title;

    head.append(icon, title);

    const description = document.createElement("p");
    description.textContent = project.description;

    const link = document.createElement("a");
    link.className = "project-link";
    link.href = project.href || "#";
    link.textContent = projectLinkText;

    card.append(head, description, link);
    projectsGrid.appendChild(card);
  });
}

function renderProfileFacts(facts) {
  const profileInfo = document.getElementById("profile-info");
  if (!profileInfo) {
    return;
  }

  profileInfo.innerHTML = "";

  facts.forEach((fact) => {
    const item = document.createElement("li");
    item.innerHTML = `<strong>${escapeHtml(fact.label)}:</strong> ${escapeHtml(fact.value)}`;
    profileInfo.appendChild(item);
  });
}

function renderContactDetails(fields) {
  const contactDetails = document.getElementById("contact-details");
  if (!contactDetails) {
    return;
  }

  contactDetails.innerHTML = "";

  fields.forEach((field) => {
    const item = document.createElement("li");
    item.innerHTML = `<strong>${escapeHtml(field.label)}:</strong> ${escapeHtml(field.value)}`;
    contactDetails.appendChild(item);
  });
}

function setText(elementId, value) {
  const element = document.getElementById(elementId);
  if (element && typeof value === "string") {
    element.textContent = value;
  }
}

function getProjectIconSvg(iconName) {
  const icons = {
    furniture: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M4 11h16v5H4v-5Zm2 5v2m12-2v2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    blockchain: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 8h8v8H8V8Zm-4 4h4m8 0h4m-8-8v4m0 8v4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    coffee: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 9h11v4a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Zm11 1h2a2 2 0 0 1 0 4h-2M7 5c0 1-1 1.5-1 2.5S7 9 7 10m3-5c0 1-1 1.5-1 2.5S10 9 10 10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    pizza: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4c4 0 7.5 1.2 9 3L12 20 3 7c1.5-1.8 5-3 9-3Zm-2.5 6.5h.01M14 9h.01M12 12h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    dashboard: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 4h7v7H4V4Zm9 0h7v4h-7V4ZM4 13h4v7H4v-7Zm6 4h10v3H10v-3Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    portfolio: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 8h18v11H3V8Zm5-3h8l1 3H7l1-3Zm1 7h6m-6 3h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  return icons[iconName] || icons.portfolio;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

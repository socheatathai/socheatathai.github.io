document.addEventListener("DOMContentLoaded", async () => {
  setupMobileMenu();
  setupNavScrollSpy();
  const contentByLang = await loadContent();
  setupLanguage(contentByLang);
});

let revealObserver;
let isNavSpyInitialized = false;

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

function setupNavScrollSpy() {
  if (isNavSpyInitialized) {
    return;
  }

  const navLinks = Array.from(document.querySelectorAll('.site-nav a[href^="#"]'));
  if (!navLinks.length) {
    return;
  }

  const linkEntries = navLinks
    .map((link) => {
      const href = link.getAttribute("href") || "";
      const section = href ? document.querySelector(href) : null;
      if (!section) {
        return null;
      }

      return {
        link,
        section
      };
    })
    .filter(Boolean);

  if (!linkEntries.length) {
    return;
  }

  const setActiveLink = (activeId) => {
    linkEntries.forEach(({ link, section }) => {
      const isActive = section.id === activeId;
      link.classList.toggle("active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
        return;
      }

      link.removeAttribute("aria-current");
    });
  };

  const updateActiveLink = () => {
    const header = document.querySelector(".header");
    const offset = (header ? header.offsetHeight : 0) + 40;
    const currentPosition = window.scrollY + offset;

    let activeId = linkEntries[0].section.id;
    linkEntries.forEach(({ section }) => {
      if (currentPosition >= section.offsetTop) {
        activeId = section.id;
      }
    });

    setActiveLink(activeId);
  };

  let isTicking = false;
  const onScrollOrResize = () => {
    if (isTicking) {
      return;
    }

    isTicking = true;
    window.requestAnimationFrame(() => {
      updateActiveLink();
      isTicking = false;
    });
  };

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);
  window.addEventListener("hashchange", onScrollOrResize);

  linkEntries.forEach(({ link, section }) => {
    link.addEventListener("click", () => {
      setActiveLink(section.id);
    });
  });

  isNavSpyInitialized = true;
  onScrollOrResize();
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
        nav: {
          home: "Home",
          projects: "Projects",
          experience: "Experience",
          about: "About",
          education: "Education"
        },
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
}

function renderContent(content, lang) {
  if (!content) {
    return;
  }

  const dynamicAge = getDynamicAge(2002);
  const dynamicAboutParagraphs = getDynamicAboutParagraphs(content.about?.paragraphs || [], lang, dynamicAge);
  const dynamicAboutFacts = getDynamicAboutFacts(content.about?.facts || [], dynamicAge);
  const dynamicFooter = getFooterWithCurrentYear(content.footer);

  document.documentElement.lang = lang;
  setText("logo-text", content.logo);
  setText("nav-home", content.nav.home);
  setText("nav-projects", content.nav.projects);
  setText("nav-experience", content.nav.experience);
  setText("nav-about", content.nav.about);
  setText("nav-education", content.nav.education);
  setText("language-toggle-text", content.buttons.language);
  setText("language-toggle-mobile-text", content.buttons.language);
  setText("hero-title", content.hero.title);
  setText("hero-intro-1", content.hero.intro1);
  setText("hero-intro-2", content.hero.intro2);
  setText("tools-title", content.technologies?.title || "Languages & Tools");
  renderTechnologies(content.technologies?.items || []);

  const heroImage = document.getElementById("hero-image-alt");
  if (heroImage) {
    heroImage.alt = content.hero.imageAlt;
  }

  setText("projects-title", content.projects.title);
  setText("projects-desc", content.projects.description);
  renderProjects(content.projects.items, content.buttons.projectLink);

  setText("experience-title", content.experience?.title || "Work Experience");
  setText("experience-desc", content.experience?.description || "");
  renderExperience(content.experience?.items || []);

  setText("about-title", content.about.title);
  setText("about-p1", dynamicAboutParagraphs[0]);
  setText("about-p2", dynamicAboutParagraphs[1]);
  setText("about-p3", dynamicAboutParagraphs[2]);
  setText("about-p4", dynamicAboutParagraphs[3]);
  renderProfileFacts(dynamicAboutFacts);

  setText("education-title", content.education?.title || "Education");
  setText("education-desc", content.education?.description || "");
  renderEducation(content.education?.items || []);

  setText("contact-title", content.contact.title);
  setText("contact-desc", content.contact.description);
  renderContactDetails(content.contact.fields);

  setText("footer-text", dynamicFooter);

  const descriptionTag = document.querySelector('meta[name="description"]');
  if (descriptionTag) {
    descriptionTag.setAttribute("content", content.metaDescription);
  }

  setupScrollRevealAnimations();
}

function setupScrollRevealAnimations() {
  const selectors = [
    ".hero-content h1",
    ".hero-content p",
    ".hero-tools",
    "#projects h2",
    "#projects .section-desc",
    ".project-card",
    "#experience h2",
    "#experience .section-desc",
    ".experience-card",
    "#about h2",
    "#about .info-box",
    "#education h2",
    "#education .section-desc",
    ".education-card",
    "#contact h2",
    "#contact .info-box"
  ];

  const targets = Array.from(document.querySelectorAll(selectors.join(", ")));
  if (!targets.length) {
    return;
  }

  if (revealObserver) {
    revealObserver.disconnect();
  }

  targets.forEach((element, index) => {
    element.setAttribute("data-animate", "");
    element.classList.remove("in-view");
    element.style.setProperty("--delay", `${Math.min(index * 40, 320)}ms`);
  });

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    targets.forEach((element) => {
      element.classList.add("in-view");
    });
    return;
  }

  revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  targets.forEach((element) => {
    revealObserver.observe(element);
  });
}

function getDynamicAge(birthYear) {
  const currentYear = new Date().getFullYear();
  return Math.max(0, currentYear - birthYear);
}

function getFooterWithCurrentYear(footerText) {
  if (typeof footerText !== "string") {
    return "";
  }

  return footerText.replace(/(©\s*)\d{4}/, (_, prefix) => `${prefix}${new Date().getFullYear()}`);
}

function getDynamicAboutFacts(facts, age) {
  return facts.map((fact) => {
    const label = String(fact?.label || "").trim();
    if (label === "Age" || label === "អាយុ") {
      return {
        ...fact,
        value: String(age)
      };
    }

    return fact;
  });
}

function getDynamicAboutParagraphs(paragraphs, lang, age) {
  return paragraphs.map((paragraph) => {
    if (typeof paragraph !== "string") {
      return paragraph;
    }

    if (lang === "en") {
      return paragraph.replace(/(I am currently\s+)\d+(\s+years old)/i, `$1${age}$2`);
    }

    if (lang === "km") {
      return paragraph.replace(/(បច្ចុប្បន្នខ្ញុំមានអាយុ\s*)\d+(\s*ឆ្នាំ)/, `$1${age}$2`);
    }

    return paragraph;
  });
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
    const href = project.href || "#";
    link.href = href;
    if (/^https?:\/\//i.test(href)) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
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
    item.innerHTML = `<strong>${escapeHtml(localizeNumbers(fact.label))}:</strong> ${escapeHtml(localizeNumbers(fact.value))}`;
    profileInfo.appendChild(item);
  });
}

function renderExperience(items) {
  const experienceList = document.getElementById("experience-list");
  if (!experienceList) {
    return;
  }

  experienceList.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "experience-card";

    const head = document.createElement("div");
    head.className = "experience-head";

    const company = document.createElement("h3");
    company.className = "experience-company";
    company.textContent = localizeNumbers(item.company || "");

    const meta = document.createElement("p");
    meta.className = "experience-meta";
    meta.textContent = localizeNumbers(`${item.role || ""} • ${item.period || ""}`);

    head.append(company, meta);

    const details = document.createElement("ul");
    details.className = "experience-points";

    (item.details || []).forEach((detail) => {
      const point = document.createElement("li");
      point.textContent = localizeNumbers(detail);
      details.appendChild(point);
    });

    card.append(head, details);
    experienceList.appendChild(card);
  });
}

function renderEducation(items) {
  const educationList = document.getElementById("education-list");
  if (!educationList) {
    return;
  }

  educationList.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "education-card";

    const degree = document.createElement("h3");
    degree.className = "education-degree";
    degree.textContent = localizeNumbers(item.degree || "");

    const schoolRow = document.createElement("div");
    schoolRow.className = "education-school-row";

    if (item.logo) {
      const logoLink = document.createElement(item.href ? "a" : "span");
      logoLink.className = "education-school-logo-link";

      if (item.href) {
        logoLink.href = item.href;
        logoLink.target = "_blank";
        logoLink.rel = "noopener noreferrer";
        logoLink.setAttribute("aria-label", `${item.school || "School"} website`);
      } else {
        logoLink.setAttribute("aria-hidden", "true");
      }

      const logo = document.createElement("img");
      logo.className = "education-school-logo";
      logo.src = item.logo;
      logo.alt = item.logoAlt || `${item.school || "School"} logo`;
      logo.loading = "lazy";
      logo.decoding = "async";

      logoLink.appendChild(logo);
      schoolRow.appendChild(logoLink);
    }

    const school = document.createElement("p");
    school.className = "education-school";
    school.textContent = localizeNumbers(item.school || "");
    schoolRow.appendChild(school);

    const period = document.createElement("p");
    period.className = "education-period";
    period.textContent = localizeNumbers(item.period || "");

    const summary = document.createElement("p");
    summary.className = "education-summary";
    summary.textContent = localizeNumbers(item.summary || "");

    card.append(degree, schoolRow, period, summary);
    educationList.appendChild(card);
  });
}

function renderTechnologies(items) {
  const toolsGrid = document.getElementById("tools-grid");
  if (!toolsGrid) {
    return;
  }

  toolsGrid.innerHTML = "";

  items.forEach((item) => {
    const tool = document.createElement("span");
    tool.className = "tool-item";
    tool.title = localizeNumbers(item.name || "");
    tool.setAttribute("aria-label", localizeNumbers(item.name || "Technology"));

    const icon = document.createElement("img");
    icon.className = "tool-icon";
    icon.src = item.icon || "";
    icon.alt = item.name || "Technology icon";
    icon.loading = "lazy";
    icon.decoding = "async";

    tool.appendChild(icon);
    toolsGrid.appendChild(tool);
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

    if (field.href) {
      const link = document.createElement("a");
      link.className = "contact-link";
      link.href = field.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", field.label || "Contact");

      if (field.icon) {
        const icon = document.createElement("img");
        icon.className = "contact-icon";
        icon.src = field.icon;
        icon.alt = field.label || "Contact icon";
        icon.loading = "lazy";
        icon.decoding = "async";
        link.appendChild(icon);
      }

      const text = document.createElement("span");
      text.className = "contact-label";
      text.textContent = field.label || "Contact";
      link.appendChild(text);

      item.appendChild(link);
      contactDetails.appendChild(item);
      return;
    }

    const label = document.createElement("strong");
    label.textContent = `${field.label || "Info"}:`;
    item.append(label, document.createTextNode(` ${field.value || ""}`));
    contactDetails.appendChild(item);
  });
}

function setText(elementId, value) {
  const element = document.getElementById(elementId);
  if (element && typeof value === "string") {
    element.textContent = localizeNumbers(value);
  }
}

function localizeNumbers(value) {
  if (typeof value !== "string") {
    return String(value ?? "");
  }

  if (document.documentElement.lang !== "km") {
    return value;
  }

  const khmerDigits = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
  return value.replace(/\d/g, (digit) => khmerDigits[Number(digit)]);
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

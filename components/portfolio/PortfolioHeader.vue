<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { NormalizeText, PortfolioLocaleContent } from "../../types/portfolio";

export default defineComponent({
  name: "PortfolioHeader",
  props: {
    content: {
      type: Object as PropType<PortfolioLocaleContent>,
      required: true
    },
    normalizeText: {
      type: Function as PropType<NormalizeText>,
      required: true
    },
    onToggleLanguage: {
      type: Function as PropType<() => void>,
      required: true
    }
  },
  setup(props) {
    return { props };
  }
});
</script>

<template>
  <header class="header">
    <div class="container nav-wrap">
      <a href="#home" class="logo">
        <span class="logo-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 3 4 7v5c0 5.2 3.5 8.2 8 9 4.5-.8 8-3.8 8-9V7l-8-4Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 12.5 11 14l4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        <span>{{ props.normalizeText(props.content.logo) }}</span>
      </a>

      <nav id="site-nav" class="site-nav">
        <ul class="nav-list">
          <li><a href="#home">{{ props.normalizeText(props.content.nav?.home) }}</a></li>
          <li><a href="#projects">{{ props.normalizeText(props.content.nav?.projects) }}</a></li>
          <li><a href="#experience">{{ props.normalizeText(props.content.nav?.experience) }}</a></li>
          <li><a href="#about">{{ props.normalizeText(props.content.nav?.about) }}</a></li>
          <li><a href="#education">{{ props.normalizeText(props.content.nav?.education) }}</a></li>
          <li>
            <button class="theme-btn language-toggle" type="button" :aria-label="props.normalizeText(props.content.buttons?.language)" @click="props.onToggleLanguage">
              <span class="language-toggle-text">{{ props.normalizeText(props.content.buttons?.language) }}</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </header>
</template>

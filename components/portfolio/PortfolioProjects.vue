<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { NormalizeText, PortfolioLocaleContent, PortfolioProject, ProjectIconResolver } from "../../types/portfolio";

export default defineComponent({
  name: "PortfolioProjects",
  props: {
    content: {
      type: Object as PropType<PortfolioLocaleContent>,
      required: true
    },
    projects: {
      type: Array as PropType<PortfolioProject[]>,
      required: true
    },
    normalizeText: {
      type: Function as PropType<NormalizeText>,
      required: true
    },
    getProjectIconSvg: {
      type: Function as PropType<ProjectIconResolver>,
      required: true
    }
  },
  setup(props) {
    return { props };
  }
});
</script>

<template>
  <section id="projects" class="container section">
    <h2>{{ props.normalizeText(props.content.projects?.title) }}</h2>
    <p class="section-desc">{{ props.normalizeText(props.content.projects?.description) }}</p>

    <div class="projects-grid">
      <article v-for="project in props.projects" :key="String(project?.title || project?.href)" class="project-card">
        <div class="project-head">
          <span class="project-icon" v-html="props.getProjectIconSvg(project?.icon)" />
          <h3>{{ props.normalizeText(project?.title) }}</h3>
        </div>
        <p>{{ props.normalizeText(project?.description) }}</p>
        <a class="project-link" :href="String(project?.href || '#')" :target="/^https?:\/\//i.test(String(project?.href || '')) ? '_blank' : undefined" :rel="/^https?:\/\//i.test(String(project?.href || '')) ? 'noopener noreferrer' : undefined">
          {{ props.normalizeText(props.content.buttons?.projectLink) }}
        </a>
      </article>
    </div>
  </section>
</template>

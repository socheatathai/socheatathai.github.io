<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { NormalizeText, PortfolioContactField, PortfolioLocaleContent, PublicPathResolver } from "../../types/portfolio";

export default defineComponent({
  name: "PortfolioContact",
  props: {
    content: {
      type: Object as PropType<PortfolioLocaleContent>,
      required: true
    },
    contactFields: {
      type: Array as PropType<PortfolioContactField[]>,
      required: true
    },
    normalizeText: {
      type: Function as PropType<NormalizeText>,
      required: true
    },
    toPublicPath: {
      type: Function as PropType<PublicPathResolver>,
      required: true
    }
  },
  setup(props) {
    return { props };
  }
});
</script>

<template>
  <section id="contact" class="container section">
    <h2>{{ props.normalizeText(props.content.contact?.title) }}</h2>
    <div class="info-box">
      <p>{{ props.normalizeText(props.content.contact?.description) }}</p>
      <ul class="contact-details">
        <li v-for="field in props.contactFields" :key="String(field?.label || field?.href || field?.value)">
          <a v-if="field?.href" class="contact-link" :href="String(field.href)" target="_blank" rel="noopener noreferrer" :aria-label="props.normalizeText(field?.label || 'Contact')">
            <img v-if="field?.icon" class="contact-icon" :src="props.toPublicPath(field?.icon)" :alt="props.normalizeText(field?.label || 'Contact icon')" loading="lazy" decoding="async">
            <span class="contact-label">{{ props.normalizeText(field?.label || 'Contact') }}</span>
          </a>
          <template v-else>
            <strong>{{ props.normalizeText(field?.label || 'Info') }}:</strong>
            {{ ` ${props.normalizeText(field?.value || '')}` }}
          </template>
        </li>
      </ul>
    </div>
  </section>
</template>

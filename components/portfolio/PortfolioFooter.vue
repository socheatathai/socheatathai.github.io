<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "PortfolioFooter",
  props: {
    footerText: {
      type: String,
      required: true
    }
  }
});
</script>

<template>
  <footer class="footer">
    <p>{{ footerText }}</p>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { renderMarkdown } from '../utils/markdown';

const props = defineProps<{
  source: string;
}>();

const renderedContent = computed(() => renderMarkdown(props.source));
</script>

<template>
  <div class="markdown-content" v-html="renderedContent"></div>
</template>

<style>
/* Markdown 样式 - 全局生效或通过 :deep 穿透 */
.markdown-content :where(h1, h2, h3) { 
  margin: 0 0 8px; 
  font-size: 1.1em; 
  color: var(--el-text-color-primary);
}
.markdown-content p { 
  margin: 0; 
  white-space: pre-wrap; 
  color: var(--el-text-color-regular);
  line-height: 1.6;
}
.markdown-content code { 
  background: var(--el-fill-color-light); 
  color: var(--el-color-primary);
  border-radius: 4px; 
  padding: 2px 4px; 
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
}
.markdown-content pre {
  background: var(--el-fill-color-light);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
  border: 1px solid var(--el-border-color-light);
}
.markdown-content a {
  color: var(--el-color-primary);
  text-decoration: none;
}
.markdown-content a:hover {
  text-decoration: underline;
}
</style>

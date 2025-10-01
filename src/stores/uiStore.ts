import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const availableThemes = ['light', 'dark', 'ocean', 'emerald', 'rose', 'amber'] as const;
  const theme = ref<string>(localStorage.getItem('sniptnote-theme') || 'light');
  const showDescriptions = ref<boolean>(
    localStorage.getItem('sniptnote-show-descriptions') === 'true'
  );
  const singleLineMode = ref<boolean>(
    localStorage.getItem('sniptnote-single-line') === 'true'
  );

  function applyTheme() {
    const val = availableThemes.includes(theme.value as any) ? theme.value : 'light';
    document.documentElement.setAttribute('data-theme', val);
  }

  function setTheme(val: string) {
    theme.value = availableThemes.includes(val as any) ? val : 'light';
    localStorage.setItem('sniptnote-theme', theme.value);
    applyTheme();
  }

  function toggleTheme() {
    const idx = availableThemes.indexOf((theme.value as any) || 'light');
    const next = availableThemes[(idx + 1) % availableThemes.length];
    setTheme(next);
  }

  // 初始化应用主题
  applyTheme();

  function toggleShowDescriptions(val?: boolean) {
    showDescriptions.value = typeof val === 'boolean' ? val : !showDescriptions.value;
    localStorage.setItem('sniptnote-show-descriptions', String(showDescriptions.value));
  }
  function toggleSingleLineMode(val?: boolean) {
    singleLineMode.value = typeof val === 'boolean' ? val : !singleLineMode.value;
    localStorage.setItem('sniptnote-single-line', String(singleLineMode.value));
  }

  // 保证 v-model 修改也能持久化
  watch(showDescriptions, (val) => {
    localStorage.setItem('sniptnote-show-descriptions', String(val));
  });
  watch(singleLineMode, (val) => {
    localStorage.setItem('sniptnote-single-line', String(val));
  });
  watch(theme, (val) => {
    localStorage.setItem('sniptnote-theme', String(val));
  });

  return {
    theme,
    availableThemes,
    setTheme,
    toggleTheme,
    applyTheme,
    showDescriptions,
    toggleShowDescriptions,
    singleLineMode,
    toggleSingleLineMode,
  };
});
import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import router from './router';

const app = createApp(App);
const pinia = createPinia();

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(pinia);
app.use(ElementPlus);
app.use(router);
app.mount("#app");

// 启动后尝试恢复窗口大小（仅在 Tauri 环境下执行）；退出前保存当前窗口大小
(async () => {
  const isTauri = typeof (window as any).__TAURI__ !== 'undefined';
  if (!isTauri) return;

  try {
    const mod: any = await import('@tauri-apps/api/window');
    const getWin = mod.getCurrent ?? mod.getCurrentWebviewWindow ?? mod.getCurrentWindow;
    const SizeCtor = mod.LogicalSize ?? mod.PhysicalSize;
    if (!getWin || !SizeCtor) return;

    const win = getWin();
    const saved = localStorage.getItem('sniptnote-window-size');
    if (saved) {
      const parsed = JSON.parse(saved);
      const w = Number(parsed?.width);
      const h = Number(parsed?.height);
      if (w > 0 && h > 0) {
        await win.setSize(new SizeCtor(w, h));
      }
    }

    window.addEventListener('beforeunload', async () => {
      try {
        const size = await win.innerSize();
        localStorage.setItem('sniptnote-window-size', JSON.stringify({ width: size.width, height: size.height }));
      } catch (e) {
        console.warn('保存窗口大小失败', e);
      }
    });
  } catch (e) {
    console.warn('窗口尺寸持久化失败', e);
  }
})();

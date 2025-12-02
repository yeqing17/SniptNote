import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
// 移除固定的 highlight.js 样式，改为在 App.vue 中根据主题动态设置

// 注册语言
hljs.registerLanguage('bash', bash);

// 配置 MarkdownIt
const md = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true,
    highlight: (str: string, lang?: string): string => {
        const escapeHtml = (s: string) =>
            s
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        try {
            if (lang && hljs.getLanguage(lang)) {
                return (
                    `<pre><code class="hljs language-${lang}">` +
                    hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                    '</code></pre>'
                );
            }
            return (
                '<pre><code class="hljs">' +
                hljs.highlightAuto(str).value +
                '</code></pre>'
            );
        } catch (_) {
            return '<pre><code class="hljs">' + escapeHtml(str) + '</code></pre>';
        }
    }
});

export function renderMarkdown(text?: string): string {
    return md.render(text || '');
}

export function highlightCode(text?: string, lang?: string): string {
    try {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(text || '', { language: lang, ignoreIllegals: true }).value;
        }
        return hljs.highlightAuto(text || '').value;
    } catch (_) {
        return md.utils.escapeHtml(text || '');
    }
}

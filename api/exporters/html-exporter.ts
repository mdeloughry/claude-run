import { marked } from "marked";
import { createTwoFilesPatch } from "diff";
import type { Exporter, ExportContext } from "./types";
import type { ContentBlock } from "../storage";
import { sanitizeText, escapeHtml } from "./sanitize";

// SVG icons as inline strings
const ICONS = {
  terminal: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
  search: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  pencil: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`,
  file: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`,
  folder: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`,
  wrench: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  bulb: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  x: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
};

function getIcon(toolName: string): string {
  const n = toolName.toLowerCase();
  if (n === "bash") return ICONS.terminal;
  if (n === "grep" || n === "glob") return ICONS.search;
  if (n === "edit") return ICONS.pencil;
  if (n === "read" || n === "write") return ICONS.file;
  if (n === "task") return ICONS.folder;
  return ICONS.wrench;
}

function renderDiff(
  filePath: string,
  oldStr: string,
  newStr: string,
): string {
  const patch = createTwoFilesPatch(filePath, filePath, oldStr, newStr, "", "");
  const lines = patch.split("\n").slice(4); // skip header
  return lines
    .map((line) => {
      if (line.startsWith("+"))
        return `<span class="diff-add">${escapeHtml(line)}</span>`;
      if (line.startsWith("-"))
        return `<span class="diff-del">${escapeHtml(line)}</span>`;
      if (line.startsWith("@"))
        return `<span class="diff-hunk">${escapeHtml(line)}</span>`;
      return escapeHtml(line);
    })
    .join("\n");
}

function renderToolInputHtml(
  name: string,
  input: Record<string, unknown>,
): string {
  const n = name.toLowerCase();

  if (n === "bash" && input.command) {
    return `<pre class="code-block"><code>${escapeHtml(String(input.command))}</code></pre>`;
  }

  if (n === "edit" && input.file_path && input.old_string !== undefined) {
    const diff = renderDiff(
      String(input.file_path),
      String(input.old_string || ""),
      String(input.new_string || ""),
    );
    return `<div class="file-path">${escapeHtml(String(input.file_path))}</div><pre class="diff-block"><code>${diff}</code></pre>`;
  }

  if ((n === "read" || n === "write") && input.file_path) {
    return `<div class="file-path">${escapeHtml(String(input.file_path))}</div>`;
  }

  if (n === "grep" && input.pattern) {
    let s = `<span class="tool-meta">Pattern: <code>${escapeHtml(String(input.pattern))}</code></span>`;
    if (input.path) s += ` <span class="tool-meta">in <code>${escapeHtml(String(input.path))}</code></span>`;
    return s;
  }

  if (n === "glob" && input.pattern) {
    let s = `<span class="tool-meta">Pattern: <code>${escapeHtml(String(input.pattern))}</code></span>`;
    if (input.path) s += ` <span class="tool-meta">in <code>${escapeHtml(String(input.path))}</code></span>`;
    return s;
  }

  return `<pre class="code-block"><code>${escapeHtml(JSON.stringify(input, null, 2))}</code></pre>`;
}

function renderContentBlocks(blocks: ContentBlock[], stripTools?: boolean): string {
  const toolMap = new Map<string, string>();
  for (const b of blocks) {
    if (b.type === "tool_use" && b.id && b.name) toolMap.set(b.id, b.name);
  }

  const parts: string[] = [];

  for (const block of blocks) {
    if (stripTools && block.type !== "text") continue;

    if (block.type === "text" && block.text) {
      const sanitized = sanitizeText(block.text);
      if (sanitized) {
        parts.push(`<div class="msg-text">${marked.parse(sanitized)}</div>`);
      }
    }

    if (block.type === "thinking" && block.thinking) {
      const truncated =
        block.thinking.length > 5000
          ? block.thinking.slice(0, 5000) + "..."
          : block.thinking;
      parts.push(
        `<details class="thinking-block">` +
          `<summary>${ICONS.bulb} Thinking</summary>` +
          `<pre>${escapeHtml(truncated)}</pre>` +
          `</details>`,
      );
    }

    if (block.type === "tool_use") {
      const input =
        block.input && typeof block.input === "object"
          ? (block.input as Record<string, unknown>)
          : undefined;
      const icon = getIcon(block.name || "");
      const inputHtml = input
        ? renderToolInputHtml(block.name || "", input)
        : "";
      parts.push(
        `<details class="tool-block">` +
          `<summary>${icon} <span class="tool-name">${escapeHtml(block.name || "tool")}</span></summary>` +
          `<div class="tool-content">${inputHtml}</div>` +
          `</details>`,
      );
    }

    if (block.type === "tool_result") {
      const isError = block.is_error;
      const raw =
        typeof block.content === "string"
          ? block.content
          : JSON.stringify(block.content, null, 2);
      const content = sanitizeText(raw);
      const truncated =
        content.length > 2000 ? content.slice(0, 2000) + "..." : content;
      const icon = isError ? ICONS.x : ICONS.check;
      const cls = isError ? "result-error" : "result-success";
      parts.push(
        `<details class="result-block ${cls}">` +
          `<summary>${icon} ${isError ? "Error" : "Result"}</summary>` +
          `<pre>${escapeHtml(truncated)}</pre>` +
          `</details>`,
      );
    }
  }

  return parts.join("\n");
}

const CSS = `
:root {
  --bg: #09090b;
  --surface: #18181b;
  --border: #27272a;
  --text: #e4e4e7;
  --text-muted: #71717a;
  --user-bg: rgba(79, 70, 229, 0.8);
  --user-text: #e0e7ff;
  --assistant-bg: rgba(14, 116, 144, 0.5);
  --assistant-text: #e4e4e7;
  --thinking-bg: rgba(245, 158, 11, 0.1);
  --thinking-border: rgba(245, 158, 11, 0.2);
  --thinking-text: #fbbf24;
  --tool-bg: rgba(100, 116, 139, 0.1);
  --tool-border: rgba(100, 116, 139, 0.2);
  --tool-text: #cbd5e1;
  --result-success-bg: rgba(20, 184, 166, 0.1);
  --result-success-border: rgba(20, 184, 166, 0.2);
  --result-success-text: #5eead4;
  --result-error-bg: rgba(244, 63, 94, 0.1);
  --result-error-border: rgba(244, 63, 94, 0.2);
  --result-error-text: #fda4af;
  --diff-add: #22c55e;
  --diff-del: #ef4444;
  --diff-hunk: #8b5cf6;
  --code-bg: #0c0c0f;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Geist Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
}

.container {
  max-width: 768px;
  margin: 0 auto;
  padding: 24px 16px;
}

.header {
  border-bottom: 1px solid var(--border);
  padding-bottom: 16px;
  margin-bottom: 24px;
}

.header h1 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.header-meta {
  font-size: 11px;
  color: var(--text-muted);
}

.header-meta span { margin-right: 16px; }

.controls {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.controls button {
  padding: 6px 12px;
  font-size: 11px;
  background: var(--surface);
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
}

.controls button:hover { background: var(--border); }
.controls button.active { color: var(--text); border-color: var(--text-muted); }

.messages { display: flex; flex-direction: column; gap: 8px; }

.msg-user {
  display: flex;
  justify-content: flex-end;
}

.msg-user .bubble {
  background: var(--user-bg);
  color: var(--user-text);
  border-radius: 16px 16px 4px 16px;
  padding: 10px 14px;
  max-width: 85%;
}

.msg-assistant .bubble {
  background: var(--assistant-bg);
  color: var(--assistant-text);
  border-radius: 16px 16px 16px 4px;
  padding: 10px 14px;
  max-width: 85%;
}

.msg-text { word-wrap: break-word; overflow-wrap: break-word; }
.msg-text p { margin: 0.4em 0; }
.msg-text pre {
  background: var(--code-bg);
  border-radius: 8px;
  padding: 12px;
  overflow-x: auto;
  margin: 8px 0;
}
.msg-text code {
  font-family: inherit;
  font-size: 12px;
}
.msg-text p code {
  background: var(--code-bg);
  padding: 1px 5px;
  border-radius: 3px;
}

details { margin: 4px 0; }

details summary {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  user-select: none;
}

details summary::-webkit-details-marker { display: none; }
details summary::marker { content: ''; }

details summary::after {
  content: '\\25B6';
  font-size: 8px;
  opacity: 0.4;
  margin-left: 4px;
}

details[open] summary::after { content: '\\25BC'; }

.thinking-block summary {
  background: var(--thinking-bg);
  border: 1px solid var(--thinking-border);
  color: var(--thinking-text);
}

.thinking-block pre {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
  white-space: pre-wrap;
  max-height: 320px;
  overflow-y: auto;
}

.tool-block summary {
  background: var(--tool-bg);
  border: 1px solid var(--tool-border);
  color: var(--tool-text);
}

.tool-name { color: #e2e8f0; }

.tool-content {
  margin-top: 8px;
  padding-left: 4px;
}

.result-success summary {
  background: var(--result-success-bg);
  border: 1px solid var(--result-success-border);
  color: var(--result-success-text);
}

.result-error summary {
  background: var(--result-error-bg);
  border: 1px solid var(--result-error-border);
  color: var(--result-error-text);
}

.result-block pre {
  font-size: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 320px;
  overflow-y: auto;
}

.code-block {
  background: var(--code-bg);
  border-radius: 8px;
  padding: 12px;
  overflow-x: auto;
  font-size: 12px;
}

.code-block code { font-family: inherit; }

.diff-block {
  background: var(--code-bg);
  border-radius: 8px;
  padding: 12px;
  overflow-x: auto;
  font-size: 12px;
}

.diff-block code { font-family: inherit; }
.diff-add { color: var(--diff-add); }
.diff-del { color: var(--diff-del); }
.diff-hunk { color: var(--diff-hunk); }

.file-path {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.tool-meta {
  font-size: 11px;
  color: var(--text-muted);
}

.tool-meta code {
  background: var(--code-bg);
  padding: 1px 4px;
  border-radius: 3px;
}

.tool-only-msg { padding: 2px 0; }

.hidden { display: none !important; }
`;

const LIGHT_OVERRIDES = `
:root {
  --bg: #ffffff;
  --surface: #f4f4f5;
  --border: #e4e4e7;
  --text: #18181b;
  --text-muted: #71717a;
  --user-bg: #dbeafe;
  --user-text: #1e3a5f;
  --assistant-bg: #f4f4f5;
  --assistant-text: #18181b;
  --thinking-bg: rgba(245, 158, 11, 0.08);
  --thinking-border: rgba(245, 158, 11, 0.2);
  --thinking-text: #b45309;
  --tool-bg: rgba(100, 116, 139, 0.08);
  --tool-border: rgba(100, 116, 139, 0.2);
  --tool-text: #475569;
  --result-success-bg: rgba(20, 184, 166, 0.08);
  --result-success-border: rgba(20, 184, 166, 0.2);
  --result-success-text: #0f766e;
  --result-error-bg: rgba(244, 63, 94, 0.08);
  --result-error-border: rgba(244, 63, 94, 0.2);
  --result-error-text: #be123c;
  --diff-add: #16a34a;
  --diff-del: #dc2626;
  --diff-hunk: #7c3aed;
  --code-bg: #f4f4f5;
}
.tool-name { color: #334155; }
`;

const MINIMAL_OVERRIDES = `
:root {
  --bg: #ffffff;
  --surface: #ffffff;
  --border: #e4e4e7;
  --text: #18181b;
  --text-muted: #71717a;
  --user-bg: transparent;
  --user-text: #18181b;
  --assistant-bg: transparent;
  --assistant-text: #18181b;
  --thinking-bg: transparent;
  --thinking-border: #e4e4e7;
  --thinking-text: #92400e;
  --tool-bg: transparent;
  --tool-border: #e4e4e7;
  --tool-text: #475569;
  --result-success-bg: transparent;
  --result-success-border: #e4e4e7;
  --result-success-text: #0f766e;
  --result-error-bg: transparent;
  --result-error-border: #e4e4e7;
  --result-error-text: #be123c;
  --diff-add: #16a34a;
  --diff-del: #dc2626;
  --diff-hunk: #7c3aed;
  --code-bg: #fafafa;
}
body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 15px;
  line-height: 1.7;
}
.container { max-width: 680px; }
.msg-user .bubble, .msg-assistant .bubble {
  background: transparent;
  border-radius: 0;
  padding: 0;
  max-width: 100%;
}
.msg-assistant .bubble {
  border-left: 3px solid #d4d4d8;
  padding-left: 16px;
}
.msg-user { justify-content: flex-start; }
.msg-user .bubble { font-weight: 500; }
.tool-name { color: #334155; }
.msg-text pre { background: #fafafa; border: 1px solid #e4e4e7; }
.msg-text p code { background: #f4f4f5; }
`;

const JS = `
document.addEventListener('DOMContentLoaded', function() {
  var collapseBtn = document.getElementById('toggle-collapse');
  var expandBtn = document.getElementById('toggle-expand');
  var toolEls = document.querySelectorAll('[data-tool]');

  function setCollapsed(collapsed) {
    toolEls.forEach(function(el) { el.classList.toggle('hidden', collapsed); });
    collapseBtn.classList.toggle('active', collapsed);
    expandBtn.classList.toggle('active', !collapsed);
  }

  collapseBtn.addEventListener('click', function() { setCollapsed(true); });
  expandBtn.addEventListener('click', function() { setCollapsed(false); });
});
`;

function renderMessage(
  type: string,
  content: string | ContentBlock[] | undefined,
  stripTools?: boolean,
): string {
  if (!content) return "";

  const isUser = type === "user";

  if (typeof content === "string") {
    const sanitized = sanitizeText(content);
    if (!sanitized) return "";
    const html = isUser
      ? escapeHtml(sanitized)
      : (marked.parse(sanitized) as string);
    return `<div class="msg-${isUser ? "user" : "assistant"}"><div class="bubble">${html}</div></div>`;
  }

  // ContentBlock[]
  const textBlocks = content.filter(
    (b) => b.type === "text" && b.text && sanitizeText(b.text).length > 0,
  );
  const toolBlocks = stripTools
    ? []
    : content.filter(
        (b) =>
          b.type === "tool_use" ||
          b.type === "tool_result" ||
          b.type === "thinking",
      );

  const parts: string[] = [];

  if (textBlocks.length > 0) {
    const textHtml = textBlocks
      .map((b) => {
        const sanitized = sanitizeText(b.text!);
        return isUser
          ? `<div style="white-space:pre-wrap">${escapeHtml(sanitized)}</div>`
          : `<div class="msg-text">${marked.parse(sanitized)}</div>`;
      })
      .join("\n");

    parts.push(
      `<div class="msg-${isUser ? "user" : "assistant"}"><div class="bubble">${textHtml}</div></div>`,
    );
  }

  if (toolBlocks.length > 0) {
    const toolHtml = renderContentBlocks(toolBlocks);
    parts.push(`<div class="tool-only-msg" data-tool="1">${toolHtml}</div>`);
  }

  if (parts.length === 0 && toolBlocks.length > 0) {
    const toolHtml = renderContentBlocks(toolBlocks);
    parts.push(`<div class="tool-only-msg" data-tool="1">${toolHtml}</div>`);
  }

  return parts.join("\n");
}

export const htmlExporter: Exporter = {
  contentType: "text/html",
  fileExtension: "html",
  generate(ctx: ExportContext): string {
    const { messages, session } = ctx;
    const theme = ctx.theme || "dark";

    const messageHtml = messages
      .filter((m) => m.type === "user" || m.type === "assistant")
      .map((m) => renderMessage(m.type, m.message?.content, ctx.stripTools))
      .filter(Boolean)
      .join("\n");

    let themeCSS = CSS;
    if (theme === "light") themeCSS += LIGHT_OVERRIDES;
    else if (theme === "minimal") themeCSS += MINIMAL_OVERRIDES;

    const fontLink =
      theme === "minimal"
        ? `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">`
        : `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">`;

    const controlsHtml = ctx.stripTools
      ? ""
      : `<div class="controls">
<button id="toggle-expand" class="active">Show All</button>
<button id="toggle-collapse">Hide Tools</button>
</div>`;

    const scriptHtml = ctx.stripTools ? "" : `<script>${JS}</script>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(session.display)} - Claude Conversation</title>
${fontLink}
<style>${themeCSS}</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>${escapeHtml(session.display)}</h1>
<div class="header-meta">
<span>${escapeHtml(session.projectName)}</span>
<span>${new Date(session.timestamp).toLocaleString()}</span>
<span>${escapeHtml(session.id)}</span>
</div>
</div>
${controlsHtml}
<div class="messages">
${messageHtml}
</div>
</div>
${scriptHtml}
</body>
</html>`;
  },
};

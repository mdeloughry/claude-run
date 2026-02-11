import type { Exporter, ExportContext } from "./types";
import type { ContentBlock } from "../storage";
import { sanitizeText } from "./sanitize";

function formatToolInput(name: string, input: Record<string, unknown>): string {
  const n = name.toLowerCase();
  if (n === "bash" && input.command) return String(input.command);
  if ((n === "read" || n === "edit" || n === "write") && input.file_path)
    return String(input.file_path);
  if (n === "grep" && input.pattern) return `pattern: ${input.pattern}`;
  if (n === "glob" && input.pattern) return `pattern: ${input.pattern}`;
  return JSON.stringify(input, null, 2);
}

function extractText(blocks: ContentBlock[], stripTools?: boolean): string {
  const parts: string[] = [];

  for (const block of blocks) {
    if (stripTools && block.type !== "text") continue;

    if (block.type === "text" && block.text) {
      const sanitized = sanitizeText(block.text);
      if (sanitized) parts.push(sanitized);
    }

    if (block.type === "thinking" && block.thinking) {
      const truncated =
        block.thinking.length > 5000
          ? block.thinking.slice(0, 5000) + "..."
          : block.thinking;
      parts.push(`[Thinking]\n${truncated}\n[/Thinking]`);
    }

    if (block.type === "tool_use") {
      const input =
        block.input && typeof block.input === "object"
          ? (block.input as Record<string, unknown>)
          : undefined;
      const inputStr = input
        ? formatToolInput(block.name || "", input)
        : "";
      parts.push(`[Tool: ${block.name}]${inputStr ? "\n" + inputStr : ""}`);
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
      parts.push(
        `[${isError ? "Error" : "Result"}]${truncated ? "\n" + truncated : ""}`,
      );
    }
  }

  return parts.join("\n\n");
}

export const textExporter: Exporter = {
  contentType: "text/plain",
  fileExtension: "txt",
  generate(ctx: ExportContext): string {
    const { messages, session } = ctx;
    const lines: string[] = [];

    lines.push(`Session: ${session.display}`);
    lines.push(`Project: ${session.projectName} (${session.project})`);
    lines.push(`Date: ${new Date(session.timestamp).toLocaleString()}`);
    lines.push(`ID: ${session.id}`);
    lines.push("");
    lines.push("=".repeat(60));
    lines.push("");

    for (const msg of messages) {
      if (msg.type === "summary") {
        lines.push(`=== Summary ===`);
        lines.push(msg.summary || "");
        lines.push("");
        continue;
      }

      const role = msg.type === "user" ? "User" : "Assistant";
      const model = msg.message?.model ? ` (${msg.message.model})` : "";
      const ts = msg.timestamp
        ? ` ${new Date(msg.timestamp).toLocaleString()}`
        : "";
      lines.push(`=== ${role}${model}${ts} ===`);

      const content = msg.message?.content;
      if (typeof content === "string") {
        lines.push(sanitizeText(content));
      } else if (Array.isArray(content)) {
        lines.push(extractText(content, ctx.stripTools));
      }

      lines.push("");
    }

    return lines.join("\n");
  },
};

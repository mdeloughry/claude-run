import type { Exporter, ExportContext } from "./types";
import type { ContentBlock } from "../types";
import { sanitizeText } from "./sanitize";

function renderToolInput(
  name: string,
  input: Record<string, unknown>,
): string {
  const n = name.toLowerCase();

  if (n === "bash" && input.command) {
    return `\`\`\`bash\n${input.command}\n\`\`\``;
  }

  if (n === "edit" && input.file_path) {
    const parts = [`**${input.file_path}**`];
    if (input.old_string) {
      parts.push("```diff");
      parts.push(
        String(input.old_string)
          .split("\n")
          .map((l) => `- ${l}`)
          .join("\n"),
      );
      parts.push(
        String(input.new_string || "")
          .split("\n")
          .map((l) => `+ ${l}`)
          .join("\n"),
      );
      parts.push("```");
    }
    return parts.join("\n");
  }

  if ((n === "read" || n === "write") && input.file_path) {
    return `**${input.file_path}**`;
  }

  if (n === "grep" && input.pattern) {
    const parts = [`Pattern: \`${input.pattern}\``];
    if (input.path) parts.push(`Path: \`${input.path}\``);
    if (input.glob) parts.push(`Glob: \`${input.glob}\``);
    return parts.join(" | ");
  }

  if (n === "glob" && input.pattern) {
    return `Pattern: \`${input.pattern}\`${input.path ? ` in \`${input.path}\`` : ""}`;
  }

  return `\`\`\`json\n${JSON.stringify(input, null, 2)}\n\`\`\``;
}

function renderBlocks(blocks: ContentBlock[], stripTools?: boolean): string {
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
      parts.push(
        `<details>\n<summary>Thinking</summary>\n\n${truncated}\n\n</details>`,
      );
    }

    if (block.type === "tool_use") {
      const input =
        block.input && typeof block.input === "object"
          ? (block.input as Record<string, unknown>)
          : undefined;
      const inputStr = input
        ? renderToolInput(block.name || "", input)
        : "";
      parts.push(
        `<details>\n<summary>Tool: ${block.name}</summary>\n\n${inputStr}\n\n</details>`,
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
      const label = isError ? "Error" : "Result";
      parts.push(
        `<details>\n<summary>${label}</summary>\n\n\`\`\`\n${truncated}\n\`\`\`\n\n</details>`,
      );
    }
  }

  return parts.join("\n\n");
}

export const markdownExporter: Exporter = {
  contentType: "text/markdown",
  fileExtension: "md",
  generate(ctx: ExportContext): string {
    const { messages, session } = ctx;
    const lines: string[] = [];

    lines.push(`# ${session.display}`);
    lines.push("");
    lines.push(
      `**Project:** ${session.projectName} (\`${session.project}\`)`,
    );
    lines.push(
      `**Date:** ${new Date(session.timestamp).toLocaleString()}`,
    );
    lines.push(`**Session ID:** \`${session.id}\``);
    lines.push("");
    lines.push("---");
    lines.push("");

    for (const msg of messages) {
      if (msg.type === "summary") {
        lines.push(`> **Summary:** ${msg.summary}`);
        lines.push("");
        continue;
      }

      const role = msg.type === "user" ? "User" : "Assistant";
      const model = msg.message?.model ? ` *(${msg.message.model})*` : "";
      lines.push(`## ${role}${model}`);
      lines.push("");

      const content = msg.message?.content;
      if (typeof content === "string") {
        lines.push(sanitizeText(content));
      } else if (Array.isArray(content)) {
        lines.push(renderBlocks(content, ctx.stripTools));
      }

      lines.push("");
    }

    return lines.join("\n");
  },
};

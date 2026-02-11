import { useState, memo } from "react";
import type { ConversationMessage, ContentBlock } from "../lib/types";
import {
  Lightbulb,
  Wrench,
  Check,
  X,
  Terminal,
  Search,
  Pencil,
  FolderOpen,
  Globe,
  MessageSquare,
  ListTodo,
  FilePlus2,
  FileCode,
  GitBranch,
  Database,
  HardDrive,
  Bot,
  User,
} from "lucide-react";
import { sanitizeText } from "../utils";
import { MarkdownRenderer } from "./markdown-renderer";
import {
  TodoRenderer,
  EditRenderer,
  WriteRenderer,
  BashRenderer,
  BashResultRenderer,
  GrepRenderer,
  GlobRenderer,
  SearchResultRenderer,
  ReadRenderer,
  FileContentRenderer,
  AskQuestionRenderer,
  TaskRenderer,
} from "./tool-renderers";

interface MessageBlockProps {
  message: ConversationMessage;
  hideTools?: boolean;
}

function buildToolMap(content: ContentBlock[]): Map<string, string> {
  const toolMap = new Map<string, string>();
  for (const block of content) {
    if (block.type === "tool_use" && block.id && block.name) {
      toolMap.set(block.id, block.name);
    }
  }
  return toolMap;
}

const MessageBlock = memo(function MessageBlock(props: MessageBlockProps) {
  const { message, hideTools } = props;

  const isUser = message.type === "user";
  const content = message.message?.content;

  const getTextBlocks = (): ContentBlock[] => {
    if (!content || typeof content === "string") {
      return [];
    }
    return content.filter((b) => b.type === "text");
  };

  const getToolBlocks = (): ContentBlock[] => {
    if (!content || typeof content === "string") {
      return [];
    }
    return content.filter(
      (b) =>
        b.type === "tool_use" || b.type === "tool_result" || b.type === "thinking"
    );
  };

  const getVisibleTextBlocks = (): ContentBlock[] => {
    return getTextBlocks().filter(
      (b) => b.text && sanitizeText(b.text).length > 0
    );
  };

  const hasVisibleText = (): boolean => {
    if (typeof content === "string") {
      return sanitizeText(content).length > 0;
    }
    return getVisibleTextBlocks().length > 0;
  };

  const toolBlocks = getToolBlocks();
  const visibleTextBlocks = getVisibleTextBlocks();
  const hasText = hasVisibleText();
  const hasTools = toolBlocks.length > 0;

  const toolMap = Array.isArray(content) ? buildToolMap(content) : new Map<string, string>();

  if (!hasText && hasTools) {
    if (hideTools) {
      const toolUseCount = toolBlocks.filter((b) => b.type === "tool_use").length;
      if (toolUseCount === 0) return null;
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-[var(--color-text-muted)]">
          <Wrench size={12} className="opacity-50" />
          <span className="font-pixel">{toolUseCount} tool call{toolUseCount !== 1 ? "s" : ""}</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-1 py-0.5">
        {toolBlocks.map((block, index) => (
          <ContentBlockRenderer key={index} block={block} toolMap={toolMap} />
        ))}
      </div>
    );
  }

  if (!hasText && !hasTools) {
    return null;
  }

  const avatar = isUser ? (
    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 bg-[var(--color-user-bubble)]">
      <User size={14} className="text-[var(--color-user-text)]" />
    </div>
  ) : (
    <svg className="w-6 h-6 rounded-full shrink-0 mt-1" viewBox="0 0 512 509.64" fill="none">
      <path fill="#D77655" d="M115.612 0h280.775C459.974 0 512 52.026 512 115.612v278.415c0 63.587-52.026 115.612-115.613 115.612H115.612C52.026 509.639 0 457.614 0 394.027V115.612C0 52.026 52.026 0 115.612 0z"/>
      <path fill="#FCF2EE" fillRule="nonzero" d="M142.27 316.619l73.655-41.326 1.238-3.589-1.238-1.996-3.589-.001-12.31-.759-42.084-1.138-36.498-1.516-35.361-1.896-8.897-1.895-8.34-10.995.859-5.484 7.482-5.03 10.717.935 23.683 1.617 35.537 2.452 25.782 1.517 38.193 3.968h6.064l.86-2.451-2.073-1.517-1.618-1.517-36.776-24.922-39.81-26.338-20.852-15.166-11.273-7.683-5.687-7.204-2.451-15.721 10.237-11.273 13.75.935 3.513.936 13.928 10.716 29.749 23.027 38.848 28.612 5.687 4.727 2.275-1.617.278-1.138-2.553-4.271-21.13-38.193-22.546-38.848-10.035-16.101-2.654-9.655c-.935-3.968-1.617-7.304-1.617-11.374l11.652-15.823 6.445-2.073 15.545 2.073 6.547 5.687 9.655 22.092 15.646 34.78 24.265 47.291 7.103 14.028 3.791 12.992 1.416 3.968 2.449-.001v-2.275l1.997-26.641 3.69-32.707 3.589-42.084 1.239-11.854 5.863-14.206 11.652-7.683 9.099 4.348 7.482 10.716-1.036 6.926-4.449 28.915-8.72 45.294-5.687 30.331h3.313l3.792-3.791 15.342-20.372 25.782-32.227 11.374-12.789 13.27-14.129 8.517-6.724 16.1-.001 11.854 17.617-5.307 18.199-16.581 21.029-13.75 17.819-19.716 26.54-12.309 21.231 1.138 1.694 2.932-.278 44.536-9.479 24.062-4.347 28.714-4.928 12.992 6.066 1.416 6.167-5.106 12.613-30.71 7.583-36.018 7.204-53.636 12.689-.657.48.758.935 24.164 2.275 10.337.556h25.301l47.114 3.514 12.309 8.139 7.381 9.959-1.238 7.583-18.957 9.655-25.579-6.066-59.702-14.205-20.474-5.106-2.83-.001v1.694l17.061 16.682 31.266 28.233 39.152 36.397 1.997 8.999-5.03 7.102-5.307-.758-34.401-25.883-13.27-11.651-30.053-25.302-1.996-.001v2.654l6.926 10.136 36.574 54.975 1.895 16.859-2.653 5.485-9.479 3.311-10.414-1.895-21.408-30.054-22.092-33.844-17.819-30.331-2.173 1.238-10.515 113.261-4.929 5.788-11.374 4.348-9.478-7.204-5.03-11.652 5.03-23.027 6.066-30.052 4.928-23.886 4.449-29.674 2.654-9.858-.177-.657-2.173.278-22.37 30.71-34.021 45.977-26.919 28.815-6.445 2.553-11.173-5.789 1.037-10.337 6.243-9.2 37.257-47.392 22.47-29.371 14.508-16.961-.101-2.451h-.859l-98.954 64.251-17.618 2.275-7.583-7.103.936-11.652 3.589-3.791 29.749-20.474-.101.102.024.101z"/>
    </svg>
  );

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2 min-w-0`}>
      {!isUser && avatar}
      <div className="max-w-[85%] min-w-0">
        <div
          className={`px-3.5 py-2.5 rounded-2xl overflow-hidden ${
            isUser
              ? "bg-[var(--color-user-bubble)] text-[var(--color-user-text)] rounded-br-md"
              : "bg-[var(--color-assistant-bubble)] text-[var(--color-assistant-text)] rounded-bl-md"
          }`}
        >
          {typeof content === "string" ? (
            isUser ? (
              <div className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">
                {sanitizeText(content)}
              </div>
            ) : (
              <MarkdownRenderer content={sanitizeText(content)} />
            )
          ) : (
            <div className="flex flex-col gap-1">
              {visibleTextBlocks.map((block, index) => (
                <ContentBlockRenderer key={index} block={block} isUser={isUser} toolMap={toolMap} />
              ))}
            </div>
          )}
        </div>

        {hasTools && !hideTools && (
          <div className="flex flex-col gap-1 mt-1.5">
            {toolBlocks.map((block, index) => (
              <ContentBlockRenderer key={index} block={block} toolMap={toolMap} />
            ))}
          </div>
        )}
      </div>
      {isUser && avatar}
    </div>
  );
});

interface ContentBlockRendererProps {
  block: ContentBlock;
  isUser?: boolean;
  toolMap?: Map<string, string>;
}

const TOOL_ICONS: Record<string, typeof Wrench> = {
  todowrite: ListTodo,
  read: FileCode,
  bash: Terminal,
  grep: Search,
  edit: Pencil,
  write: FilePlus2,
  glob: FolderOpen,
  task: Bot,
};

const TOOL_ICON_PATTERNS: Array<{ patterns: string[]; icon: typeof Wrench }> = [
  { patterns: ["web", "fetch", "url"], icon: Globe },
  { patterns: ["ask", "question"], icon: MessageSquare },
  { patterns: ["git", "commit"], icon: GitBranch },
  { patterns: ["sql", "database", "query"], icon: Database },
  { patterns: ["file", "disk"], icon: HardDrive },
];

function getToolIcon(toolName: string) {
  const name = toolName.toLowerCase();

  if (TOOL_ICONS[name]) {
    return TOOL_ICONS[name];
  }

  for (const { patterns, icon } of TOOL_ICON_PATTERNS) {
    if (patterns.some((p) => name.includes(p))) {
      return icon;
    }
  }

  return Wrench;
}

function getFilePathPreview(filePath: string): string {
  const parts = filePath.split("/");
  return parts.slice(-2).join("/");
}

type PreviewHandler = (input: Record<string, unknown>) => string | null;

const TOOL_PREVIEW_HANDLERS: Record<string, PreviewHandler> = {
  read: (input) => input.file_path ? getFilePathPreview(String(input.file_path)) : null,
  edit: (input) => input.file_path ? getFilePathPreview(String(input.file_path)) : null,
  write: (input) => input.file_path ? getFilePathPreview(String(input.file_path)) : null,
  bash: (input) => {
    if (!input.command) {
      return null;
    }
    const cmd = String(input.command);
    return cmd.length > 50 ? cmd.slice(0, 50) + "..." : cmd;
  },
  grep: (input) => input.pattern ? `"${String(input.pattern)}"` : null,
  glob: (input) => input.pattern ? String(input.pattern) : null,
  task: (input) => input.description ? String(input.description) : null,
};

function getToolPreview(toolName: string, input: Record<string, unknown> | undefined): string | null {
  if (!input) {
    return null;
  }

  const name = toolName.toLowerCase();
  const handler = TOOL_PREVIEW_HANDLERS[name];

  if (handler) {
    return handler(input);
  }

  if (name.includes("web") && input.url) {
    try {
      const url = new URL(String(input.url));
      return url.hostname;
    } catch {
      return String(input.url).slice(0, 30);
    }
  }

  return null;
}

interface ToolInputRendererProps {
  toolName: string;
  input: Record<string, unknown>;
}

function ToolInputRenderer(props: ToolInputRendererProps) {
  const { toolName, input } = props;
  const name = toolName.toLowerCase();

  if (name === "todowrite" && input.todos) {
    return <TodoRenderer todos={input.todos as Array<{ content: string; status: "pending" | "in_progress" | "completed" }>} />;
  }

  if (name === "edit" && input.file_path) {
    return <EditRenderer input={input as { file_path: string; old_string: string; new_string: string }} />;
  }

  if (name === "write" && input.file_path) {
    return <WriteRenderer input={input as { file_path: string; content: string }} />;
  }

  if (name === "bash" && input.command) {
    return <BashRenderer input={input as { command: string; description?: string }} />;
  }

  if (name === "grep" && input.pattern) {
    return <GrepRenderer input={input as { pattern: string; path?: string; glob?: string; type?: string }} />;
  }

  if (name === "glob" && input.pattern) {
    return <GlobRenderer input={input as { pattern: string; path?: string }} />;
  }

  if (name === "read" && input.file_path) {
    return <ReadRenderer input={input as { file_path: string; offset?: number; limit?: number }} />;
  }

  if (name === "askuserquestion" && input.questions) {
    return <AskQuestionRenderer input={input as { questions: Array<{ header: string; question: string; options: Array<{ label: string; description: string }>; multiSelect: boolean }> }} />;
  }

  if (name === "task" && input.prompt) {
    return <TaskRenderer input={input as { description: string; prompt: string; subagent_type: string; model?: string; run_in_background?: boolean; resume?: string }} />;
  }

  return (
    <pre className="text-xs text-slate-300 bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 mt-2 overflow-x-auto whitespace-pre-wrap break-all max-h-80 overflow-y-auto font-mono">
      {JSON.stringify(input, null, 2)}
    </pre>
  );
}

interface ToolResultRendererProps {
  toolName: string;
  content: string;
  isError?: boolean;
}

function ToolResultRenderer(props: ToolResultRendererProps) {
  const { toolName, content, isError } = props;
  const name = toolName.toLowerCase();

  if (name === "bash") {
    return <BashResultRenderer content={content} isError={isError} />;
  }

  if (name === "glob") {
    return <SearchResultRenderer content={content} isFileList />;
  }

  if (name === "grep") {
    return <SearchResultRenderer content={content} />;
  }

  if (name === "read") {
    return <FileContentRenderer content={content} />;
  }

  if (!content || content.trim().length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-teal-500/10 border border-teal-500/20 rounded-lg mt-2">
        <Check size={14} className="text-teal-400" />
        <span className="text-xs text-teal-300">Completed successfully</span>
      </div>
    );
  }

  const maxLength = 2000;
  const truncated = content.length > maxLength;
  const displayContent = truncated ? content.slice(0, maxLength) : content;

  return (
    <pre
      className={`text-xs rounded-lg p-3 mt-2 overflow-x-auto whitespace-pre-wrap break-all max-h-80 overflow-y-auto border ${
        isError
          ? "bg-rose-950/30 text-rose-200/80 border-rose-900/30"
          : "bg-teal-950/30 text-teal-200/80 border-teal-900/30"
      }`}
    >
      {displayContent}
      {truncated && <span className="text-[var(--color-text-muted)]">... ({content.length - maxLength} more chars)</span>}
    </pre>
  );
}

function ContentBlockRenderer(props: ContentBlockRendererProps) {
  const { block, isUser, toolMap } = props;
  const [expanded, setExpanded] = useState(false);

  if (block.type === "text" && block.text) {
    const sanitized = sanitizeText(block.text);
    if (!sanitized) {
      return null;
    }
    if (isUser) {
      return (
        <div className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">
          {sanitized}
        </div>
      );
    }
    return <MarkdownRenderer content={sanitized} />;
  }

  if (block.type === "thinking" && block.thinking) {
    return (
      <div className={expanded ? "w-full" : ""}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/15 text-[11px] text-amber-400/90 transition-colors border border-amber-500/20"
        >
          <Lightbulb size={12} className="opacity-70" />
          <span className="font-medium font-pixel">thinking</span>
          <span className="text-[10px] opacity-50 ml-0.5">
            {expanded ? "▼" : "▶"}
          </span>
        </button>
        {expanded && (
          <pre className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg p-3 mt-2 whitespace-pre-wrap max-h-80 overflow-y-auto font-mono">
            {block.thinking}
          </pre>
        )}
      </div>
    );
  }

  if (block.type === "tool_use") {
    const input =
      block.input && typeof block.input === "object" ? block.input as Record<string, unknown> : undefined;
    const hasInput = input && Object.keys(input).length > 0;
    const Icon = getToolIcon(block.name || "");
    const preview = getToolPreview(block.name || "", input);
    const toolName = block.name?.toLowerCase() || "";

    const hasSpecialRenderer =
      toolName === "todowrite" ||
      toolName === "edit" ||
      toolName === "write" ||
      toolName === "bash" ||
      toolName === "grep" ||
      toolName === "glob" ||
      toolName === "read" ||
      toolName === "askuserquestion" ||
      toolName === "task";

    const shouldAutoExpand = toolName === "todowrite" || toolName === "askuserquestion" || toolName === "task";
    const isExpanded = expanded || shouldAutoExpand;

    return (
      <div className={isExpanded ? "w-full" : ""}>
        <button
          onClick={() => hasInput && !shouldAutoExpand && setExpanded(!expanded)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-500/10 hover:bg-slate-500/15 text-[11px] text-slate-300 transition-colors border border-slate-500/20"
        >
          <Icon size={12} className="opacity-60" />
          <span className="font-medium text-slate-200 font-pixel">{block.name}</span>
          {preview && (
            <span className="text-slate-500 font-normal truncate max-w-[200px]">
              {preview}
            </span>
          )}
          {hasInput && !shouldAutoExpand && (
            <span className="text-[10px] opacity-40 ml-0.5">
              {expanded ? "▼" : "▶"}
            </span>
          )}
        </button>
        {isExpanded && hasInput && hasSpecialRenderer ? (
          <ToolInputRenderer toolName={block.name || ""} input={input} />
        ) : (
          expanded &&
          hasInput && (
            <pre className="text-xs text-slate-300 bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 mt-2 overflow-x-auto whitespace-pre-wrap break-all max-h-80 overflow-y-auto">
              {JSON.stringify(input, null, 2)}
            </pre>
          )
        )}
      </div>
    );
  }

  if (block.type === "tool_result") {
    const isError = block.is_error;
    const rawContent =
      typeof block.content === "string"
        ? block.content
        : JSON.stringify(block.content, null, 2);
    const resultContent = sanitizeText(rawContent);
    const hasContent = resultContent.length > 0;
    const previewLength = 60;
    const contentPreview =
      hasContent && !expanded
        ? resultContent.slice(0, previewLength) + (resultContent.length > previewLength ? "..." : "")
        : null;

    const toolName = block.tool_use_id && toolMap ? toolMap.get(block.tool_use_id) || "" : "";

    return (
      <div className={expanded ? "w-full" : ""}>
        <button
          onClick={() => hasContent && setExpanded(!expanded)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] transition-colors border ${
            isError
              ? "bg-rose-500/10 hover:bg-rose-500/15 text-rose-400/90 border-rose-500/20"
              : "bg-teal-500/10 hover:bg-teal-500/15 text-teal-400/90 border-teal-500/20"
          }`}
        >
          {isError ? (
            <X size={12} className="opacity-70" />
          ) : (
            <Check size={12} className="opacity-70" />
          )}
          <span className="font-medium font-pixel">{isError ? "error" : "result"}</span>
          {contentPreview && !expanded && (
            <span
              className={`font-normal truncate max-w-[200px] ${isError ? "text-rose-500/70" : "text-teal-500/70"}`}
            >
              {contentPreview}
            </span>
          )}
          {hasContent && (
            <span className="text-[10px] opacity-40 ml-0.5">
              {expanded ? "▼" : "▶"}
            </span>
          )}
        </button>
        {expanded && hasContent && (
          <ToolResultRenderer
            toolName={toolName}
            content={resultContent}
            isError={isError}
          />
        )}
      </div>
    );
  }

  return null;
}

export default MessageBlock;

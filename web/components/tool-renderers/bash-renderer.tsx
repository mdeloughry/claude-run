import { Terminal, Play, AlertTriangle, CheckCircle2, Copy, Check } from "lucide-react";
import { useState } from "react";

interface BashInput {
  command: string;
  description?: string;
  timeout?: number;
}

interface BashRendererProps {
  input: BashInput;
}

interface BashResultRendererProps {
  content: string;
  isError?: boolean;
}

export function BashRenderer(props: BashRendererProps) {
  const { input } = props;
  const [copied, setCopied] = useState(false);

  if (!input || !input.command) {
    return null;
  }

  const command = input.command;
  const description = input.description;

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full mt-2">
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-code)]">
          <Terminal size={14} className="text-green-400" />
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">Command</span>
          {description && (
            <span className="text-xs text-[var(--color-text-muted)] truncate ml-1">— {description}</span>
          )}
          <button
            onClick={handleCopy}
            className="ml-auto p-1 hover:bg-[var(--color-bg-hover)] rounded transition-colors"
            title="Copy command"
          >
            {copied ? (
              <Check size={12} className="text-green-400" />
            ) : (
              <Copy size={12} className="text-[var(--color-text-muted)]" />
            )}
          </button>
        </div>
        <div className="p-3 overflow-x-auto">
          <div className="flex items-start gap-2">
            <pre className="text-xs font-mono m-0 p-0 bg-transparent! text-[var(--color-text-secondary)] whitespace-pre-wrap break-all">
              {command}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BashResultRenderer(props: BashResultRendererProps) {
  const { content, isError } = props;

  if (!content || content.trim().length === 0) {
    return (
      <div className="w-full mt-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-code)] border border-[var(--color-border)] rounded-lg">
          <CheckCircle2 size={14} className="text-teal-400" />
          <span className="text-xs text-[var(--color-text-muted)]">Command completed successfully (no output)</span>
        </div>
      </div>
    );
  }

  const lines = content.split("\n");
  const maxLines = 30;
  const truncated = lines.length > maxLines;
  const displayLines = truncated ? lines.slice(0, maxLines) : lines;

  return (
    <div className="w-full mt-2">
      <div
        className={`border rounded-lg overflow-hidden ${
          isError
            ? "bg-rose-950/20 border-rose-900/30"
            : "bg-[var(--color-bg-surface)] border-[var(--color-border)]"
        }`}
      >
        <div
          className={`flex items-center gap-2 px-3 py-2 border-b ${
            isError ? "border-rose-900/30 bg-rose-900/20" : "border-[var(--color-border)] bg-[var(--color-bg-code)]"
          }`}
        >
          {isError ? (
            <>
              <AlertTriangle size={14} className="text-rose-400" />
              <span className="text-xs font-medium text-rose-300">Error Output</span>
            </>
          ) : (
            <>
              <Play size={14} className="text-teal-400" />
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">Output</span>
            </>
          )}
          <span className="text-xs text-[var(--color-text-muted)] ml-auto">{lines.length} lines</span>
        </div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <pre
            className={`text-xs font-mono p-3 whitespace-pre-wrap break-all ${
              isError ? "text-rose-200/80" : "text-[var(--color-text-secondary)]"
            }`}
          >
            {displayLines.join("\n")}
            {truncated && (
              <div className="text-[var(--color-text-muted)] mt-2 pt-2 border-t border-[var(--color-border)]">
                ... {lines.length - maxLines} more lines
              </div>
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}

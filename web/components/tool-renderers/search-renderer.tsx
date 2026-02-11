import { Search, FileText, FolderOpen } from "lucide-react";
import { CopyButton } from "./copy-button";

interface GrepInput {
  pattern: string;
  path?: string;
  glob?: string;
  type?: string;
}

interface GlobInput {
  pattern: string;
  path?: string;
}

interface GrepRendererProps {
  input: GrepInput;
}

interface GlobRendererProps {
  input: GlobInput;
}

interface SearchResultRendererProps {
  content: string;
  isFileList?: boolean;
}

export function GrepRenderer(props: GrepRendererProps) {
  const { input } = props;

  if (!input || !input.pattern) {
    return null;
  }

  return (
    <div className="w-full mt-2">
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-code)]">
          <Search size={14} className="text-amber-400" />
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">Search</span>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-muted)]">Pattern:</span>
            <code className="text-xs font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">
              {input.pattern}
            </code>
          </div>
          {input.path && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-text-muted)]">Path:</span>
              <span className="text-xs font-mono text-[var(--color-text-secondary)]">{input.path}</span>
            </div>
          )}
          {input.glob && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-text-muted)]">Glob:</span>
              <span className="text-xs font-mono text-[var(--color-text-secondary)]">{input.glob}</span>
            </div>
          )}
          {input.type && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-text-muted)]">Type:</span>
              <span className="text-xs font-mono text-[var(--color-text-secondary)]">{input.type}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function GlobRenderer(props: GlobRendererProps) {
  const { input } = props;

  if (!input || !input.pattern) {
    return null;
  }

  return (
    <div className="w-full mt-2">
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-code)]">
          <FolderOpen size={14} className="text-cyan-400" />
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">Find Files</span>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-muted)]">Pattern:</span>
            <code className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded">
              {input.pattern}
            </code>
          </div>
          {input.path && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-text-muted)]">Path:</span>
              <span className="text-xs font-mono text-[var(--color-text-secondary)]">{input.path}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SearchResultRenderer(props: SearchResultRendererProps) {
  const { content, isFileList } = props;

  if (!content || content.trim().length === 0) {
    return (
      <div className="w-full mt-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-code)] border border-[var(--color-border)] rounded-lg">
          <Search size={14} className="text-[var(--color-text-muted)]" />
          <span className="text-xs text-[var(--color-text-muted)]">No matches found</span>
        </div>
      </div>
    );
  }

  const lines = content.split("\n").filter((l) => l.trim());
  const maxLines = 25;
  const truncated = lines.length > maxLines;
  const displayLines = truncated ? lines.slice(0, maxLines) : lines;

  if (isFileList) {
    return (
      <div className="w-full mt-2">
        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-code)]">
            <FolderOpen size={14} className="text-cyan-400" />
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">Files Found</span>
            <span className="text-xs text-[var(--color-text-muted)] ml-auto">{lines.length} files</span>
          </div>
          <div className="overflow-y-auto max-h-60">
            <ul className="divide-y divide-[var(--color-border-subtle)]">
              {displayLines.map((line, index) => (
                <li key={index} className="group flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--color-bg-hover)]">
                  <FileText size={12} className="text-[var(--color-text-muted)] flex-shrink-0" />
                  <span className="text-xs font-mono text-[var(--color-text-secondary)] truncate flex-1">{line}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyButton text={line} />
                  </div>
                </li>
              ))}
            </ul>
            {truncated && (
              <div className="px-3 py-2 text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)]">
                ... {lines.length - maxLines} more files
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-2">
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-code)]">
          <Search size={14} className="text-amber-400" />
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">Results</span>
          <span className="text-xs text-[var(--color-text-muted)] ml-auto">{lines.length} matches</span>
        </div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <pre className="text-xs font-mono p-3 text-[var(--color-text-secondary)] whitespace-pre-wrap">
            {displayLines.join("\n")}
            {truncated && (
              <div className="text-[var(--color-text-muted)] mt-2 pt-2 border-t border-[var(--color-border)]">
                ... {lines.length - maxLines} more matches
              </div>
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}

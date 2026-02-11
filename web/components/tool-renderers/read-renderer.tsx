import { FileText, FileCode } from "lucide-react";
import { CopyButton } from "./copy-button";

interface ReadInput {
  file_path: string;
  offset?: number;
  limit?: number;
}

interface ReadRendererProps {
  input: ReadInput;
}

interface FileContentRendererProps {
  content: string;
  fileName?: string;
}

function getFileName(filePath: string) {
  const parts = filePath.split("/");
  return parts.slice(-2).join("/");
}

function getFileExtension(filePath: string) {
  const parts = filePath.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() : "";
}

function getLanguageFromExt(ext: string) {
  const languageMap: Record<string, string> = {
    ts: "TypeScript",
    tsx: "TypeScript React",
    js: "JavaScript",
    jsx: "JavaScript React",
    py: "Python",
    rb: "Ruby",
    go: "Go",
    rs: "Rust",
    java: "Java",
    cpp: "C++",
    c: "C",
    css: "CSS",
    scss: "SCSS",
    html: "HTML",
    json: "JSON",
    yaml: "YAML",
    yml: "YAML",
    md: "Markdown",
    sql: "SQL",
    sh: "Shell",
    bash: "Bash",
  };
  return languageMap[ext] || null;
}

export function ReadRenderer(props: ReadRendererProps) {
  const { input } = props;

  if (!input || !input.file_path) {
    return null;
  }

  const fileName = getFileName(input.file_path);
  const ext = getFileExtension(input.file_path);
  const language = ext ? getLanguageFromExt(ext) : null;

  return (
    <div className="w-full mt-2">
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-code)]">
          <FileCode size={14} className="text-sky-400" />
          <span className="text-xs font-mono text-[var(--color-text-secondary)]">{fileName}</span>
          {language && (
            <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-hover)] px-1.5 py-0.5 rounded">
              {language}
            </span>
          )}
          <div className="flex items-center gap-1 ml-auto">
            {(input.offset || input.limit) && (
              <span className="text-xs text-[var(--color-text-muted)] mr-1">
                {input.offset && `from line ${input.offset}`}
                {input.offset && input.limit && ", "}
                {input.limit && `${input.limit} lines`}
              </span>
            )}
            <CopyButton text={input.file_path} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FileContentRenderer(props: FileContentRendererProps) {
  const { content, fileName } = props;

  if (!content) {
    return null;
  }

  const lines = content.split("\n");
  const maxLines = 50;
  const truncated = lines.length > maxLines;
  const displayLines = truncated ? lines.slice(0, maxLines) : lines;

  const ext = fileName ? getFileExtension(fileName) : "";
  const language = ext ? getLanguageFromExt(ext) : null;

  return (
    <div className="w-full mt-2">
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-code)]">
          <FileText size={14} className="text-sky-400" />
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">File Content</span>
          {language && (
            <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-hover)] px-1.5 py-0.5 rounded">
              {language}
            </span>
          )}
          <span className="text-xs text-[var(--color-text-muted)] ml-auto">{lines.length} lines</span>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-xs font-mono">
            <tbody>
              {displayLines.map((line, index) => (
                <tr key={index} className="hover:bg-[var(--color-bg-hover)]">
                  <td className="select-none text-right pr-3 pl-3 py-0.5 text-[var(--color-text-faint)] border-r border-[var(--color-border)] w-10 sticky left-0 bg-[var(--color-bg-surface)]">
                    {index + 1}
                  </td>
                  <td className="pl-3 pr-3 py-0.5 text-[var(--color-text-secondary)] whitespace-pre">
                    {line || " "}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {truncated && (
            <div className="px-3 py-2 text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)]">
              ... {lines.length - maxLines} more lines
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

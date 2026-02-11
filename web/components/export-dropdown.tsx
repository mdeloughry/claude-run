import { useState, useEffect, useCallback } from "react";
import { Download, X } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import type { Session, ConversationMessage } from "../lib/types";
import {
  htmlExporter,
  markdownExporter,
  jsonExporter,
  textExporter,
} from "../lib/exporters";
import type { Exporter } from "../lib/exporters";

interface ExportDropdownProps {
  sessionId: string;
}

type Format = "html" | "md" | "json" | "txt";
type Theme = "dark" | "light" | "minimal";

const FORMATS: { key: Format; label: string }[] = [
  { key: "html", label: "HTML" },
  { key: "md", label: "Markdown" },
  { key: "json", label: "JSON" },
  { key: "txt", label: "Plain Text" },
];

const THEMES: { key: Theme; label: string }[] = [
  { key: "dark", label: "Dark" },
  { key: "light", label: "Light" },
  { key: "minimal", label: "Minimal" },
];

const exporters: Record<string, Exporter> = {
  html: htmlExporter,
  md: markdownExporter,
  json: jsonExporter,
  txt: textExporter,
};

function ExportDropdown(props: ExportDropdownProps) {
  const { sessionId } = props;
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<Format>("html");
  const [theme, setTheme] = useState<Theme>("dark");
  const [includeTools, setIncludeTools] = useState(true);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, close]);

  const handleExport = async () => {
    const exporter = exporters[format];
    if (!exporter) return;

    const [session, messages] = await Promise.all([
      invoke<Session | null>("get_session_meta", { sessionId }),
      invoke<ConversationMessage[]>("get_conversation", { sessionId }),
    ]);

    if (!session) return;

    const stripTools = !includeTools;
    const output = exporter.generate({
      messages,
      session,
      theme: format === "html" ? theme : undefined,
      stripTools,
    });

    const safeName =
      session.display
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 60) || "conversation";
    const filename = `claude-${safeName}.${exporter.fileExtension}`;

    const blob = new Blob([output], { type: exporter.contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    close();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-hover)] rounded transition-colors cursor-pointer shrink-0"
        title="Export conversation"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Export</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl w-[360px] p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-[var(--color-text)]">Export Conversation</h2>
              <button
                onClick={close}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Format */}
            <div className="mb-4">
              <label className="block text-[11px] text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Format</label>
              <div className="flex gap-1.5">
                {FORMATS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFormat(key)}
                    className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                      format === key
                        ? "bg-[var(--color-bg-hover)] border-[var(--color-text-muted)] text-[var(--color-text)]"
                        : "bg-[var(--color-bg-code)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-faint)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme (HTML only) */}
            {format === "html" && (
              <div className="mb-4">
                <label className="block text-[11px] text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Theme</label>
                <div className="flex gap-1.5">
                  {THEMES.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setTheme(key)}
                      className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                        theme === key
                          ? "bg-[var(--color-bg-hover)] border-[var(--color-text-muted)] text-[var(--color-text)]"
                          : "bg-[var(--color-bg-code)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-faint)]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Strip tools toggle */}
            <div className="mb-5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTools}
                  onChange={(e) => setIncludeTools(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[var(--color-border)] bg-[var(--color-bg-code)] accent-[var(--color-accent)]"
                />
                <span className="text-xs text-[var(--color-text-secondary)]">Include tool calls</span>
              </label>
              {!includeTools && (
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5 ml-6">
                  Tool use, results, and thinking blocks will be removed
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2">
              <button
                onClick={close}
                className="px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-text)] rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ExportDropdown;

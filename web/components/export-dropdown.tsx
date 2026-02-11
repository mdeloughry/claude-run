import { useState, useEffect, useCallback } from "react";
import { Download, X } from "lucide-react";

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
    const params = new URLSearchParams({ format });
    if (format === "html") params.set("theme", theme);
    if (!includeTools) params.set("stripTools", "true");

    const res = await fetch(`/api/export/${sessionId}?${params}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="(.+)"/);
    const filename = match ? match[1] : `claude-export.${format}`;
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
        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors cursor-pointer shrink-0"
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
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-[360px] p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-zinc-100">Export Conversation</h2>
              <button
                onClick={close}
                className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Format */}
            <div className="mb-4">
              <label className="block text-[11px] text-zinc-500 mb-2 uppercase tracking-wider">Format</label>
              <div className="flex gap-1.5">
                {FORMATS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFormat(key)}
                    className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                      format === key
                        ? "bg-zinc-700 border-zinc-500 text-zinc-100"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750 hover:border-zinc-600"
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
                <label className="block text-[11px] text-zinc-500 mb-2 uppercase tracking-wider">Theme</label>
                <div className="flex gap-1.5">
                  {THEMES.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setTheme(key)}
                      className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                        theme === key
                          ? "bg-zinc-700 border-zinc-500 text-zinc-100"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750 hover:border-zinc-600"
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
                  className="w-3.5 h-3.5 rounded border-zinc-600 bg-zinc-800 text-indigo-500 accent-indigo-500"
                />
                <span className="text-xs text-zinc-300">Include tool calls</span>
              </label>
              {!includeTools && (
                <p className="text-[10px] text-zinc-500 mt-1.5 ml-6">
                  Tool use, results, and thinking blocks will be removed
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2">
              <button
                onClick={close}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer"
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

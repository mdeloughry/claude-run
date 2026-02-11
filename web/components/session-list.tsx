import { useState, useMemo, memo, useRef, useEffect, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Info, X, ExternalLink } from "lucide-react";
import type { Session } from "../lib/types";
import { useTheme } from "../lib/theme-context";
import { formatTime } from "../utils";

interface SessionListProps {
  sessions: Session[];
  selectedSession: string | null;
  onSelectSession: (sessionId: string) => void;
  loading?: boolean;
}

const SessionList = memo(function SessionList(props: SessionListProps) {
  const { sessions, selectedSession, onSelectSession, loading } = props;
  const [search, setSearch] = useState("");
  const [showAbout, setShowAbout] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredSessions = useMemo(() => {
    if (!search.trim()) {
      return sessions;
    }
    const query = search.toLowerCase();
    return sessions.filter(
      (s) =>
        s.display.toLowerCase().includes(query) ||
        s.projectName.toLowerCase().includes(query)
    );
  }, [sessions, search]);

  const virtualizer = useVirtualizer({
    count: filteredSessions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 76,
    overscan: 10,
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  return (
    <div className="h-full overflow-hidden bg-[var(--color-bg-secondary)] flex flex-col">
      <div className="px-3 py-2 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent text-sm text-[var(--color-text-secondary)] placeholder-[var(--color-text-faint)] focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)] transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div ref={parentRef} className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <svg
              className="w-5 h-5 text-[var(--color-text-faint)] animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        ) : filteredSessions.length === 0 ? (
          <p className="py-8 text-center text-xs text-[var(--color-text-faint)] font-pixel">
            {search ? "No sessions match" : "No sessions found"}
          </p>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const session = filteredSessions[virtualItem.index];
              return (
                <button
                  key={session.id}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  onClick={() => onSelectSession(session.id)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className={`px-3 py-3.5 text-left transition-colors overflow-hidden border-b border-[var(--color-border-subtle)] ${
                    selectedSession === session.id
                      ? "bg-[var(--color-bg-selected)]"
                      : "hover:bg-[var(--color-bg-hover)]"
                  } ${virtualItem.index === 0 ? "border-t border-t-[var(--color-border-subtle)]" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[var(--color-text-muted)] font-medium font-pixel">
                      {session.projectName}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-faint)]">
                      {formatTime(session.timestamp)}
                    </span>
                  </div>
                  <p className="text-[12px] text-[var(--color-text-secondary)] leading-snug line-clamp-2 break-words">
                    {session.display}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-[var(--color-border)] flex items-center justify-between">
        <div className="text-[10px] text-[var(--color-text-faint)] font-pixel">
          {sessions.length} session{sessions.length !== 1 ? "s" : ""}
        </div>
        <button
          onClick={() => setShowAbout(true)}
          className="text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)] transition-colors cursor-pointer"
          title="About Claude Run"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
});

function AboutModal({ onClose }: { onClose: () => void }) {
  const { theme, setTheme, themes } = useTheme();
  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [close]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl w-[360px] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">About Claude Run</h2>
          <button
            onClick={close}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center mb-5">
          <div className="text-2xl font-pixel text-[var(--color-text)] mb-1">Claude Run</div>
          <div className="text-xs text-[var(--color-text-muted)]">v0.2.2</div>
        </div>

        <p className="text-xs text-[var(--color-text-muted)] text-center leading-relaxed mb-5">
          A desktop app for browsing Claude Code conversation history.
        </p>

        {/* Theme picker */}
        <div className="border-t border-[var(--color-border-subtle)] pt-4 mb-4">
          <div className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Theme</div>
          <div className="flex gap-1.5">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                  theme.id === t.id
                    ? "bg-[var(--color-bg-hover)] border-[var(--color-text-muted)] text-[var(--color-text)]"
                    : "bg-[var(--color-bg-code)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-faint)]"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-[var(--color-border-subtle)] pt-4 mb-4">
          <div className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Credits</div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[var(--color-text-secondary)]">Kamran Ahmed</div>
                <div className="text-[10px] text-[var(--color-text-muted)]">Original author</div>
              </div>
              <a
                href="https://github.com/kamranahmedse/claude-run"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-[var(--color-accent)] hover:opacity-80 transition-opacity"
              >
                <span>GitHub</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[var(--color-text-secondary)]">Tauri Desktop Port</div>
                <div className="text-[10px] text-[var(--color-text-muted)]">Rust backend rewrite</div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--color-border-subtle)] pt-3 text-center">
          <div className="text-[10px] text-[var(--color-text-faint)]">
            MIT License
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionList;

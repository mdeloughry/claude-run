import { useEffect, useState, useRef, useCallback } from "react";
import type { ConversationMessage, StreamResult } from "../lib/types";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import MessageBlock from "./message-block";
import ScrollToBottomButton from "./scroll-to-bottom-button";

const SCROLL_THRESHOLD_PX = 100;

interface SessionViewProps {
  sessionId: string;
  hideTools?: boolean;
}

function SessionView(props: SessionViewProps) {
  const { sessionId, hideTools } = props;

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef<number>(0);
  const isScrollingProgrammaticallyRef = useRef(false);

  const fetchMessages = useCallback(async () => {
    try {
      const result = await invoke<StreamResult>("get_conversation_stream", {
        sessionId,
        offset: offsetRef.current,
      });

      if (result.messages.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.uuid).filter(Boolean));
          const unique = result.messages.filter((m) => !existingIds.has(m.uuid));
          if (unique.length === 0) return prev;
          return [...prev, ...unique];
        });
      }

      offsetRef.current = result.nextOffset;
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [sessionId]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    offsetRef.current = 0;
    fetchMessages();
  }, [fetchMessages]);

  // Listen for conversation updates from file watcher
  useEffect(() => {
    const unlisten = listen<string>("conversation-update", (event) => {
      if (event.payload === sessionId) {
        fetchMessages();
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [sessionId, fetchMessages]);

  const scrollToBottom = useCallback(() => {
    if (!lastMessageRef.current) {
      return;
    }
    isScrollingProgrammaticallyRef.current = true;
    lastMessageRef.current.scrollIntoView({ behavior: "instant" });
    requestAnimationFrame(() => {
      isScrollingProgrammaticallyRef.current = false;
    });
  }, []);

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [messages, autoScroll, scrollToBottom]);

  const handleScroll = () => {
    if (!containerRef.current || isScrollingProgrammaticallyRef.current) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD_PX;
    setAutoScroll(isAtBottom);
  };

  const summary = messages.find((m) => m.type === "summary");
  const conversationMessages = messages.filter(
    (m) => m.type === "user" || m.type === "assistant"
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto bg-zinc-950"
      >
        <div className="mx-auto max-w-3xl px-4 py-4">
          {summary && (
            <div className="mb-6 rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4">
              <h2 className="text-sm font-medium text-zinc-200 leading-relaxed">
                {summary.summary}
              </h2>
              <p className="mt-2 text-[11px] text-zinc-500">
                {conversationMessages.length} messages
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {conversationMessages.map((message, index) => (
              <div
                key={message.uuid || index}
                ref={
                  index === conversationMessages.length - 1
                    ? lastMessageRef
                    : undefined
                }
              >
                <MessageBlock message={message} hideTools={hideTools} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {!autoScroll && (
        <ScrollToBottomButton
          onClick={() => {
            setAutoScroll(true);
            scrollToBottom();
          }}
        />
      )}
    </div>
  );
}

export default SessionView;

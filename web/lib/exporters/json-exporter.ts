import type { Exporter, ExportContext } from "./types";

export const jsonExporter: Exporter = {
  contentType: "application/json",
  fileExtension: "json",
  generate(ctx: ExportContext): string {
    const { messages, session } = ctx;
    const outputMessages = ctx.stripTools
      ? messages.map((m) => {
          if (!Array.isArray(m.message?.content)) return m;
          return {
            ...m,
            message: {
              ...m.message,
              content: (m.message!.content as Array<{ type: string }>).filter(
                (b) => b.type === "text",
              ),
            },
          };
        })
      : messages;
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        session: {
          id: session.id,
          display: session.display,
          project: session.project,
          projectName: session.projectName,
          timestamp: session.timestamp,
        },
        messages: outputMessages,
      },
      null,
      2,
    );
  },
};

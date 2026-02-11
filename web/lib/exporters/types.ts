import type { ConversationMessage, Session } from "../types";

export interface ExportContext {
  messages: ConversationMessage[];
  session: Session;
  theme?: "dark" | "light" | "minimal";
  stripTools?: boolean;
}

export interface Exporter {
  contentType: string;
  fileExtension: string;
  generate(ctx: ExportContext): string;
}

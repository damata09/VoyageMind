export interface ChatMessage {
  role: "user" | "model";
  content: string;
  createdAt: Date;
}

export interface GeminiHistoryEntry {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

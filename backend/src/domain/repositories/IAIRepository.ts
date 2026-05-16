import { GeminiHistoryEntry } from "../application/dtos/ChatDTO";

export interface GenerateRouteInput {
  destination?: string;
  budget?: string;
  days?: number;
  blindMode: boolean;
  message?: string;
  history?: GeminiHistoryEntry[];
}

export interface IAIRepository {
  generateRoute(input: GenerateRouteInput): Promise<string>;
}

export interface GenerateRouteInput {
  destination?: string;
  budget?: string;
  days?: number;
  blindMode: boolean;
  message?: string;
  history?: any[];
}

export interface IAIRepository {
  generateRoute(input: GenerateRouteInput): Promise<string>;
}

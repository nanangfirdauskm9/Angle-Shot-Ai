export interface ShotData {
  id: number;
  title: string;
  description: string;
  prompt: string; // The generated prompt content
}

export interface GeneratedImageState {
  isLoading: boolean;
  imageUrl: string | null;
  error: string | null;
}

export enum ShotType {
  ELS = "Extreme Long Shot (ELS)",
  LS = "Long Shot (LS)",
  MLS = "Medium Long Shot (MLS / 3/4)",
  MS = "Medium Shot (MS)",
  MCU = "Medium Close-Up (MCU)",
  CU = "Close-Up (CU)",
  ECU = "Extreme Close-Up (ECU)",
  LOW = "Low Angle (Worm’s Eye)",
  HIGH = "High Angle (Bird’s Eye)"
}
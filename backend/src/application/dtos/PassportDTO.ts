export interface CreatePassportDTO {
  title: string;
  description: string;
  tag: string;
  unlockDate?: string;
}

export interface UpdatePassportDTO {
  title?: string;
  description?: string;
  tag?: string;
  unlockDate?: string | null;
}

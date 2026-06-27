// src/application/dtos/ResumeDto.ts

export interface ResumeDto {
  id: string;
  userId: string;
  fileId: string;
  filename: string;
  label: string;
  isBase: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResumeInput {
  fileId: string;
  filename: string;
  label: string;
  isBase?: boolean;
  content?: Record<string, unknown>;
}

// src/application/dtos/SupportQueryDto.ts

export enum SupportQueryStatusDto {
  Open = "open",
  Resolved = "resolved",
}

export enum SupportQueryCategoryDto {
  BugReport = "Bug Report",
  FeatureRequest = "Feature Request",
  General = "General",
}

export interface SupportQueryDto {
  id: string;
  userId: string;
  category: SupportQueryCategoryDto;
  message: string;
  status: SupportQueryStatusDto;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupportQueryInput {
  userId: string;
  category: SupportQueryCategoryDto;
  message: string;
}

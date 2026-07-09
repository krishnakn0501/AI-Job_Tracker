// src/application/dtos/ApplicationDto.ts

import { ApplicationStatus } from "@/domains/application/entities/ApplicationStatus";

export interface ApplicationDto {
  id: string;
  userId: string;
  company: string;
  role: string;
  jdText?: string;
  jdUrl?: string;
  status: ApplicationStatus;
  appliedDate: string;
  followUpDate?: string;
  interviewDate?: string;
  generationStatus: string;
  resumeMarkdown?: string;
  coverLetterMarkdown?: string;
  resumeReviewPath?: string;
  resumeFinalPath?: string;
  coverLetterReviewPath?: string;
  coverLetterFinalPath?: string;
  roleTitleChanged: boolean;
  roleTitleNote?: string;
  notes?: string;
  resumeBaseId?: string;
  // S10
  reminderOverrideEnabled: boolean;
  overrideReminderHour?: number;
  overrideReminderAmPm?: string;
  overrideReminderOffsetDays?: number;
  overrideReminderRepeat?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationInput {
  company: string;
  role: string;
  jdText?: string;
  jdUrl?: string;
  resumeBaseId: string;
  appliedDate?: string;
  followUpDate?: string;
  interviewDate?: string;
  notes?: string;
  status?: ApplicationStatus;
  // S10
  reminderOverrideEnabled?: boolean;
  overrideReminderHour?: number;
  overrideReminderAmPm?: string;
  overrideReminderOffsetDays?: number;
  overrideReminderRepeat?: boolean;
}
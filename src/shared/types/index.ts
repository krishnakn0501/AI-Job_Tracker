export type Application = {
  id: string;
  company: string;
  role: string;
  jdText: string | null;
  jdUrl: string | null;
  status: string;
  appliedDate: string;
  followUpDate: string | null;
  interviewDate: string | null;
  generationStatus: string;
  resumeMarkdown: string | null;
  coverLetterMarkdown: string | null;
  resumeReviewPath: string | null;
  resumeFinalPath: string | null;
  coverLetterReviewPath: string | null;
  coverLetterFinalPath: string | null;
  roleTitleChanged: boolean;
  roleTitleNote: string | null;
  notes: string | null;
  // S10
  reminderOverrideEnabled: boolean;
  overrideReminderHour: number | null;
  overrideReminderAmPm: string | null;
  overrideReminderOffsetDays: number | null;
  overrideReminderRepeat: boolean | null;
  createdAt: string;
  updatedAt: string;
};
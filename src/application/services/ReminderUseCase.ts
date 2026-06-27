// src/application/services/ReminderUseCase.ts

import { Result } from "@/shared/types/Result";
import { IApplicationRepository } from "../interfaces/IApplicationRepository";
import { addDays, startOfDay, endOfDay } from "date-fns";

interface ReminderDto {
  id: string;
  company: string;
  role: string;
  status: string;
  followUpDate?: Date;
  interviewDate?: Date;
  type: "follow_up" | "interview";
}

/**
 * Reminder use case queries applications with upcoming follow-up or interview dates.
 * Stateless service — no repository state stored here.
 */
export class ReminderUseCase {
  constructor(private readonly applicationRepository: IApplicationRepository) {}

  async getRemindersForUser(userId: string): Promise<Result<ReminderDto[]>> {
    try {
      const today = new Date();
      const tomorrow = addDays(today, 1);

      const applications = await this.applicationRepository.findByUserId(userId);

      const reminders = applications
        .filter((app) => app.status !== "Rejected")
        .filter((app) => {
          const followUp = app.followUpDate;
          const interview = app.interviewDate;

          const followUpDueToday =
            followUp &&
            followUp >= startOfDay(today) &&
            followUp <= endOfDay(today);

          const interviewTomorrow =
            interview &&
            interview >= startOfDay(tomorrow) &&
            interview <= endOfDay(tomorrow);

          return followUpDueToday || interviewTomorrow;
        })
        .map((app) => ({
          id: app.id,
          company: app.company,
          role: app.role,
          status: app.status as string,
          followUpDate: app.followUpDate,
          interviewDate: app.interviewDate,
          type: (app.followUpDate ? "follow_up" : "interview") as
            | "follow_up"
            | "interview",
        }));

      return Result.success(reminders);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }
}
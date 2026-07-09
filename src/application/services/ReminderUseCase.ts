// src/application/services/ReminderUseCase.ts

import { Result } from "@/shared/types/Result";
import { IApplicationRepository } from "../interfaces/IApplicationRepository";
import { addDays, startOfDay, endOfDay } from "date-fns";

interface ReminderDto {
  id: string;
  company: string;
  role: string;
  status: string;
  followUpDate?: Date | null;
  followUpDone?: boolean;
  interviewDate?: Date | null;
  interviewDone?: boolean;
  type: "follow_up" | "interview";
}

/**
 * Reminder use case queries applications with upcoming follow-up or interview dates.
 * Stateless service — no repository state stored here.
 */
export class ReminderUseCase {
  constructor(private readonly applicationRepository: IApplicationRepository) {}

  async getUncheckedRemindersForUser(userId: string): Promise<Result<ReminderDto[]>> {
    try {
      const today = new Date();
      const tomorrow = addDays(today, 1);

      const applications = await this.applicationRepository.findByUserId(userId);

      const reminders = applications
        .filter((app) => app.status !== "Rejected")
        .filter((app) => {
          const followUp = app.followUpDate;
          const interview = app.interviewDate;

          const followUpActive =
            followUp && !app.followUpDone &&
            followUp >= startOfDay(today) &&
            followUp <= endOfDay(today);

          const interviewActive =
            interview && !app.interviewDone &&
            interview >= startOfDay(tomorrow) &&
            interview <= endOfDay(tomorrow);

          return followUpActive || interviewActive;
        })
        .map((app) => ({
          id: app.id,
          company: app.company,
          role: app.role,
          status: app.status as string,
          followUpDate: app.followUpDate,
          followUpDone: app.followUpDone,
          interviewDate: app.interviewDate,
          interviewDone: app.interviewDone,
          type: (app.followUpDate && !app.followUpDone ? "follow_up" : "interview") as
            | "follow_up"
            | "interview",
        }));

      return Result.success(reminders);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  async getAllRemindersForUser(userId: string): Promise<Result<ReminderDto[]>> {
    try {
      const applications = await this.applicationRepository.findByUserId(userId);

      const reminders = applications
        .filter((app) => app.followUpDate || app.interviewDate)
        .flatMap((app) => {
          const items: ReminderDto[] = [];
          if (app.followUpDate) {
            items.push({
              id: `${app.id}-follow`,
              applicationId: app.id,
              company: app.company,
              role: app.role,
              status: app.status as string,
              followUpDate: app.followUpDate,
              followUpDone: app.followUpDone,
              type: "follow_up",
            } as any);
          }
          if (app.interviewDate) {
            items.push({
              id: `${app.id}-interview`,
              applicationId: app.id,
              company: app.company,
              role: app.role,
              status: app.status as string,
              interviewDate: app.interviewDate,
              interviewDone: app.interviewDone,
              type: "interview",
            } as any);
          }
          return items;
        });

      return Result.success(reminders);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }
}
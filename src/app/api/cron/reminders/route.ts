export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/infrastructure/persistence/prisma/PrismaClient";
import { sendReminderEmail } from "@/infrastructure/email/MailerService";
import {
  getEffectivePreference,
  to24Hour,
  getReminderDates,
} from "@/lib/reminder-engine";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    // Protect with a cron secret — n8n sends this header
    const CRON_SECRET = process.env.CRON_SECRET;
    const secret = request.headers.get("x-cron-secret");
    if (!CRON_SECRET || secret !== CRON_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentHour24 = new Date().getHours(); // 0–23
    const today = format(new Date(), "yyyy-MM-dd");

    // Fetch all users with their global preferences and active applications
    // that have a followUpDate set and status is not terminal
    const users = await prisma.user.findMany({
      where: { emailVerified: true },
      include: {
        applications: {
          where: {
            followUpDate: { not: null },
            status: { notIn: ["Rejected", "Offer"] },
            generationStatus: { not: "generating" },
          },
          include: {
            reminderLogs: {
              where: { sentDate: today },
            },
          },
        },
      },
    });

    const emailsSent: string[] = [];

    for (const user of users) {
      const globalPref = {
        hour: user.reminderHour,
        amPm: user.reminderAmPm as "AM" | "PM",
        offsetDays: user.reminderOffsetDays,
        repeat: user.reminderRepeat,
      };

      const dueApplications = [];

      for (const app of user.applications) {
        if (!app.followUpDate) continue;

        const effectivePref = getEffectivePreference(globalPref, {
          enabled: app.reminderOverrideEnabled,
          hour: app.overrideReminderHour,
          amPm: app.overrideReminderAmPm,
          offsetDays: app.overrideReminderOffsetDays,
          repeat: app.overrideReminderRepeat,
        });

        const effectiveHour24 = to24Hour(effectivePref.hour, effectivePref.amPm);

        // Check: does the current hour match this application's reminder time?
        if (effectiveHour24 !== currentHour24) continue;

        // Check: is today one of the dates this application should be reminded?
        const reminderDates = getReminderDates(app.followUpDate, effectivePref);
        if (!reminderDates.includes(today)) continue;

        // Check: has a reminder already been sent today for this application?
        if (app.reminderLogs.length > 0) continue;

        dueApplications.push(app);
      }

      if (dueApplications.length === 0) continue;

      // Send one combined email for this user
      await sendReminderEmail(
        user.email,
        dueApplications.map((app) => ({
          company: app.company,
          role: app.role,
          status: app.status,
          followUpDate: app.followUpDate,
        }))
      );

      // Log each sent reminder — @@unique on (applicationId, sentDate) prevents
      // duplicates even on concurrent/retry calls
      await Promise.allSettled(
        dueApplications.map((app) =>
          prisma.reminderLog
            .create({
              data: {
                applicationId: app.id,
                userId: user.id,
                sentDate: today,
              },
            })
            .catch((e) => {
              // Unique constraint violation = already logged = safe to ignore
              if (e.code !== "P2002") throw e;
            })
        )
      );

      emailsSent.push(user.email);
    }

    return Response.json({
      success: true,
      hour: currentHour24,
      emailsSent: emailsSent.length,
      users: emailsSent,
    });
  } catch (error) {
    console.error("[api/cron/reminders] Error:", error);
    return Response.json({ error: "Cron failed" }, { status: 500 });
  }
}

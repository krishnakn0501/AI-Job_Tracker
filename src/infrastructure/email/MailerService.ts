// src/infrastructure/email/MailerService.ts

import nodemailer from "nodemailer";

type OtpPurpose = "signup" | "reset_password" | "change_email";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOtpEmail(
  to: string,
  code: string,
  purpose: OtpPurpose
) {
  let subject = "";
  let heading = "";

  if (purpose === "signup") {
    subject = "Verify your JobTrack account";
    heading = "Verify your email";
  } else if (purpose === "reset_password") {
    subject = "Reset your JobTrack password";
    heading = "Reset your password";
  } else if (purpose === "change_email") {
    subject = "Confirm your new JobTrack email";
    heading = "Confirm your new email";
  }

  await transporter.sendMail({
    from: process.env.USER_EMAIL,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px;">
        <h2 style="color: #1E3A5F;">${heading}</h2>
        <p style="color: #475569; font-size: 14px;">Your verification code is:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2563EB;">${code}</p>
        <p style="color: #94A3B8; font-size: 12px;">This code expires in 2 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}

export async function sendReminderEmail(
  to: string,
  applications: Array<{
    company: string;
    role: string;
    status: string;
    followUpDate: Date | string | null;
  }>
) {
  const rows = applications
    .map(
      (app) => `
      <tr>
        <td style="padding:8px;border:1px solid #e2e8f0">${app.company}</td>
        <td style="padding:8px;border:1px solid #e2e8f0">${app.role}</td>
        <td style="padding:8px;border:1px solid #e2e8f0">${app.status}</td>
        <td style="padding:8px;border:1px solid #e2e8f0">
          ${app.followUpDate ? new Date(app.followUpDate).toLocaleDateString() : "—"}
        </td>
      </tr>`
    )
    .join("");

  await transporter.sendMail({
    from: process.env.USER_EMAIL,
    to,
    subject: `${applications.length} follow-up${applications.length > 1 ? "s" : ""} due — JobTrack`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px">
        <h2 style="color:#1E3A5F">JobTrack — Reminders</h2>
        <p style="color:#475569">You have ${applications.length} application${applications.length > 1 ? "s" : ""} that need attention:</p>
        <table style="border-collapse:collapse;width:100%">
          <thead>
            <tr style="background:#1E3A5F;color:white">
              <th style="padding:8px;text-align:left">Company</th>
              <th style="padding:8px;text-align:left">Role</th>
              <th style="padding:8px;text-align:left">Status</th>
              <th style="padding:8px;text-align:left">Follow-up</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <br>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color:#2563EB">
          Open JobTrack →
        </a>
      </div>`,
  });
}

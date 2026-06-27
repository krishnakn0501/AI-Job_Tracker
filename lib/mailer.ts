import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOtpEmail(to: string, code: string, purpose: "signup" | "reset_password" | "change_email") {
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
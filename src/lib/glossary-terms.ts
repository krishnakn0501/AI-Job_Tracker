export type GlossaryTerm = {
  term: string;
  category: string;
  definition: string;
};

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // Status terms
  { term: "Applied", category: "Status", definition: "The initial status when you add a job application. Means you have submitted your application and are waiting to hear back." },
  { term: "Screening", category: "Status", definition: "A recruiter or automated system has reviewed your application and selected you for an initial phone/video screening." },
  { term: "Interview", category: "Status", definition: "You have passed screening and have been invited to one or more interviews (technical, behavioural, panel, etc.)." },
  { term: "Offer", category: "Status", definition: "The company has extended a job offer to you. This is a terminal status — no further status changes are allowed." },
  { term: "Rejected", category: "Status", definition: "Your application was not selected at some stage. This is a terminal status — no further status changes are allowed." },
  // Generation terms
  { term: "Generation status", category: "Resume", definition: "The current state of Claude's resume tailoring for an application. Can be: pending (not started), generating (Claude is working on it), ready (tailored resume available to download), or failed (something went wrong — use Re-generate)." },
  { term: "Base resume", category: "Resume", definition: "Your original, un-tailored resume uploaded once to JobTrack. Claude reads this file whenever it tailors a resume for a new job application. You can upload multiple base resumes and choose which one to use per application." },
  { term: "Tailored resume", category: "Resume", definition: "A version of your base resume that Claude has customised specifically for one job application, using the job description you provided. Available in two formats: Review (highlighted changes) and Final (clean, ready to send)." },
  { term: "Review resume", category: "Resume", definition: "A .docx file where every change Claude made from your base resume is highlighted in yellow. Use this to review and verify Claude's changes before sending to an employer." },
  { term: "Final resume", category: "Resume", definition: "A .docx file with all of Claude's tailoring applied but no highlighting — clean and professional, ready to send directly to an employer." },
  { term: "Cover letter", category: "Resume", definition: "An AI-generated cover letter tailored to the specific company and role, produced alongside the tailored resume. Also available in Review (highlighted) and Final (clean) formats." },
  { term: "ATS keywords", category: "Resume", definition: "Key terms and phrases from the job description that Applicant Tracking Systems (ATS) look for when scanning resumes. Claude includes these naturally in your tailored resume to help it pass automated screening." },
  { term: "Role title changed", category: "Resume", definition: "A flag shown on the application detail page when Claude has adjusted your job title (e.g. from 'Business Solutions Manager' to 'AI Product Manager') because the job description uses a more precise title that your experience legitimately supports. Always review this change before sending." },
  // Reminder terms
  { term: "Reminder time", category: "Reminders", definition: "The hour of day (in your configured timezone) when JobTrack sends you a follow-up reminder email for due applications." },
  { term: "Lead-time offset", category: "Reminders", definition: "How many days BEFORE your follow-up date you want to start receiving reminders. For example, an offset of 2 days means you'll be reminded on the day that is 2 days before your set follow-up date." },
  { term: "One-time reminder", category: "Reminders", definition: "A reminder that fires exactly once, on the date calculated from your lead-time offset. After it fires, no further reminders are sent for that application unless you change the follow-up date." },
  { term: "Repeating reminder", category: "Reminders", definition: "A reminder that fires every day starting from your lead-time offset date, up to and including the follow-up date itself. Useful if you want daily nudges until you take action." },
  { term: "Effective reminder", category: "Reminders", definition: "The actual reminder setting that applies to a specific application, combining your global default preferences with any per-application overrides. Shown as a summary like 'Will remind at 9:00 AM, 1 day before, repeating daily'." },
  { term: "Custom reminder", category: "Reminders", definition: "A per-application override of your global reminder preferences. When enabled, you can change the reminder time, offset, and/or repeat mode just for that one application, without affecting your defaults." },
  // Other terms
  { term: "Follow-up date", category: "Tracking", definition: "A date you set on an application to remind yourself to follow up with the employer. Appears in the Reminders panel on the dashboard and triggers reminder emails based on your preferences." },
  { term: "Interview date", category: "Tracking", definition: "The date of a scheduled interview for an application. JobTrack includes applications with an interview tomorrow in reminder notifications." },
  { term: "Active applications", category: "Tracking", definition: "Applications with a status of Applied, Screening, or Interview — i.e. still in progress. Offer and Rejected applications are not counted as active." },
  { term: "Response rate", category: "Tracking", definition: "The percentage of your applications that have moved beyond 'Applied' status (i.e. received any response from the employer). Calculated as: (applications not in Applied status) / total applications × 100." },
  { term: "file_id", category: "Technical", definition: "A unique identifier or URL assigned to a resume file when uploaded to Supabase S3 storage." },
  { term: "My Resumes", category: "Technical", definition: "The page where you manage all your uploaded base resumes. You can upload multiple resumes (e.g. one for engineering roles, one for product roles), set a default, and see which applications used each resume." },
];

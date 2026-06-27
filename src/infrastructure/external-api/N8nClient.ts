// src/infrastructure/external-api/N8nClient.ts

/**
 * n8n integration — triggers resume generation workflow via webhook.
 */

type TriggerParams = {
  applicationId: string;
  company: string;
  role: string;
  jdText: string;
  fileId: string;
  userId: string;
};

/**
 * Triggers the resume generation workflow in n8n.
 */
export async function triggerResumeGeneration(
  params: TriggerParams
): Promise<boolean> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("[n8n] N8N_WEBHOOK_URL not set — skipping trigger");
    return false;
  }
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.N8N_API_KEY ?? "",
      },
      body: JSON.stringify({
        application_id: params.applicationId,
        company: params.company,
        role: params.role,
        jd_text: params.jdText,
        file_id: params.fileId,
        userId: params.userId,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`[n8n] Webhook responded ${res.status}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[n8n] Trigger failed:", e);
    return false;
  }
}

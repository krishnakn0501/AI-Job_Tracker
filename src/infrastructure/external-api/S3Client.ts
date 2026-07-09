import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const endpoint = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const accessKeyId = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const secretAccessKey = process.env.SUPABASE_S3_SECRET_ACCESS_KEY || "";

const s3 = new S3Client({
  forcePathStyle: true,
  region: "auto", // Supabase S3 ignores region but SDK requires a value
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const BUCKET_NAME = "resumes";

/**
 * Upload a resume file to Supabase S3 Storage.
 * @returns The public URL of the uploaded file
 */
export async function uploadResumeFileS3(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  userId: string
): Promise<{ fileUrl: string; fileId: string }> {
  // Generate a unique file path within the bucket
  const timestamp = Date.now();
  const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileKey = `${userId}/${timestamp}_${safeFilename}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: mimeType,
      // For Supabase, files in public buckets are automatically public. 
      // If the bucket is private, n8n will need a signed URL.
      // Assuming 'resumes' bucket is Public as requested in the plan.
    })
  );

  // Extract the project URL to construct the public URL
  // endpoint is like: https://[ref].supabase.co/storage/v1/s3
  // public URL is like: https://[ref].supabase.co/storage/v1/object/public/[bucket]/[fileKey]
  const baseUrl = endpoint.replace("/s3", "/object/public");
  const fileUrl = `${baseUrl}/${BUCKET_NAME}/${fileKey}`;

  return { fileUrl, fileId: fileKey };
}

/**
 * Delete a file from Supabase S3 Storage.
 */
export async function deleteResumeFileS3(fileKey: string): Promise<void> {
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
      })
    );
  } catch (e) {
    console.warn("[supabase-s3] delete failed (non-fatal):", e);
  }
}

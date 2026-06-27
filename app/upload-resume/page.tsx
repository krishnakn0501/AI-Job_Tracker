"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UploadResumeRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/my-resumes");
  }, [router]);
  return null;
}

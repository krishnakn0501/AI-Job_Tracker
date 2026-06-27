export const dynamic = "force-dynamic";

import { Suspense } from "react";
import VerifyOtpContent from "./VerifyOtpContent";

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpContent />
    </Suspense>
  );
}
import { Suspense } from "react";
import EmailVerificationForm from "@/components/auth/email-verification-form"

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmailVerificationForm />
    </Suspense>
  );
}

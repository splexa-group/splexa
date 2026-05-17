import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthPanel } from "@/components/auth/auth-panel";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Start free — Splexa | Legal Practice Management for Indian Advocates",
  description:
    "Join 1,200+ Indian advocates using Splexa to manage cases, track hearings, and never miss a court date. Free to start.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Splexa — Legal Practice Management for Indian Advocates",
    description:
      "Manage cases, hearings, and clients in one place. Built for Indian courts.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Splexa — Built for Indian Advocates",
    description: "Never miss a hearing date again.",
  },
};

export default function SignupPage() {
  return (
    <AuthLayout leftPanel={<AuthPanel />} formMaxWidth={450}>
      <SignupForm />
    </AuthLayout>
  );
}

import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginPanel } from "@/components/auth/login-panel";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Splexa to manage your cases, hearings, and clients. Secure passwordless login for Indian advocates.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Sign in — Splexa",
    description: "Legal practice management for Indian advocates.",
    type: "website",
  },
};

export default function LoginPage() {
  return (
    <AuthLayout leftPanel={<LoginPanel />}>
      <LoginForm />
    </AuthLayout>
  );
}

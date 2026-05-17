import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthPanel } from "@/components/auth/auth-panel";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthLayout leftPanel={<AuthPanel />} leftWidthClass="md:w-[65%]">
      <LoginForm />
    </AuthLayout>
  );
}

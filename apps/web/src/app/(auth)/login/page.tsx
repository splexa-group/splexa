import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthPanel } from "@/components/auth/auth-panel";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthLayout leftPanel={<AuthPanel />} formMaxWidth={400}>
      <LoginForm />
    </AuthLayout>
  );
}

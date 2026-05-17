import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginPanel } from "@/components/auth/login-panel";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthLayout leftPanel={<LoginPanel />}>
      <LoginForm />
    </AuthLayout>
  );
}

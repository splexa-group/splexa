import type { ReactNode } from "react";
import { TopBarProvider } from "@/components/layout/top/top-bar-context";
import { TopBar } from "@/components/layout/top/top-bar";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AuthRehydrator } from "@/components/layout/auth-rehydrator";
import { AppLoader, PageLoadingProvider, PageSkeleton } from "@/components/layout/loader";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <TopBarProvider>
      <AuthRehydrator />
      <AppLoader>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <TopBar />
            <PageLoadingProvider>
              <main className="flex-1 overflow-y-auto bg-page pb-[58px] md:pb-0 relative">
                <PageSkeleton />
                {children}
              </main>
            </PageLoadingProvider>
          </div>
        </div>
        <BottomNav />
      </AppLoader>
    </TopBarProvider>
  );
}

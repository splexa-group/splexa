"use client";

import { useState, useCallback } from "react";
import { AlertCircle, Briefcase, Calendar, CalendarCheck } from "lucide-react";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { PageLayout } from "@/components/layout/page-layout";
import { CreateCaseModal } from "@/components/modals/create-case";
import { StatCard } from "./stat-card";
import { UpcomingHearings } from "./upcoming-hearings";
import { AttentionNeeded } from "./attention-needed";
import { useDashboard } from "@/hooks/use-dashboard";

export function DashboardView() {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);
  const { data, isError } = useDashboard();

  usePageTitle({
    title: "Dashboard",
    action: { label: "Add New Case", onClick: openModal },
  });

  return (
    <>
      <PageLayout maxWidth="large" className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Active Cases" value={data?.stats.activeCases} icon={Briefcase} />
          <StatCard
            label="Today's Hearings"
            value={data?.stats.hearingsToday}
            icon={CalendarCheck}
          />
          <StatCard label="This Week" value={data?.stats.hearingsThisWeek} icon={Calendar} />
          <StatCard
            label="Upcoming Deadlines"
            value={data?.stats.upcomingDeadlines}
            icon={AlertCircle}
          />
        </div>

        {isError && (
          <p className="text-sm text-negative text-center py-8">
            Failed to load dashboard. Please refresh the page.
          </p>
        )}

        {!isError && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UpcomingHearings hearings={data?.upcomingHearings} />
            <AttentionNeeded
              deadlines={data?.upcomingDeadlines}
              highPriorityCases={data?.highPriorityCases}
            />
          </div>
        )}
      </PageLayout>

      <CreateCaseModal open={modalOpen} onClose={closeModal} />
    </>
  );
}

"use client";

import { useState, useCallback } from "react";
import { AlertCircle, Briefcase, Calendar, CalendarCheck } from "lucide-react";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { CreateCaseModal } from "@/components/modals/create-case";
import { StatCard } from "@/components/dashboard/stat-card";
import { UpcomingHearings } from "@/components/dashboard/upcoming-hearings";
import { useDashboard } from "@/hooks/use-dashboard";

export default function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);
  const { data } = useDashboard();

  usePageTitle({
    title: "Dashboard",
    action: { label: "Add New Case", onClick: openModal },
  });

  return (
    <>
      <div className="px-4 md:px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Active Cases" value={data?.stats.activeCases} icon={Briefcase} />
          <StatCard label="Today's Hearings" value={data?.stats.hearingsToday} icon={CalendarCheck} />
          <StatCard label="This Week" value={data?.stats.hearingsThisWeek} icon={Calendar} />
          <StatCard label="Upcoming Deadlines" value={data?.stats.upcomingDeadlines} icon={AlertCircle} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UpcomingHearings hearings={data?.upcomingHearings ?? []} />
          {/* AttentionNeeded — Task 5 */}
        </div>
      </div>

      <CreateCaseModal open={modalOpen} onClose={closeModal} />
    </>
  );
}

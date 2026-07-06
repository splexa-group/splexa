import type { HearingPurpose, ImportantDateType } from "@splexa-group/shared/enums";

export interface DashboardStats {
  activeCases:       number;
  hearingsToday:     number;
  hearingsThisWeek:  number;
  upcomingDeadlines: number;
}

export interface UpcomingHearing {
  id:        string;
  caseId:    string;
  caseTitle: string;
  courtName: string | null;
  date:      string;
  time:      string | null;
  purpose:   HearingPurpose | null;
}

export interface UpcomingDeadline {
  id:          string;
  caseId:      string;
  caseTitle:   string;
  dateType:    ImportantDateType;
  date:        string;
  description: string | null;
}

export interface HighPriorityCase {
  id:              string;
  title:           string;
  caseNumber:      string | null;
  courtName:       string | null;
  nextHearingDate: string | null;
}

export interface DashboardData {
  stats:             DashboardStats;
  upcomingHearings:  UpcomingHearing[];
  upcomingDeadlines: UpcomingDeadline[];
  highPriorityCases: HighPriorityCase[];
}


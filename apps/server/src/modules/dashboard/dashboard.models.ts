import { HearingPurpose, ImportantDateType } from "@splexa-group/shared/enums";

export interface UpcomingHearing {
  id:        string;
  caseId:    string;
  caseTitle: string;
  courtName: string | null;
  date:      Date;
  time:      string | null;
  purpose:   HearingPurpose | null;
}

export interface UpcomingDeadline {
  id:          string;
  caseId:      string;
  caseTitle:   string;
  dateType:    ImportantDateType;
  date:        Date;
  description: string | null;
}

export interface HighPriorityCase {
  id:              string;
  title:           string;
  caseNumber:      string | null;
  courtName:       string | null;
  nextHearingDate: Date | null;
}

export interface DashboardStats {
  activeCases:       number;
  hearingsToday:     number;
  hearingsThisWeek:  number;
  upcomingDeadlines: number;
}

export interface DashboardData {
  stats:             DashboardStats;
  upcomingHearings:  UpcomingHearing[];
  upcomingDeadlines: UpcomingDeadline[];
  highPriorityCases: HighPriorityCase[];
}

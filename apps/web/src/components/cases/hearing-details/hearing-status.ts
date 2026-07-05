import { Clock, Check, CornerDownRight, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { HearingStatus } from "@splexa-group/shared/enums";

export const HEARING_TIMELINE_STATUS_ICON: Record<
  HearingStatus,
  { Icon: LucideIcon; bg: string; color: string }
> = {
  [HearingStatus.SCHEDULED]: {
    Icon: Clock,
    bg: "bg-amber-muted",
    color: "text-amber-dark",
  },
  [HearingStatus.COMPLETED]: {
    Icon: Check,
    bg: "bg-positive",
    color: "text-white",
  },
  [HearingStatus.ADJOURNED]: {
    Icon: CornerDownRight,
    bg: "bg-brand-soft",
    color: "text-brand",
  },
  [HearingStatus.CANCELLED]: {
    Icon: X,
    bg: "bg-negative-muted",
    color: "text-negative",
  },
};

export const HEARING_STATUS_PILL: Record<
  HearingStatus,
  { pill: string; dot: string }
> = {
  [HearingStatus.SCHEDULED]: {
    pill: "bg-amber-muted text-amber-dark",
    dot: "bg-amber",
  },
  [HearingStatus.COMPLETED]: {
    pill: "bg-positive-muted text-positive",
    dot: "bg-positive",
  },
  [HearingStatus.ADJOURNED]: {
    pill: "bg-brand-soft text-brand",
    dot: "bg-brand",
  },
  [HearingStatus.CANCELLED]: {
    pill: "bg-negative-muted text-negative",
    dot: "bg-negative",
  },
};

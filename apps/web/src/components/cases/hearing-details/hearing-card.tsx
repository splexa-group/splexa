"use client";

import { Fragment } from "react";
import {
  Clock,
  Check,
  CornerDownRight,
  X,
  Landmark,
  Scale,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatEnumLabel } from "@/lib/options";
import { Button } from "@/components/ui/button";
import { Menu } from "@/components/ui/menu";
import { Hearing } from "@/types/hearings";
import { HEARING_STATUS_PILL } from "./hearing-status";

interface Props {
  hearing: Hearing;
  onEdit: () => void;
  onDelete: () => void;
}

export function HearingCard({ hearing, onEdit, onDelete }: Props) {
  const style = HEARING_STATUS_PILL[hearing.status];

  const purposeLabel = hearing.purpose
    ? formatEnumLabel(hearing.purpose)
    : "Hearing";

  const formattedDate = new Date(hearing.date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-card border border-line rounded-lg">
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-sm font-semibold text-dark">{purposeLabel}</p>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-body shrink-0" />
              <span className="text-[13.5px] text-body">{formattedDate}</span>
              {hearing.time && (
                <span className="text-[13.5px] text-body">· {hearing.time}</span>
              )}
            </div>
            {hearing.judgePresent && (
              <div className="flex items-center gap-1.5">
                <Scale className="size-3.5 text-body shrink-0" />
                <span className="text-[13.5px] text-body">
                  {hearing.judgePresent}
                </span>
              </div>
            )}
          </div>

          {hearing.notes && (
            <p className="text-[13.5px] text-secondary pl-2 border-l-2 border-line italic">
              {hearing.notes}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0 mt-0.5">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
              style.pill,
            )}
          >
            <span className={cn("size-1.5 rounded-full", style.dot)} />
            {hearing.status}
          </span>

          <Menu
            items={[
              { label: "Edit", icon: Pencil, onClick: onEdit },
              {
                label: "Delete",
                icon: Trash2,
                onClick: onDelete,
                danger: true,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

interface NextHearingCardProps {
  hearing: Hearing;
  courtName?: string | null;
  benchNumber?: string | null;
  onEdit: () => void;
  onMarkHeard: () => void;
  onMarkMissed: () => void;
  onAdjourn: () => void;
}

export function NextHearingCard({
  hearing,
  courtName,
  benchNumber,
  onEdit,
  onMarkHeard,
  onMarkMissed,
  onAdjourn,
}: NextHearingCardProps) {
  const date = new Date(hearing.date);
  const day = date.toLocaleDateString("en-IN", { day: "2-digit" });
  const month = date
    .toLocaleDateString("en-IN", { month: "short" })
    .toUpperCase();
  const year = date.getFullYear();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const hearingDay = new Date(date);
  hearingDay.setHours(0, 0, 0, 0);
  const daysUntil = Math.ceil(
    (hearingDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  const daysLabel =
    daysUntil === 0
      ? "Today"
      : daysUntil === 1
        ? "Tomorrow"
        : `In ${daysUntil} days`;

  const purposeLabel = hearing.purpose
    ? formatEnumLabel(hearing.purpose)
    : "Hearing";

  const formattedDate = date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const courtParts = [
    courtName,
    benchNumber ? `Hall ${benchNumber}` : null,
  ].filter(Boolean);

  const dateText = hearing.time
    ? `${formattedDate} · ${hearing.time}`
    : formattedDate;

  const metaParts = [
    { icon: Clock, text: dateText },
    ...(hearing.judgePresent
      ? [{ icon: Scale, text: hearing.judgePresent }]
      : []),
    ...(courtParts as string[]).map((part) => ({ icon: Landmark, text: part })),
  ];

  return (
    <div className="bg-brand-soft/20 border border-brand/20 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-3">
        <span className="text-sm font-semibold text-brand">Next Hearing</span>
        <span className="text-[11px] font-semibold bg-brand/15 text-brand px-2 py-0.5 rounded-full">
          {daysLabel}
        </span>
      </div>

      <div className="flex gap-4 px-4 pb-3">
        {/* Date block */}
        <div className="flex flex-col rounded-lg overflow-hidden shrink-0 w-16 text-center">
          <div className="w-full bg-brand py-1">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">
              {month}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center bg-brand/10 py-1.5">
            <span className="text-2xl font-bold text-dark leading-none">
              {day}
            </span>
            <span className="text-[11px] text-brand/60 mt-0.5">{year}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5 py-1">
          <p className="text-base font-bold text-dark">{purposeLabel}</p>

          {/* Single meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            {metaParts.map(({ icon: Icon, text }, i) => (
              <Fragment key={i}>
                <div className="flex items-center gap-1.5">
                  <Icon className="size-3 text-brand/50 shrink-0" />
                  <span className="text-[13px] text-secondary">{text}</span>
                </div>
                {i < metaParts.length - 1 && (
                  <span className="size-1 rounded-full bg-brand/20 shrink-0" />
                )}
              </Fragment>
            ))}
          </div>

          {hearing.notes && (
            <p className="text-[13px] text-secondary italic">{hearing.notes}</p>
          )}
        </div>
      </div>

      {/* Action buttons — same card bg, no separator color */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-brand/10">
        <Button size="sm" variant="positive" onClick={onMarkHeard}>
          <Check className="size-3" /> Mark heard
        </Button>
        <Button size="sm" onClick={onAdjourn}>
          <CornerDownRight className="size-3.5" /> Adjourn
        </Button>
        <Button size="sm" variant="negativeSoft" onClick={onMarkMissed}>
          <X className="size-3.5" /> Mark missed
        </Button>
        <Button size="sm" variant="primarySoft" onClick={onEdit}>
          <Pencil className="size-3.5" /> Edit
        </Button>
      </div>
    </div>
  );
}

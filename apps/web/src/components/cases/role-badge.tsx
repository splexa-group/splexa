import { PartyRole } from "@splexa-group/shared/enums";

const ROLE_BADGE_STYLES: Record<PartyRole, string> = {
  [PartyRole.PETITIONER]: "bg-brand-soft text-brand",
  [PartyRole.RESPONDENT]: "bg-brand-soft text-brand",
  [PartyRole.ACCUSED]: "bg-negative-muted text-negative",
  [PartyRole.COMPLAINANT]: "bg-positive-muted text-positive-dark",
};

export function RoleDotBadge({ role }: { role: PartyRole }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 ${ROLE_BADGE_STYLES[role] ?? "bg-subtle text-secondary"}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {role}
    </span>
  );
}

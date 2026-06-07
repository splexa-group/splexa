import { PartyRole } from "@splexa-group/shared/enums";

const ROLE_BADGE_STYLES: Record<PartyRole, string> = {
  [PartyRole.Petitioner]: "bg-brand-soft text-brand",
  [PartyRole.Respondent]: "bg-brand-soft text-brand",
  [PartyRole.Accused]: "bg-negative-muted text-negative",
  [PartyRole.Complainant]: "bg-positive-muted text-positive-dark",
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

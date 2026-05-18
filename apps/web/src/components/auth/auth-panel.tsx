import { type LucideIcon, ShieldCheck, Scale, BadgeCheck } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Icon } from "@/components/ui/icon";

interface BadgeItem {
  icon?: LucideIcon;
  emoji?: string;
  label: string;
}

const TRUST_BADGES: BadgeItem[] = [
  { icon: ShieldCheck, label: "256-bit Encrypted" },
  { icon: Scale, label: "BCI Compliant" },
  { icon: BadgeCheck, label: "SOC 2 Certified" },
  { emoji: "🇮🇳", label: "Made in India" },
];

export function AuthPanel() {
  return (
    <div className="flex flex-col justify-between h-full px-20 py-50">
      <div className="max-w-[400px]">
        <Logo size="md" variant="white" className="mb-10" />

        <h1 className="text-[34px] font-bold text-white leading-tight tracking-tight">
          Practice Smarter.
        </h1>
        <h1 className="text-[34px] font-bold text-brand-light leading-tight tracking-tight mb-8">
          Never Miss a Hearing.
        </h1>

        <p className="text-sm text-white/70 leading-relaxed mb-4">
          From case filing to final judgment - every hearing, document, and
          client detail in one secure place. Built for Indian courts.
        </p>

        <div className="flex items-center gap-3">
          <p className="text-sm text-white/70 leading-snug">
            Trusted by advocates across District Courts, High Courts, and
            Tribunals.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-5 flex-wrap">
        {TRUST_BADGES.map(({ icon, emoji, label }) => (
          <span
            key={label}
            className="flex items-center gap-1.5 text-xs font-medium text-white/90"
          >
            {icon ? (
              <Icon icon={icon} size="sm" className="text-brand-light" />
            ) : (
              <span>{emoji}</span>
            )}
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

import { Check } from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";

const PLAN_FEATURES = [
  "Unlimited cases",
  "Hearing reminders",
  "Document storage",
  "Up to 3 team members",
];

export function SubscriptionTab() {
  return (
    <PageLayout maxWidth="medium">
      <div className="max-w-sm border border-line rounded-lg bg-card p-6 space-y-5">
        <div>
          <p className="text-xs text-secondary uppercase tracking-wide mb-1">Current Plan</p>
          <h2 className="text-lg font-semibold text-dark">Free</h2>
        </div>

        <ul className="space-y-2.5">
          {PLAN_FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-2.5 text-sm text-body">
              <Check className="size-4 text-positive shrink-0" />
              {feature}
            </li>
          ))}
        </ul>

        <Button
          variant="primary"
          size="sm"
          disabled
          title="Coming soon"
          className="w-full"
        >
          Upgrade Plan
        </Button>
      </div>
    </PageLayout>
  );
}

"use client";

import { CaseTabs } from "@/enums/case-tabs";
import { useSearchParams } from "next/navigation";

export function useCaseActiveTab(): CaseTabs {
  const searchParams = useSearchParams();
  return (searchParams.get("tab") ?? CaseTabs.CASE) as CaseTabs;
}

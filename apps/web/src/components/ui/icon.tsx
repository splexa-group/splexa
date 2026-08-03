import { type LucideIcon } from "lucide-react";
import { cn } from "@/utils/tailwind";

const sizeMap = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
};

interface IconProps {
  icon: LucideIcon;
  size?: keyof typeof sizeMap;
  className?: string;
}

export function Icon({ icon: Comp, size = "md", className }: IconProps) {
  return <Comp size={sizeMap[size]} className={cn("shrink-0", className)} />;
}

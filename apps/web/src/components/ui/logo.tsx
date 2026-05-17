import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "white" | "brand" | "brandLight";
  className?: string;
}

const sizeConfig = {
  sm: { wrap: "gap-1.5", icon: "text-lg", text: "text-base font-bold" },
  md: { wrap: "gap-2", icon: "text-3xl", text: "text-[22px] font-bold" },
  lg: { wrap: "gap-3", icon: "text-4xl", text: "text-[28px] font-bold" },
};

const variantColor = {
  white: "text-white",
  brand: "text-brand",
  brandLight: "text-brand-light",
};

export function Logo({ size = "md", variant = "white", className }: LogoProps) {
  const { wrap, icon, text } = sizeConfig[size];
  const color = variantColor[variant];

  return (
    <div className={cn("flex items-center", wrap, color, className)}>
      <span className={icon}>⚖</span>
      <span className={text}>Splexa</span>
    </div>
  );
}

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "white" | "brand" | "brandLight";
  className?: string;
}

const SIZE_MAP = {
  sm: { width: 64,  height: 18 },
  md: { width: 88,  height: 24 },
  lg: { width: 112, height: 30 },
};

const VARIANT_SRC: Record<NonNullable<LogoProps["variant"]>, string> = {
  white:      "/white-dark.svg",
  brand:      "/brand.svg",
  brandLight: "/white-brand.svg",
};

export function Logo({ size = "md", variant = "white", className }: LogoProps) {
  const { width, height } = SIZE_MAP[size];
  return (
    <Image
      src={VARIANT_SRC[variant]}
      alt="Splexa"
      width={width}
      height={height}
      className={cn("shrink-0", className)}
    />
  );
}

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "white" | "brand" | "brandLight";
  showName?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { width: 18, height: 18 },
  md: { width: 24, height: 24 },
  lg: { width: 36, height: 36 },
};

const VARIANT_SRC: Record<NonNullable<LogoProps["variant"]>, string> = {
  white: "/white-dark.svg",
  brand: "/brand.svg",
  brandLight: "/white-brand.svg",
};

const NAME_SIZE = { sm: "text-sm", md: "text-lg", lg: "text-2xl" };

const NAME_COLOR = {
  white: "text-white",
  brand: "text-brand",
  brandLight: "text-brand-light",
};

export function Logo({
  size = "md",
  variant = "white",
  showName = true,
  className,
}: LogoProps) {
  const { width, height } = SIZE_MAP[size];
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src={VARIANT_SRC[variant]}
        alt="Splexa"
        width={width}
        height={height}
        className="shrink-0"
      />
      {showName && (
        <span
          className={cn(
            "font-bold leading-none",
            NAME_SIZE[size],
            NAME_COLOR[variant],
          )}
        >
          Splexa
        </span>
      )}
    </div>
  );
}

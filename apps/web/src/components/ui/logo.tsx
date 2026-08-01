import Image from "next/image";
import { cn } from "@/utils/tailwind";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "white" | "brand" | "brandLight" | "brandDark";
  showName?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { width: 18, height: 18 },
  md: { width: 24, height: 24 },
  lg: { width: 36, height: 36 },
  xl: { width: 48, height: 48 },
};

const VARIANT_SRC: Record<NonNullable<LogoProps["variant"]>, string> = {
  white: "/white-dark.svg",
  brand: "/brand.svg",
  brandDark: "/brand-dark.svg",
  brandLight: "/white-brand.svg",
};

const NAME_SIZE = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-3xl",
};

const NAME_COLOR = {
  white: "text-white",
  brand: "text-brand",
  brandLight: "text-brand-light",
  brandDark: "text-brand-dark",
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

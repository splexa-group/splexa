import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/tailwind";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-brand text-white hover:bg-brand-dark",
        negative: "bg-negative text-white hover:bg-negative-dark",
        amber: "bg-amber text-white hover:bg-amber-dark",
        positive: "bg-positive text-white hover:bg-positive-dark",
        secondary: "bg-subtle text-dark hover:bg-line",
        primaryGradient:
          "bg-gradient-to-r from-brand to-brand-accent text-white hover:from-brand-dark hover:to-brand shadow-sm",

        primarySoft: "bg-brand-soft text-brand",
        negativeSoft: "bg-negative-muted text-negative",
        amberSoft: "bg-amber-muted text-amber-dark",
        positiveSoft: "bg-positive-muted text-positive-dark",
        secondarySoft: "bg-subtle text-secondary hover:bg-line hover:text-dark",

        primaryOutline: "border border-brand text-brand hover:bg-brand-soft",
        negativeOutline: "border border-negative text-negative hover:bg-negative-muted",
        amberOutline: "border border-amber text-amber-dark hover:bg-amber-muted",
        positiveOutline: "border border-positive text-positive-dark hover:bg-positive-muted",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3 text-[12.5px]",
        lg: "h-10 px-5",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, disabled, children, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          loading && "pointer-events-none opacity-70",
        )}
        ref={ref}
        disabled={disabled}
        aria-busy={loading}
        {...props}
      >
        {loading && <Loader2 className="absolute size-4 animate-spin" />}
        <span className={cn("inline-flex items-center gap-2", loading && "opacity-0")}>
          {children}
        </span>
      </Comp>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };

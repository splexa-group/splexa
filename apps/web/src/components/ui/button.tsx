import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[6px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e40af] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-[#e2e8f0] disabled:text-[#94a3b8]",
  {
    variants: {
      variant: {
        primary: "bg-[#1e40af] text-white hover:bg-[#1e3a8a]",
        secondary:
          "bg-white text-[#1e40af] border border-[#1e40af] hover:bg-[#dbeafe]",
        ghost: "text-[#1e40af] hover:bg-[#dbeafe]",
        danger: "bg-[#dc2626] text-white hover:bg-[#b91c1c]",
        "danger-ghost":
          "text-[#dc2626] border border-[#dc2626] hover:bg-[#fee2e2]",
      },
      size: {
        default: "px-4 py-[9px]",
        sm: "px-3 py-2 text-xs",
        lg: "px-6 py-3",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

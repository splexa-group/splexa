# Frontend Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build login and signup pages for Splexa's passwordless OTP auth flow with a split-panel layout, and wire them to the existing backend.

**Architecture:** Next.js App Router. Each page uses a 40/60 split layout — dark navy gradient left panel (brand/trust content) + white right panel (form). State flows from React Hook Form → React Query mutations → API fetch wrappers → backend at `http://localhost:5001`. Access token is stored in a Zustand store (memory only, never localStorage). All base UI components live in `components/ui/` and are fully owned/customized to the design token system.

**Signup flow note:** The backend `POST /api/v1/auth/signup` requires all fields and sends OTP in a single call, so the multi-step form collects data first (email → personal → practice), submits on step 3, then shows OTP verification as step 4. This differs from the spec's original step order but matches the backend's design.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Radix UI primitives, class-variance-authority, React Query v5, Zustand, React Hook Form, Sonner (toasts), Inter (next/font)

**Working directory for all commands:** `apps/web`

---

### Task 1: Install all packages

**Files:**
- Modify: `apps/web/package.json` (via pnpm)

- [ ] **Step 1: Install Tailwind and PostCSS**

```bash
cd apps/web && pnpm add tailwindcss @tailwindcss/postcss postcss tw-animate-css
```

- [ ] **Step 2: Install UI primitive dependencies**

```bash
pnpm add @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-select class-variance-authority clsx tailwind-merge lucide-react
```

- [ ] **Step 3: Install runtime libraries**

```bash
pnpm add @tanstack/react-query zustand react-hook-form sonner
```

- [ ] **Step 4: Verify package.json has all new entries**

```bash
cat package.json | grep -A 2 '"tailwindcss"\|"zustand"\|"sonner"\|"react-hook-form"'
```

Expected: all four appear in `dependencies`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json apps/web/pnpm-lock.yaml 2>/dev/null; git add apps/web/package.json
git commit -m "feat(web): install tailwind, radix ui, react-query, zustand, react-hook-form, sonner"
```

---

### Task 2: Configure Tailwind v4 + design tokens

**Files:**
- Create: `apps/web/postcss.config.mjs`
- Modify: `apps/web/src/app/globals.css`
- Delete: `apps/web/src/app/page.module.css` (replaced in Task 21)

- [ ] **Step 1: Create PostCSS config**

Create `apps/web/postcss.config.mjs`:

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 2: Replace globals.css with Tailwind v4 + full design token system**

Replace all content in `apps/web/src/app/globals.css`:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* Core surface variables */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --radius-sm: calc(var(--radius) - 2px);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 2px);

  /* Splexa brand tokens */
  --color-panel: var(--panel);
  --color-panel-mid: var(--panel-mid);
  --color-primary-hover: var(--primary-hover);
  --color-primary-mid: var(--primary-mid);
  --color-primary-light: var(--primary-light);
  --color-primary-tint: var(--primary-tint);
  --color-text-muted: var(--text-muted);
  --color-surface: var(--surface);
  --color-surface-raised: var(--surface-raised);
}

:root {
  --background: #f8fafc;
  --foreground: #0f172a;
  --primary: #1e40af;
  --primary-foreground: #ffffff;
  --secondary: #f1f5f9;
  --secondary-foreground: #0f172a;
  --muted: #f1f5f9;
  --muted-foreground: #475569;
  --border: #e2e8f0;
  --input: #e2e8f0;
  --ring: #1e40af;
  --card: #ffffff;
  --card-foreground: #0f172a;
  --radius: 0.375rem;

  /* Splexa design tokens */
  --panel: #0c1445;
  --panel-mid: #1e3a8a;
  --primary-hover: #1e3a8a;
  --primary-mid: #3b82f6;
  --primary-light: #60a5fa;
  --primary-tint: #dbeafe;
  --text-muted: #94a3b8;
  --surface: #ffffff;
  --surface-raised: #f1f5f9;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

* {
  border-color: var(--border);
}

body {
  background: var(--background);
  color: var(--foreground);
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/postcss.config.mjs apps/web/src/app/globals.css
git commit -m "feat(web): configure tailwind v4 with splexa design tokens"
```

---

### Task 3: Create lib/utils.ts and components.json

**Files:**
- Create: `apps/web/src/lib/utils.ts`
- Create: `apps/web/components.json`

- [ ] **Step 1: Create lib/utils.ts**

Create `apps/web/src/lib/utils.ts`:

```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local[0]}***@${domain}`;
}
```

- [ ] **Step 2: Create components.json (shadcn/ui config)**

Create `apps/web/components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "blue",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/utils.ts apps/web/components.json
git commit -m "feat(web): add lib/utils (cn, maskEmail) and shadcn components.json"
```

---

### Task 4: Build components/ui/button.tsx

**Files:**
- Create: `apps/web/src/components/ui/button.tsx`

- [ ] **Step 1: Create button.tsx**

Create `apps/web/src/components/ui/button.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/ui/button.tsx
git commit -m "feat(web): add Button primitive with all design-spec variants"
```

---

### Task 5: Build components/ui/input.tsx

**Files:**
- Create: `apps/web/src/components/ui/input.tsx`

- [ ] **Step 1: Create input.tsx**

Create `apps/web/src/components/ui/input.tsx`:

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[6px] border border-[#e2e8f0] bg-white px-3 py-[9px] text-sm text-[#0f172a] transition-colors",
          "placeholder:text-[#94a3b8]",
          "focus-visible:outline-none focus-visible:border-[#1e40af] focus-visible:ring-[3px] focus-visible:ring-[rgba(30,64,175,0.12)]",
          "disabled:cursor-not-allowed disabled:bg-[#f8fafc]",
          "aria-invalid:border-[#dc2626] aria-invalid:ring-[3px] aria-invalid:ring-[rgba(220,38,38,0.10)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/ui/input.tsx
git commit -m "feat(web): add Input primitive with focus/error states from design spec"
```

---

### Task 6: Build components/ui/label.tsx

**Files:**
- Create: `apps/web/src/components/ui/label.tsx`

- [ ] **Step 1: Create label.tsx**

Create `apps/web/src/components/ui/label.tsx`:

```tsx
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-sm font-medium text-[#374151] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/ui/label.tsx
git commit -m "feat(web): add Label primitive"
```

---

### Task 7: Build components/ui/select.tsx

**Files:**
- Create: `apps/web/src/components/ui/select.tsx`

- [ ] **Step 1: Create select.tsx**

Create `apps/web/src/components/ui/select.tsx`:

```tsx
import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-[6px] border border-[#e2e8f0] bg-white px-3 py-[9px] text-sm text-[#0f172a] transition-colors [&>span]:line-clamp-1",
      "focus:outline-none focus:border-[#1e40af] focus:ring-[3px] focus:ring-[rgba(30,64,175,0.12)]",
      "disabled:cursor-not-allowed disabled:bg-[#f8fafc]",
      "data-[placeholder]:text-[#94a3b8]",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDownIcon className="size-4 text-[#94a3b8] shrink-0" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-[6px] border border-[#e2e8f0] bg-white shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm text-[#0f172a] outline-none",
      "hover:bg-[#dbeafe] focus:bg-[#dbeafe]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <CheckIcon className="size-4 text-[#1e40af]" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-8 py-1.5 text-xs font-semibold text-[#475569]", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectLabel,
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/ui/select.tsx
git commit -m "feat(web): add Select primitive with Radix UI"
```

---

### Task 8: Build components/ui/form.tsx

**Files:**
- Create: `apps/web/src/components/ui/form.tsx`

- [ ] **Step 1: Create form.tsx**

Create `apps/web/src/components/ui/form.tsx`:

```tsx
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = { name: TName };

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;
  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = { id: string };

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId();
  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-1.5", className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();
  return (
    <Label
      ref={ref}
      className={cn(error && "text-[#dc2626]", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();
  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-[13px] text-[#475569]", className)}
      {...props}
    />
  );
});
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? "") : children;
  if (!body) return null;
  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-[13px] font-medium text-[#dc2626]", className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/ui/form.tsx
git commit -m "feat(web): add Form primitive (react-hook-form wrapper)"
```

---

### Task 9: Update root layout and create providers

**Files:**
- Create: `apps/web/src/app/providers.tsx`
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Create providers.tsx (client component)**

Create `apps/web/src/app/providers.tsx`:

```tsx
"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1 },
          mutations: { retry: 0 },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Replace layout.tsx**

Replace `apps/web/src/app/layout.tsx` with:

```tsx
import "./globals.css";

import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Splexa", template: "%s — Splexa" },
  description: "Legal practice management for Indian advocates.",
  metadataBase: new URL("https://splexa.in"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/providers.tsx apps/web/src/app/layout.tsx
git commit -m "feat(web): add QueryClientProvider, Sonner toaster, and metadata base to root layout"
```

---

### Task 10: Create Zustand auth store

**Files:**
- Create: `apps/web/src/store/auth-store.ts`

- [ ] **Step 1: Create auth-store.ts**

Create `apps/web/src/store/auth-store.ts`:

```ts
import { create } from "zustand";

interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  orgId: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setAuth: (token, user) => set({ accessToken: token, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/store/auth-store.ts
git commit -m "feat(web): add Zustand auth store (access token in memory)"
```

---

### Task 11: Create API client

**Files:**
- Create: `apps/web/src/lib/api/auth.ts`
- Create: `apps/web/.env.local`

- [ ] **Step 1: Create .env.local**

Create `apps/web/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5001
```

- [ ] **Step 2: Verify .env.local is in .gitignore**

```bash
grep -r "\.env\.local" /Users/oolio/splexa-group/splexa/.gitignore || echo "NOT FOUND — add it"
```

If not found, add `.env.local` to `apps/web/.gitignore` or the root `.gitignore`.

- [ ] **Step 3: Create lib/api/auth.ts**

Create `apps/web/src/lib/api/auth.ts`:

```ts
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiError {
  success: false;
  error: { code: string; message: string };
}

async function apiFetch<T>(
  path: string,
  options: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const json = (await res.json()) as ApiSuccess<T> | ApiError;

  if (!res.ok || !json.success) {
    const msg =
      !json.success
        ? json.error?.message
        : `Request failed with status ${res.status}`;
    throw new Error(msg ?? "Something went wrong. Please try again.");
  }

  return (json as ApiSuccess<T>).data;
}

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  orgId: string;
}

export interface VerifyOtpResponse {
  accessToken: string;
  user: AuthUser;
}

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  designation: string;
  orgName: string;
  practiceType: string;
  city: string;
}

export function requestOtp(email: string): Promise<void> {
  return apiFetch("/api/v1/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function signup(data: SignupPayload): Promise<void> {
  return apiFetch("/api/v1/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function verifyOtp(
  email: string,
  otp: string
): Promise<VerifyOtpResponse> {
  return apiFetch<VerifyOtpResponse>("/api/v1/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/api/auth.ts
git commit -m "feat(web): add typed API client for auth endpoints"
```

Note: do not commit `.env.local`.

---

### Task 12: Create React Query hooks

**Files:**
- Create: `apps/web/src/hooks/use-auth.ts`

- [ ] **Step 1: Create use-auth.ts**

Create `apps/web/src/hooks/use-auth.ts`:

```ts
import { useMutation } from "@tanstack/react-query";
import {
  requestOtp,
  signup,
  verifyOtp,
  type SignupPayload,
  type VerifyOtpResponse,
} from "@/lib/api/auth";

export function useRequestOtp() {
  return useMutation<void, Error, { email: string }>({
    mutationFn: ({ email }) => requestOtp(email),
  });
}

export function useVerifyOtp() {
  return useMutation<VerifyOtpResponse, Error, { email: string; otp: string }>({
    mutationFn: ({ email, otp }) => verifyOtp(email, otp),
  });
}

export function useSignup() {
  return useMutation<void, Error, SignupPayload>({
    mutationFn: (data) => signup(data),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/hooks/use-auth.ts
git commit -m "feat(web): add React Query mutation hooks for auth"
```

---

### Task 13: Create OTP input component

**Files:**
- Create: `apps/web/src/components/auth/otp-input.tsx`

- [ ] **Step 1: Create otp-input.tsx**

Create `apps/web/src/components/auth/otp-input.tsx`:

```tsx
"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, hasError, disabled }: OtpInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  function getInputAt(index: number) {
    return containerRef.current?.querySelectorAll("input")[index] as
      | HTMLInputElement
      | undefined;
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    const next = (value + digit).slice(0, OTP_LENGTH);
    onChange(next);
    if (next.length < OTP_LENGTH) getInputAt(next.length)?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Backspace" && value.length > 0) {
      e.preventDefault();
      const next = value.slice(0, -1);
      onChange(next);
      getInputAt(next.length)?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    onChange(pasted);
    getInputAt(Math.min(pasted.length, OTP_LENGTH - 1))?.focus();
  }

  return (
    <div ref={containerRef} className="flex gap-2">
      {Array.from({ length: OTP_LENGTH }, (_, i) => (
        <input
          key={i}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            "w-11 h-12 text-center text-lg font-semibold rounded-[6px] border bg-white transition-colors",
            "focus:outline-none focus:border-[#1e40af] focus:ring-[3px] focus:ring-[rgba(30,64,175,0.12)]",
            "disabled:bg-[#f8fafc] disabled:cursor-not-allowed",
            hasError
              ? "border-[#dc2626] ring-[3px] ring-[rgba(220,38,38,0.10)]"
              : "border-[#e2e8f0]"
          )}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/auth/otp-input.tsx
git commit -m "feat(web): add OtpInput component with auto-focus, backspace, and paste support"
```

---

### Task 14: Create auth split layout

**Files:**
- Create: `apps/web/src/components/auth/auth-layout.tsx`

- [ ] **Step 1: Create auth-layout.tsx**

Create `apps/web/src/components/auth/auth-layout.tsx`:

```tsx
import { type ReactNode } from "react";

interface AuthLayoutProps {
  leftPanel: ReactNode;
  children: ReactNode;
}

export function AuthLayout({ leftPanel, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left brand panel — 40%, hidden below md */}
      <div
        className="hidden md:flex md:w-2/5 flex-col"
        style={{
          background: "linear-gradient(160deg, #0c1445 0%, #1e3a8a 100%)",
        }}
      >
        {leftPanel}
      </div>

      {/* Right form panel — full width on mobile, 60% on md+ */}
      <div className="flex-1 md:w-3/5 bg-white flex flex-col">
        {/* Mobile compact header */}
        <div
          className="md:hidden flex items-center px-5 h-12 shrink-0"
          style={{
            background: "linear-gradient(160deg, #0c1445 0%, #1e3a8a 100%)",
          }}
        >
          <span className="text-white font-bold text-base">⚖ Splexa</span>
        </div>

        {/* Centered form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/auth/auth-layout.tsx
git commit -m "feat(web): add AuthLayout with 40/60 split and mobile header"
```

---

### Task 15: Create login left panel

**Files:**
- Create: `apps/web/src/components/auth/login-panel.tsx`

- [ ] **Step 1: Create login-panel.tsx**

Create `apps/web/src/components/auth/login-panel.tsx`:

```tsx
const BULLETS = [
  "Never miss a hearing date again",
  "All courts and tribunals supported",
  "1,200+ advocates trust Splexa daily",
];

const TRUST_BADGES = ["🔒 256-bit SSL", "✓ BCI Aligned", "🇮🇳 Made in India"];

export function LoginPanel() {
  return (
    <div className="flex flex-col justify-between h-full px-10 py-12">
      <div>
        {/* Brand */}
        <div className="flex items-center gap-2 mb-10">
          <span className="text-2xl">⚖</span>
          <span className="text-[22px] font-bold text-white">Splexa</span>
        </div>

        <h2 className="text-[22px] font-bold text-white leading-snug">
          Welcome back.
          <br />
          Your practice is waiting.
        </h2>

        <div className="border-t border-white/10 my-6" />

        <ul className="space-y-3">
          {BULLETS.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 text-[13px] text-[#bfdbfe]"
            >
              <span className="text-[#60a5fa] font-bold">✓</span>
              {item}
            </li>
          ))}
        </ul>

        <div className="border-t border-white/10 my-6" />

        <blockquote className="text-[13px] text-[#bfdbfe] leading-relaxed">
          "Splexa has saved me hours every week. Hearing reminders alone are
          worth it."
        </blockquote>
        <p className="text-[13px] text-[#93c5fd] mt-2 font-medium">
          — Adv. Ramesh Iyer, Chennai
        </p>
      </div>

      {/* Trust badges */}
      <div className="flex gap-5 flex-wrap">
        {TRUST_BADGES.map((badge) => (
          <span key={badge} className="text-[11px] font-medium text-[#bfdbfe]">
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/auth/login-panel.tsx
git commit -m "feat(web): add LoginPanel with welcome tone, bullets, testimonial, trust badges"
```

---

### Task 16: Create login form

**Files:**
- Create: `apps/web/src/components/auth/login-form.tsx`

- [ ] **Step 1: Create login-form.tsx**

Create `apps/web/src/components/auth/login-form.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/auth/otp-input";
import { useRequestOtp, useVerifyOtp } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth-store";
import { maskEmail } from "@/lib/utils";

type Step = "email" | "otp";

const RESEND_COOLDOWN = 30;

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const t = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendSeconds]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await requestOtp.mutateAsync({ email: email.trim() });
      toast.info(`Code sent to ${maskEmail(email.trim())}`);
      setStep("otp");
      setResendSeconds(RESEND_COOLDOWN);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 6) return;
    setOtpError(false);
    try {
      const result = await verifyOtp.mutateAsync({ email: email.trim(), otp });
      setAuth(result.accessToken, result.user);
      toast.success("Welcome back.");
      router.push("/dashboard");
    } catch (err) {
      setOtpError(true);
      setOtp("");
      toast.error(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  }

  async function handleResend() {
    try {
      await requestOtp.mutateAsync({ email: email.trim() });
      toast.info(`Code sent to ${maskEmail(email.trim())}`);
      setResendSeconds(RESEND_COOLDOWN);
      setOtp("");
      setOtpError(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  }

  if (step === "otp") {
    return (
      <form onSubmit={handleOtpSubmit} className="space-y-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#0f172a]">
            Check your email
          </h1>
          <p className="text-[14px] text-[#475569] mt-1">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-[#0f172a]">
              {maskEmail(email)}
            </span>
          </p>
        </div>

        <OtpInput
          value={otp}
          onChange={setOtp}
          hasError={otpError}
          disabled={verifyOtp.isPending}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={otp.length < 6 || verifyOtp.isPending}
        >
          {verifyOtp.isPending ? "Verifying…" : "Verify code"}
        </Button>

        <div className="flex items-center justify-between text-[13px]">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendSeconds > 0 || requestOtp.isPending}
            className="text-[#1e40af] hover:underline disabled:text-[#94a3b8] disabled:no-underline"
          >
            {resendSeconds > 0
              ? `Resend code (in ${resendSeconds}s)`
              : "Resend code"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setOtp("");
              setOtpError(false);
            }}
            className="text-[#475569] hover:text-[#0f172a]"
          >
            ← Back to email
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleEmailSubmit} className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold text-[#0f172a]">
          Sign in to Splexa
        </h1>
        <p className="text-[14px] text-[#475569] mt-1">
          Enter your email to receive a one-time code.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={requestOtp.isPending}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!email.trim() || requestOtp.isPending}
      >
        {requestOtp.isPending ? "Sending…" : "Continue with email"}
      </Button>

      <div className="border-t border-[#e2e8f0] pt-4 text-center">
        <p className="text-[13px] text-[#475569]">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-[#1e40af] hover:underline font-medium"
          >
            Create one →
          </Link>
        </p>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/auth/login-form.tsx
git commit -m "feat(web): add LoginForm with email and OTP steps, resend timer"
```

---

### Task 17: Create login page

**Files:**
- Create: `apps/web/src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Create the login page directory and file**

```bash
mkdir -p apps/web/src/app/\(auth\)/login
```

Create `apps/web/src/app/(auth)/login/page.tsx`:

```tsx
import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginPanel } from "@/components/auth/login-panel";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Splexa to manage your cases, hearings, and clients. Secure passwordless login for Indian advocates.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Sign in — Splexa",
    description: "Legal practice management for Indian advocates.",
    type: "website",
  },
};

export default function LoginPage() {
  return (
    <AuthLayout leftPanel={<LoginPanel />}>
      <LoginForm />
    </AuthLayout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "apps/web/src/app/(auth)/login/page.tsx"
git commit -m "feat(web): add login page with metadata"
```

---

### Task 18: Create signup left panel

**Files:**
- Create: `apps/web/src/components/auth/signup-panel.tsx`

- [ ] **Step 1: Create signup-panel.tsx**

Create `apps/web/src/components/auth/signup-panel.tsx`:

```tsx
const FEATURES = [
  "Hearing date reminders — never miss a date",
  "All courts and tribunals supported",
  "Client portal for sharing case updates",
  "Secure encrypted document storage",
  "Works on mobile, tablet, and desktop",
];

const TRUST_BADGES = ["🔒 256-bit SSL", "✓ BCI Aligned", "🇮🇳 Made in India"];

export function SignupPanel() {
  return (
    <div className="flex flex-col justify-between h-full px-10 py-12">
      <div>
        {/* Brand */}
        <div className="flex items-center gap-2 mb-10">
          <span className="text-2xl">⚖</span>
          <span className="text-[22px] font-bold text-white">Splexa</span>
        </div>

        <h2 className="text-[22px] font-bold text-white leading-snug">
          Built for Indian advocates.
          <br />
          Not adapted — built.
        </h2>

        <div className="border-t border-white/10 my-6" />

        <ul className="space-y-3">
          {FEATURES.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 text-[13px] text-[#bfdbfe]"
            >
              <span className="text-[#60a5fa] font-bold shrink-0">✓</span>
              {item}
            </li>
          ))}
        </ul>

        <div className="border-t border-white/10 my-6" />

        <p className="text-[13px] font-semibold text-white">
          1,200+ advocates across India
        </p>
        <p className="text-[13px] text-[#bfdbfe]">use Splexa every day.</p>
      </div>

      {/* Trust badges */}
      <div className="flex gap-5 flex-wrap">
        {TRUST_BADGES.map((badge) => (
          <span key={badge} className="text-[11px] font-medium text-[#bfdbfe]">
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/auth/signup-panel.tsx
git commit -m "feat(web): add SignupPanel with feature list and trust badges"
```

---

### Task 19: Create signup form

**Files:**
- Create: `apps/web/src/components/auth/signup-form.tsx`

**Signup flow (matches backend `POST /api/v1/auth/signup` which requires all fields):**
- Step 1: Email (local state only)
- Step 2: Personal details (name, designation, phone — local state only)
- Step 3: Practice details → submit all data to `/auth/signup` → OTP sent
- Step 4: OTP verify → `POST /auth/otp/verify` → access token → redirect

- [ ] **Step 1: Create signup-form.tsx**

Create `apps/web/src/components/auth/signup-form.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OtpInput } from "@/components/auth/otp-input";
import { useSignup, useVerifyOtp } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth-store";
import { maskEmail } from "@/lib/utils";

type Step = "email" | "personal" | "practice" | "otp";

const RESEND_COOLDOWN = 30;

const DESIGNATIONS = [
  { value: "ADVOCATE", label: "Advocate" },
  { value: "SENIOR_ADVOCATE", label: "Senior Advocate" },
  { value: "JUNIOR_ADVOCATE", label: "Junior Advocate" },
  { value: "ASSOCIATE", label: "Associate" },
  { value: "SENIOR_ASSOCIATE", label: "Senior Associate" },
  { value: "PARTNER", label: "Partner" },
  { value: "SENIOR_PARTNER", label: "Senior Partner" },
  { value: "MANAGING_PARTNER", label: "Managing Partner" },
  { value: "PARALEGAL", label: "Paralegal" },
  { value: "LEGAL_INTERN", label: "Legal Intern" },
  { value: "CLERK", label: "Clerk" },
];

const PRACTICE_TYPES = [
  { value: "CRIMINAL", label: "Criminal" },
  { value: "CIVIL", label: "Civil" },
  { value: "CORPORATE", label: "Corporate" },
  { value: "FAMILY", label: "Family" },
  { value: "MATRIMONIAL", label: "Matrimonial" },
  { value: "LABOUR", label: "Labour" },
  { value: "TAX", label: "Tax" },
  { value: "INTELLECTUAL_PROPERTY", label: "Intellectual Property" },
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "ARBITRATION", label: "Arbitration" },
  { value: "CONSUMER", label: "Consumer" },
  { value: "MOTOR_ACCIDENT", label: "Motor Accident" },
  { value: "CONSTITUTIONAL", label: "Constitutional" },
  { value: "BANKING_AND_FINANCE", label: "Banking & Finance" },
  { value: "REVENUE", label: "Revenue" },
  { value: "SERVICE_MATTERS", label: "Service Matters" },
  { value: "CYBER", label: "Cyber" },
  { value: "ENVIRONMENTAL", label: "Environmental" },
  { value: "GENERAL", label: "General" },
];

export function SignupForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [designation, setDesignation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [orgName, setOrgName] = useState("");
  const [practiceType, setPracticeType] = useState("");
  const [city, setCity] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const signup = useSignup();
  const verifyOtp = useVerifyOtp();

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const t = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendSeconds]);

  function handleEmailNext(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStep("personal");
  }

  function handlePersonalNext(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !designation || !phoneNumber.trim()) return;
    setStep("practice");
  }

  async function handlePracticeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim() || !practiceType || !city.trim()) return;
    try {
      await signup.mutateAsync({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        designation,
        phoneNumber: phoneNumber.trim(),
        orgName: orgName.trim(),
        practiceType,
        city: city.trim(),
      });
      toast.info(`Code sent to ${maskEmail(email.trim())}`);
      setStep("otp");
      setResendSeconds(RESEND_COOLDOWN);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      if (msg.toLowerCase().includes("already")) {
        toast.error("An account with this email already exists. Sign in instead.");
      } else {
        toast.error(msg);
      }
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 6) return;
    setOtpError(false);
    try {
      const result = await verifyOtp.mutateAsync({ email: email.trim(), otp });
      setAuth(result.accessToken, result.user);
      toast.success("Welcome to Splexa!");
      router.push("/dashboard");
    } catch (err) {
      setOtpError(true);
      setOtp("");
      toast.error(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  }

  async function handleResend() {
    try {
      await signup.mutateAsync({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        designation,
        phoneNumber: phoneNumber.trim(),
        orgName: orgName.trim(),
        practiceType,
        city: city.trim(),
      });
      toast.info(`Code sent to ${maskEmail(email.trim())}`);
      setResendSeconds(RESEND_COOLDOWN);
      setOtp("");
      setOtpError(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  }

  if (step === "otp") {
    return (
      <form onSubmit={handleOtpSubmit} className="space-y-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#0f172a]">
            Verify your email
          </h1>
          <p className="text-[14px] text-[#475569] mt-1">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-[#0f172a]">
              {maskEmail(email)}
            </span>
          </p>
        </div>

        <OtpInput
          value={otp}
          onChange={setOtp}
          hasError={otpError}
          disabled={verifyOtp.isPending}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={otp.length < 6 || verifyOtp.isPending}
        >
          {verifyOtp.isPending ? "Verifying…" : "Verify & continue"}
        </Button>

        <div className="flex items-center justify-between text-[13px]">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendSeconds > 0 || signup.isPending}
            className="text-[#1e40af] hover:underline disabled:text-[#94a3b8] disabled:no-underline"
          >
            {resendSeconds > 0
              ? `Resend (in ${resendSeconds}s)`
              : "Resend code"}
          </button>
          <button
            type="button"
            onClick={() => setStep("practice")}
            className="text-[#475569] hover:text-[#0f172a]"
          >
            ← Back
          </button>
        </div>
      </form>
    );
  }

  if (step === "practice") {
    return (
      <form onSubmit={handlePracticeSubmit} className="space-y-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#0f172a]">
            About your practice
          </h1>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="orgName">Firm / chamber name</Label>
            <Input
              id="orgName"
              placeholder="e.g. Iyer & Associates"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              disabled={signup.isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Practice type</Label>
            <Select value={practiceType} onValueChange={setPracticeType}>
              <SelectTrigger>
                <SelectValue placeholder="Select practice type" />
              </SelectTrigger>
              <SelectContent>
                {PRACTICE_TYPES.map((pt) => (
                  <SelectItem key={pt.value} value={pt.value}>
                    {pt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="e.g. Chennai"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              disabled={signup.isPending}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={
            !orgName.trim() || !practiceType || !city.trim() || signup.isPending
          }
        >
          {signup.isPending ? "Creating account…" : "Create account"}
        </Button>

        <button
          type="button"
          onClick={() => setStep("personal")}
          className="text-[13px] text-[#475569] hover:text-[#0f172a]"
        >
          ← Back
        </button>
      </form>
    );
  }

  if (step === "personal") {
    return (
      <form onSubmit={handlePersonalNext} className="space-y-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#0f172a]">
            Tell us about yourself
          </h1>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                placeholder="Ramesh"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                placeholder="Iyer"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Designation</Label>
            <Select value={designation} onValueChange={setDesignation}>
              <SelectTrigger>
                <SelectValue placeholder="Select your designation" />
              </SelectTrigger>
              <SelectContent>
                {DESIGNATIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number (for reminders)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={
            !firstName.trim() ||
            !lastName.trim() ||
            !designation ||
            !phoneNumber.trim()
          }
        >
          Continue
        </Button>

        <button
          type="button"
          onClick={() => setStep("email")}
          className="text-[13px] text-[#475569] hover:text-[#0f172a]"
        >
          ← Back
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleEmailNext} className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold text-[#0f172a]">
          Create your account
        </h1>
        <p className="text-[14px] text-[#475569] mt-1">
          Start with your email address.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="signup-email">Email address</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={!email.trim()}>
        Continue
      </Button>

      <div className="border-t border-[#e2e8f0] pt-4 text-center">
        <p className="text-[13px] text-[#475569]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[#1e40af] hover:underline font-medium"
          >
            Sign in →
          </Link>
        </p>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/auth/signup-form.tsx
git commit -m "feat(web): add SignupForm with 4-step flow (email → personal → practice → OTP)"
```

---

### Task 20: Create signup page

**Files:**
- Create: `apps/web/src/app/(auth)/signup/page.tsx`

- [ ] **Step 1: Create directory and file**

```bash
mkdir -p "apps/web/src/app/(auth)/signup"
```

Create `apps/web/src/app/(auth)/signup/page.tsx`:

```tsx
import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SignupPanel } from "@/components/auth/signup-panel";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Start free — Splexa | Legal Practice Management for Indian Advocates",
  description:
    "Join 1,200+ Indian advocates using Splexa to manage cases, track hearings, and never miss a court date. Free to start.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Splexa — Legal Practice Management for Indian Advocates",
    description:
      "Manage cases, hearings, and clients in one place. Built for Indian courts.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Splexa — Built for Indian Advocates",
    description: "Never miss a hearing date again.",
  },
};

export default function SignupPage() {
  return (
    <AuthLayout leftPanel={<SignupPanel />}>
      <SignupForm />
    </AuthLayout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "apps/web/src/app/(auth)/signup/page.tsx"
git commit -m "feat(web): add signup page with metadata"
```

---

### Task 21: Dashboard stub, root redirect, and cleanup

**Files:**
- Create: `apps/web/src/app/dashboard/page.tsx`
- Modify: `apps/web/src/app/page.tsx`
- Delete: `apps/web/src/app/page.module.css`

- [ ] **Step 1: Create dashboard stub**

Create `apps/web/src/app/dashboard/page.tsx`:

```tsx
export default function DashboardPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-[#475569] text-sm">Dashboard — coming soon.</p>
    </div>
  );
}
```

- [ ] **Step 2: Replace root page.tsx with redirect**

Replace `apps/web/src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/login");
}
```

- [ ] **Step 3: Delete page.module.css**

```bash
rm apps/web/src/app/page.module.css
```

- [ ] **Step 4: Run type check to catch any remaining issues**

```bash
cd apps/web && pnpm typecheck
```

Expected: no errors. If errors appear, fix them before committing.

- [ ] **Step 5: Start the dev server and verify visually**

```bash
pnpm dev
```

Open http://localhost:3000 in a browser. Expected behavior:
- `/` redirects to `/login`
- `/login` shows the split layout — dark navy left panel, white form on right
- `/signup` shows the split layout with different left panel content
- On mobile (< 768px width in devtools), the left panel is replaced with a compact navy header bar
- Submitting the login email form shows a toast "Code sent to a***@example.com"
- The OTP boxes auto-focus on each digit and support paste
- `/dashboard` shows the stub text

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/dashboard/page.tsx apps/web/src/app/page.tsx
git rm apps/web/src/app/page.module.css
git commit -m "feat(web): add dashboard stub, root redirect, remove default page.module.css"
```

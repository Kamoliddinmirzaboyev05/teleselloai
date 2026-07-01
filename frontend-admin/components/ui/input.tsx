import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded border border-border bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-teal-100",
        className,
      )}
      {...props}
    />
  );
}

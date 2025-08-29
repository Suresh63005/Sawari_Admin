"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "./utils";

function Switch(
  { className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>
) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      {...props}   // ✅ props are safe here
      className={cn(
        "peer transition-all outline-none inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full",
        "border border-border",
        "data-[state=checked]:bg-primary",
        "data-[state=unchecked]:bg-muted",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-4 rounded-full ring-0 transition-transform",
          "data-[state=checked]:bg-card data-[state=unchecked]:bg-foreground",
          "data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };

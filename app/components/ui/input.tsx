"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-[#e5e5e5] bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#171717] placeholder:text-[#a3a3a3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/20 focus-visible:border-[#171717]/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#333] dark:file:text-[#ededed] dark:placeholder:text-[#666] dark:focus-visible:ring-[#ededed]/20 dark:focus-visible:border-[#ededed]/30",
        className
      )}
      {...props}
    />
  );
}

export { Input };

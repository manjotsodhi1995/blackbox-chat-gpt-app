"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg bg-[#f5f5f5] p-1 text-[#737373] dark:bg-[#1a1a1a] dark:text-[#a3a3a3]",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/20 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-[#171717] data-[state=active]:shadow-sm cursor-pointer dark:focus-visible:ring-[#ededed]/20 dark:data-[state=active]:bg-[#0a0a0a] dark:data-[state=active]:text-[#ededed]",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn(
        "mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/20 dark:focus-visible:ring-[#ededed]/20",
        className
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };

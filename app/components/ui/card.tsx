"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#e5e5e5] bg-white text-[#171717] shadow-sm dark:border-[#333] dark:bg-[#0a0a0a] dark:text-[#ededed]",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 p-6", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-sm text-[#737373] dark:text-[#a3a3a3]", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("p-6 pt-0", className)} {...props} />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };

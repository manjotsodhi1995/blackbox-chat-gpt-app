"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#171717] text-white shadow-xs hover:bg-[#171717]/90 dark:bg-[#ededed] dark:text-[#171717] dark:hover:bg-[#ededed]/90",
        destructive:
          "bg-red-600 text-white shadow-xs hover:bg-red-600/90 dark:bg-red-600 dark:text-white dark:hover:bg-red-600/90",
        outline:
          "border border-[#e5e5e5] bg-white shadow-xs hover:bg-[#f5f5f5] hover:text-[#171717] dark:border-[#333] dark:bg-[#0a0a0a] dark:hover:bg-[#1a1a1a] dark:hover:text-[#ededed]",
        secondary:
          "bg-[#f5f5f5] text-[#171717] shadow-xs hover:bg-[#f5f5f5]/80 dark:bg-[#262626] dark:text-[#ededed] dark:hover:bg-[#262626]/80",
        ghost:
          "hover:bg-[#f5f5f5] hover:text-[#171717] dark:hover:bg-[#262626] dark:hover:text-[#ededed]",
        link: "text-[#171717] underline-offset-4 hover:underline dark:text-[#ededed]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-6 text-base",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };

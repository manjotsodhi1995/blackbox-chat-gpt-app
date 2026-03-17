"use client";

import Link from "next/link";
import { ActivityDialog } from "@/app/components/activity-dialog";
import { Button } from "@/app/components/ui/button";

export default function ActivityPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="w-full max-w-md text-center space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#171717] dark:text-[#ededed]">
            Activity Demo
          </h1>
          <p className="mt-2 text-sm text-[#737373] dark:text-[#a3a3a3]">
            Open the dialog to view workspace activity with optimized fetching
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <ActivityDialog
            trigger={
              <Button size="lg">
                Open Activity Dialog
              </Button>
            }
          />

          <Link
            href="/"
            className="text-sm text-[#737373] hover:text-[#171717] dark:text-[#a3a3a3] dark:hover:text-[#ededed] transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

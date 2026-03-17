"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  workspace: string;
}

export interface Workspace {
  id: string;
  name: string;
  type: "personal" | "team";
}

interface FetchState {
  data: ActivityItem[];
  loading: boolean;
  error: string | null;
}

type WorkspaceCache = Map<string, { data: ActivityItem[]; fetchedAt: number }>;

// ─── Configuration ───────────────────────────────────────────────────────────

const CACHE_TTL_MS = 30_000; // 30 seconds cache validity
const STALE_WHILE_REVALIDATE_MS = 60_000; // serve stale for 60s while refetching

// ─── Fetch Hook with AbortController + Caching ──────────────────────────────

function useActivityFetch(
  workspaceId: string,
  activityType: "my" | "team",
  fetchFn?: (
    workspaceId: string,
    type: "my" | "team",
    signal: AbortSignal
  ) => Promise<ActivityItem[]>
) {
  const [state, setState] = useState<FetchState>({
    data: [],
    loading: false,
    error: null,
  });

  // AbortController ref — cancels in-flight requests on workspace/type switch
  const abortControllerRef = useRef<AbortController | null>(null);

  // Per-workspace+type cache to avoid redundant fetches
  const cacheRef = useRef<WorkspaceCache>(new Map());

  // Track the current request identity to discard stale responses
  const requestIdRef = useRef(0);

  const fetchActivities = useCallback(async () => {
    const cacheKey = `${workspaceId}:${activityType}`;
    const cached = cacheRef.current.get(cacheKey);
    const now = Date.now();

    // Serve from cache if fresh
    if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
      setState({ data: cached.data, loading: false, error: null });
      return;
    }

    // Serve stale data immediately while revalidating in background
    if (cached && now - cached.fetchedAt < STALE_WHILE_REVALIDATE_MS) {
      setState({ data: cached.data, loading: true, error: null });
    } else {
      setState({ data: [], loading: true, error: null });
    }

    // Cancel any in-flight request from a previous workspace/type switch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const currentRequestId = ++requestIdRef.current;

    try {
      let activities: ActivityItem[];

      if (fetchFn) {
        activities = await fetchFn(workspaceId, activityType, controller.signal);
      } else {
        activities = await defaultFetchActivities(
          workspaceId,
          activityType,
          controller.signal
        );
      }

      // Discard if a newer request has been issued (race condition guard)
      if (currentRequestId !== requestIdRef.current) return;

      // Update cache
      cacheRef.current.set(cacheKey, { data: activities, fetchedAt: Date.now() });

      setState({ data: activities, loading: false, error: null });
    } catch (err: unknown) {
      // Ignore aborted requests — they're intentional
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (currentRequestId !== requestIdRef.current) return;

      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch activities",
      }));
    }
  }, [workspaceId, activityType, fetchFn]);

  // Fetch whenever workspace or activity type changes
  useEffect(() => {
    fetchActivities();

    return () => {
      // Cleanup: abort on unmount or dependency change
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchActivities]);

  const invalidateCache = useCallback(
    (key?: string) => {
      if (key) {
        cacheRef.current.delete(key);
      } else {
        cacheRef.current.delete(`${workspaceId}:${activityType}`);
      }
    },
    [workspaceId, activityType]
  );

  return { ...state, refetch: fetchActivities, invalidateCache };
}

// ─── Default fetch (simulated) ──────────────────────────────────────────────

async function defaultFetchActivities(
  workspaceId: string,
  type: "my" | "team",
  signal: AbortSignal
): Promise<ActivityItem[]> {
  // Simulated API call — replace with real endpoint
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, 600);
    signal.addEventListener("abort", () => {
      clearTimeout(timeout);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

  if (signal.aborted) throw new DOMException("Aborted", "AbortError");

  const now = new Date();
  const baseActivities: ActivityItem[] =
    type === "my"
      ? [
          {
            id: `${workspaceId}-my-1`,
            user: "You",
            action: "updated",
            target: "Project settings",
            timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
            workspace: workspaceId,
          },
          {
            id: `${workspaceId}-my-2`,
            user: "You",
            action: "created",
            target: "New branch feature/auth",
            timestamp: new Date(now.getTime() - 30 * 60000).toISOString(),
            workspace: workspaceId,
          },
          {
            id: `${workspaceId}-my-3`,
            user: "You",
            action: "deployed",
            target: "Production v2.1.0",
            timestamp: new Date(now.getTime() - 2 * 3600000).toISOString(),
            workspace: workspaceId,
          },
        ]
      : [
          {
            id: `${workspaceId}-team-1`,
            user: "Alice",
            action: "merged",
            target: "PR #142 — Fix auth flow",
            timestamp: new Date(now.getTime() - 10 * 60000).toISOString(),
            workspace: workspaceId,
          },
          {
            id: `${workspaceId}-team-2`,
            user: "Bob",
            action: "commented on",
            target: "Issue #89",
            timestamp: new Date(now.getTime() - 45 * 60000).toISOString(),
            workspace: workspaceId,
          },
          {
            id: `${workspaceId}-team-3`,
            user: "Carol",
            action: "pushed to",
            target: "main branch",
            timestamp: new Date(now.getTime() - 3 * 3600000).toISOString(),
            workspace: workspaceId,
          },
          {
            id: `${workspaceId}-team-4`,
            user: "Dave",
            action: "created",
            target: "Sprint 14 board",
            timestamp: new Date(now.getTime() - 5 * 3600000).toISOString(),
            workspace: workspaceId,
          },
        ];

  return baseActivities;
}

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3 animate-pulse">
          <div className="h-8 w-8 rounded-full bg-[#e5e5e5] dark:bg-[#333] shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-3/4 rounded bg-[#e5e5e5] dark:bg-[#333]" />
            <div className="h-3 w-1/2 rounded bg-[#f0f0f0] dark:bg-[#262626]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Activity List Item ──────────────────────────────────────────────────────

function ActivityListItem({ item }: { item: ActivityItem }) {
  const timeAgo = useMemo(() => {
    const diff = Date.now() - new Date(item.timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, [item.timestamp]);

  const initials = useMemo(
    () =>
      item.user
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    [item.user]
  );

  return (
    <div className="flex items-start gap-3 py-2.5 px-1 rounded-md transition-colors hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a]">
      <div className="h-8 w-8 rounded-full bg-[#171717] dark:bg-[#ededed] flex items-center justify-center shrink-0">
        <span className="text-xs font-medium text-white dark:text-[#171717]">
          {initials}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#171717] dark:text-[#ededed]">
          <span className="font-medium">{item.user}</span>{" "}
          <span className="text-[#737373] dark:text-[#a3a3a3]">
            {item.action}
          </span>{" "}
          <span className="font-medium">{item.target}</span>
        </p>
        <p className="text-xs text-[#a3a3a3] dark:text-[#666] mt-0.5">
          {timeAgo}
        </p>
      </div>
    </div>
  );
}

// ─── Activity Dialog Props ───────────────────────────────────────────────────

export interface ActivityDialogProps {
  workspaces?: Workspace[];
  fetchActivities?: (
    workspaceId: string,
    type: "my" | "team",
    signal: AbortSignal
  ) => Promise<ActivityItem[]>;
  trigger?: React.ReactNode;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ActivityDialog({
  workspaces: workspacesProp,
  fetchActivities: fetchFn,
  trigger,
}: ActivityDialogProps) {
  const workspaces = useMemo<Workspace[]>(
    () =>
      workspacesProp ?? [
        { id: "personal", name: "Personal", type: "personal" },
        { id: "team-alpha", name: "Team Alpha", type: "team" },
        { id: "team-beta", name: "Team Beta", type: "team" },
      ],
    [workspacesProp]
  );

  const [selectedWorkspace, setSelectedWorkspace] = useState(workspaces[0].id);
  const [activityTab, setActivityTab] = useState<"my" | "team">("my");

  const { data, loading, error, refetch } = useActivityFetch(
    selectedWorkspace,
    activityTab,
    fetchFn
  );

  // Workspace switch handler — the key fix:
  // By updating state, the useEffect in useActivityFetch fires with the new
  // workspaceId, which aborts any in-flight request and starts a fresh fetch.
  const handleWorkspaceChange = useCallback(
    (wsId: string) => {
      if (wsId === selectedWorkspace) return;
      setSelectedWorkspace(wsId);
    },
    [selectedWorkspace]
  );

  const handleTabChange = useCallback(
    (value: string) => {
      const tab = value as "my" | "team";
      if (tab === activityTab) return;
      setActivityTab(tab);
    },
    [activityTab]
  );

  const selectedWorkspaceName = useMemo(
    () => workspaces.find((w) => w.id === selectedWorkspace)?.name ?? "",
    [workspaces, selectedWorkspace]
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            Activity
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Activity</DialogTitle>
          <DialogDescription>
            Recent activity in{" "}
            <span className="font-medium text-[#171717] dark:text-[#ededed]">
              {selectedWorkspaceName}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Workspace Switcher */}
        <div className="flex gap-1.5 flex-wrap">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => handleWorkspaceChange(ws.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
                selectedWorkspace === ws.id
                  ? "bg-[#171717] text-white dark:bg-[#ededed] dark:text-[#171717]"
                  : "bg-[#f5f5f5] text-[#737373] hover:bg-[#e5e5e5] hover:text-[#171717] dark:bg-[#1a1a1a] dark:text-[#a3a3a3] dark:hover:bg-[#262626] dark:hover:text-[#ededed]"
              }`}
            >
              {ws.name}
              {ws.type === "team" && (
                <span className="ml-1 opacity-60">· Team</span>
              )}
            </button>
          ))}
        </div>

        {/* Activity Tabs */}
        <Tabs
          value={activityTab}
          onValueChange={handleTabChange}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="w-full">
            <TabsTrigger value="my" className="flex-1">
              My Activity
            </TabsTrigger>
            <TabsTrigger value="team" className="flex-1">
              Team Member Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my" className="flex-1 overflow-y-auto mt-3">
            <ActivityContent
              data={data}
              loading={loading}
              error={error}
              onRetry={refetch}
            />
          </TabsContent>

          <TabsContent value="team" className="flex-1 overflow-y-auto mt-3">
            <ActivityContent
              data={data}
              loading={loading}
              error={error}
              onRetry={refetch}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ─── Activity Content (shared between tabs) ──────────────────────────────────

function ActivityContent({
  data,
  loading,
  error,
  onRetry,
}: {
  data: ActivityItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (loading && data.length === 0) {
    return <ActivitySkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-[#a3a3a3] dark:text-[#666]">
          No activity yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {loading && (
        <div className="text-xs text-[#a3a3a3] dark:text-[#666] mb-2 animate-pulse">
          Refreshing...
        </div>
      )}
      {data.map((item) => (
        <ActivityListItem key={item.id} item={item} />
      ))}
    </div>
  );
}

export default ActivityDialog;

"use client";

import { useApplications } from "@/lib/hooks/useApplications";
import { useMyHost } from "@/lib/hooks/useHost";
import { ApplicationCard } from "@/components/application/ApplicationCard";
import { Loader2, ArrowLeft, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Application } from "@/lib/schemas/application";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { ApplicationCardSkeleton } from "@/components/skeletons/ApplicationCardSkeleton";

export default function HostApplicationsPage() {
    const { data: host, isLoading: isHostLoading } = useMyHost();
    const { data: applications, isLoading: isAppsLoading, error } = useApplications({ hostId: host?.id });

    // Status Columns
    // PENDING -> Review
    // ACCEPTED -> Upcoming/Active
    // COMPLETED -> Done
    // REJECTED/CANCELLED -> Archived

    const groupedApps = useMemo(() => {
        if (!applications) return { PENDING: [], ACCEPTED: [], COMPLETED: [], ARCHIVED: [] };

        const groups: Record<'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'ARCHIVED', Application[]> = {
            PENDING: [],
            ACCEPTED: [],
            COMPLETED: [],
            ARCHIVED: []
        };

        const safeApplications = applications as unknown as Application[];

        safeApplications.forEach(app => {
            const status = app.status || 'PENDING';
            if (status === 'PENDING') {
                groups.PENDING.push(app);
            } else if (status === 'ACCEPTED') {
                groups.ACCEPTED.push(app);
            } else if (status === 'COMPLETED') {
                groups.COMPLETED.push(app);
            } else {
                groups.ARCHIVED.push(app);
            }
        });

        // Sort by date inside groups
        (Object.keys(groups) as Array<keyof typeof groups>).forEach(key => {
            groups[key].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        });

        return groups;
    }, [applications]);

    // ... inside HostApplicationsPage

    if (isHostLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    if (!host) {
        // ...
    }

    // Remove error loading for now or handle it better? Keep existing error check.

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-muted/10">
            {/* Header */}
            {/* ... same header ... */}

            {/* Kanban Board Container */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                <div className="flex h-full gap-6 min-w-max">
                    <KanbanColumn
                        title="In Review"
                        count={groupedApps.PENDING.length}
                        color="bg-yellow-500"
                        apps={groupedApps.PENDING}
                        isLoading={isAppsLoading}
                    />
                    <KanbanColumn
                        title="Accepted / Upcoming"
                        count={groupedApps.ACCEPTED.length}
                        color="bg-green-500"
                        apps={groupedApps.ACCEPTED}
                        isLoading={isAppsLoading}
                    />
                    <KanbanColumn
                        title="Completed"
                        count={groupedApps.COMPLETED.length}
                        color="bg-blue-500"
                        apps={groupedApps.COMPLETED}
                        isLoading={isAppsLoading}
                    />
                    <KanbanColumn
                        title="Archived"
                        count={groupedApps.ARCHIVED.length}
                        color="bg-gray-500"
                        apps={groupedApps.ARCHIVED}
                        isLoading={isAppsLoading}
                    />
                </div>
            </div>
        </div>
    );
}

function KanbanColumn({ title, count, color, apps, isLoading }: { title: string, count: number, color: string, apps: Application[], isLoading: boolean }) {
    return (
        <div className="flex flex-col w-[350px] bg-background rounded-xl border shadow-sm h-full">
            {/* Column Header */}
            <div className={`p-4 border-b flex items-center justify-between bg-muted/30 rounded-t-xl sticky top-0`}>
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    <h3 className="font-semibold text-sm uppercase tracking-wide">{title}</h3>
                </div>
                <Badge variant="secondary" className="text-xs font-mono">
                    {isLoading ? "-" : count}
                </Badge>
            </div>

            {/* Column Content */}
            <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
                <div className="space-y-3 pb-4">
                    {isLoading ? (
                        <>
                            <ApplicationCardSkeleton isHostView={true} />
                            <ApplicationCardSkeleton isHostView={true} />
                            <ApplicationCardSkeleton isHostView={true} />
                        </>
                    ) : apps.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                            No applications
                        </div>
                    ) : (
                        apps.map(app => (
                            <ApplicationCard
                                key={app.id || app.opportunityId}
                                application={app}
                                isHostView={true}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

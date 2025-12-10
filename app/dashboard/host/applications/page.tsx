"use client";

import { useApplications } from "@/lib/hooks/useApplications";
import { useMyHost } from "@/lib/hooks/useHost";
import { ApplicationCard } from "@/components/application/ApplicationCard";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Application } from "@/lib/schemas/application";

export default function HostApplicationsPage() {
    const { data: host, isLoading: isHostLoading } = useMyHost();
    const { data: applications, isLoading: isAppsLoading, error } = useApplications({ hostId: host?.id });

    // Ensure we don't query if no host, but hook handles 'enabled'.
    // However, if we are loading host, show loading.

    if (isHostLoading || isAppsLoading) {
        return <div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    if (!host) {
        return (
            <div className="container py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">Host Profile Not Found</h1>
                <p className="text-muted-foreground mb-4">Please create a host profile to manage applications.</p>
                <Button asChild><Link href="/dashboard/profile">Create Profile</Link></Button>
            </div>
        );
    }

    if (error) {
        return <div className="text-center py-10 text-destructive">Failed to load applications. Please try again.</div>;
    }

    // Sort by createdAt desc
    const sortedApplications = applications ? [...applications].sort((a, b) => { // Cast to array if needed
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }) : [];

    return (
        <div className="container py-10 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard"><ArrowLeft className="w-4 h-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Received Applications</h1>
                    <p className="text-muted-foreground">Manage applications from volunteers for your opportunities.</p>
                </div>
            </div>

            {sortedApplications.length === 0 ? (
                <div className="text-center py-20 border rounded-xl bg-muted/20">
                    <h3 className="text-xl font-semibold mb-2">No applications received yet</h3>
                    <p className="text-muted-foreground mb-6">Create more opportunities to attract volunteers.</p>
                    <Button asChild>
                        <Link href="/dashboard/opportunities/create">Post Opportunity</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedApplications.map((app) => (
                        <ApplicationCard
                            key={app.id || app.opportunityId}
                            application={app as unknown as Application}
                            isHostView={true}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

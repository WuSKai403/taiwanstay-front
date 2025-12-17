"use client";

import { useAdminStats } from "@/lib/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Image, AlertCircle, Loader2 } from "lucide-react";

export default function AdminDashboardPage() {
    const { data: stats, isLoading, error } = useAdminStats();

    if (isLoading) {
        return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    if (error) {
        return (
            <div className="p-8 text-destructive border border-destructive/20 rounded-md bg-destructive/10">
                <h3 className="font-semibold flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Failed to load stats</h3>
                <p className="text-sm mt-2">{error.message}</p>
            </div>
        );
    }

    // Fallback if stats is empty (mocking visual structure)
    const data = stats || {
        totalUsers: 0,
        totalHosts: 0,
        totalOpportunities: 0,
        pendingImages: 0,
        pendingOpportunities: 0
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Overview of platform activity and moderation queue.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalUsers || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {data.totalHosts || 0} Hosts
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Opportunities</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalOpportunities || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Images</CardTitle>
                        <Image className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.pendingImages || 0}</div>
                        <p className="text-xs text-muted-foreground">Needs review</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Opportunities</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.pendingOpportunities || 0}</div>
                        <p className="text-xs text-muted-foreground">Needs review</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

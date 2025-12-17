"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { Opportunity } from "@/lib/schemas/opportunity";
import { OpportunityCardSkeleton } from "@/components/skeletons/OpportunityCardSkeleton";

export default function DashboardPage() {
    const { data: session } = useSession();

    const { data: myOpportunities, isLoading } = useQuery({
        queryKey: ["my-opportunities"],
        queryFn: async () => {
            const res = await api.get("/opportunities"); // Listing all for now, filter by host on backend
            return res.data as Opportunity[];
        },
        enabled: !!session?.user,
    });

    if (!session) {
        return (
            <div className="container py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">Please log in to view your dashboard</h1>
                <Button asChild>
                    <Link href="/auth/login">Log in</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="container py-10 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Manage your opportunities and applications.</p>
                </div>
                <Button asChild>
                    <Link href="/opportunities/create">
                        <Plus className="w-4 h-4 mr-2" />
                        Post Opportunity
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/dashboard/applications'}>
                    {/* Using onClick for full card clickable or wrap in Link */}
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            📄 My Applications
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">Check status of your sent applications.</p>
                        <Button variant="secondary" className="w-full" asChild>
                            <Link href="/dashboard/applications">View Applications</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/dashboard/host/profile'}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            👤 My Host Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">Update your organization info, location, and photos.</p>
                        <Button variant="secondary" className="w-full" asChild>
                            <Link href="/dashboard/host/profile">Edit Profile</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold tracking-tight">Host Management</h2>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/host/applications">
                                View Applications
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href="/dashboard/opportunities/create">
                                <Plus className="w-4 h-4 mr-2" />
                                Post Opportunity
                            </Link>
                        </Button>
                    </div>
                </div>

                <Card className="mb-6 hover:border-primary/50 transition-colors cursor-pointer border-l-4 border-l-primary" onClick={() => window.location.href = '/dashboard/host/applications'}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            📥 Received Applications
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">Review and manage applications from volunteers.</p>
                        <Button variant="secondary" className="w-full" asChild>
                            <Link href="/dashboard/host/applications">Manage Applications</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>My Opportunities</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="grid grid-cols-1 gap-4">
                                <OpportunityCardSkeleton />
                                <OpportunityCardSkeleton />
                            </div>
                        ) : myOpportunities && myOpportunities.length > 0 ? (
                            <div className="space-y-4">
                                {myOpportunities.map((opp) => (
                                    <div key={opp.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-muted rounded-md overflow-hidden">
                                                <img src={opp.media?.coverImage?.secureUrl || '/placeholder.png'} alt={opp.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{opp.title}</h3>
                                                <p className="text-sm text-muted-foreground">{opp.status}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/opportunities/${opp.id}/edit`}>
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="destructive" size="sm">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">
                                You haven't posted any opportunities yet.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

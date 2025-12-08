"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { IOpportunity } from "@/types/opportunity";

export default function DashboardPage() {
    const { data: session } = useSession();

    const { data: myOpportunities, isLoading } = useQuery({
        queryKey: ["my-opportunities"],
        queryFn: async () => {
            const res = await api.get("/opportunities/me"); // Assuming this endpoint exists or we filter by hostId
            return res.data as IOpportunity[];
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

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>My Opportunities</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div>Loading...</div>
                        ) : myOpportunities && myOpportunities.length > 0 ? (
                            <div className="space-y-4">
                                {myOpportunities.map((opp) => (
                                    <div key={opp._id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-muted rounded-md overflow-hidden">
                                                <img src={opp.media?.coverImage?.url} alt={opp.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{opp.title}</h3>
                                                <p className="text-sm text-muted-foreground">{opp.status}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/opportunities/${opp.publicId}/edit`}>
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

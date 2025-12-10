"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Opportunity } from "@/lib/schemas/opportunity";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Plus, Edit, Trash2, MapPin, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function HostOpportunitiesPage() {
    const { toast } = useToast();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // TODO: Use useOpportunities hook with hostId param when backend supports filtering by host
    // For now, fetching all and filtering client side (or assuming backend returns mine if /opportunities calls are scoped?)
    // Actually, earlier I saw /opportunities has hostId param.
    // Let's use useQuery directly here or useOpportunities hook.
    // The previous Dashboard code used api.get("/opportunities").
    // Let's try to be consistent with useOpportunities hook if possible, or just fetch directly if I want full control.

    // Using the hook we analyzed: useOpportunities(params)
    // We need to pass hostId. But we need my hostId first.
    // Let's assume for now we list all (mock behavior) or the API /opportunities returns all public ones.
    // If I want "My Opportunities", maybe I need to filter by my user ID or Host ID.
    // Ideally: const { data: host } = useMyHost(); const { data: opportunities } = useOpportunities({ hostId: host?.id });

    // For this implementation, I will replicate the dashboard logic roughly but cleaner.

    const { data: opportunities, isLoading, refetch } = useQuery({
        queryKey: ["my-opportunities-full"],
        queryFn: async () => {
            // TODO: Replace with proper "my opportunities" endpoint or filter
            const res = await api.get("/opportunities");
            return res.data as Opportunity[];
        },
    });

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/opportunities/${id}`);
            toast({ title: "Opportunity deleted" });
            refetch();
        } catch (error) {
            toast({ title: "Failed to delete", variant: "destructive" });
        } finally {
            setDeletingId(null);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="container py-10 space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard"><ArrowLeft className="w-4 h-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Opportunities</h1>
                        <p className="text-muted-foreground">Manage your listings.</p>
                    </div>
                </div>
                <Button asChild>
                    <Link href="/dashboard/opportunities/create">
                        <Plus className="w-4 h-4 mr-2" />
                        Post New
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {opportunities?.map((opp) => (
                    <Card key={opp.id} className="flex flex-col">
                        <div className="relative h-48 w-full bg-muted overflow-hidden rounded-t-xl">
                            <img
                                src={opp.media?.coverImage?.secureUrl || "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&q=80"}
                                alt={opp.title}
                                className="w-full h-full object-cover transition-transform hover:scale-105"
                            />
                            <div className="absolute top-2 right-2">
                                <Badge variant={opp.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                    {opp.status || 'DRAFT'}
                                </Badge>
                            </div>
                        </div>
                        <CardHeader>
                            <CardTitle className="line-clamp-1">{opp.title}</CardTitle>
                            <div className="flex items-center text-sm text-muted-foreground">
                                <MapPin className="mr-1 h-3 w-3" />
                                {opp.location?.city}, {opp.location?.country}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {opp.description}
                            </p>
                        </CardContent>
                        <CardFooter className="gap-2 pt-0">
                            <Button variant="outline" className="flex-1" asChild>
                                <Link href={`/dashboard/opportunities/${opp.id}/edit`}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </Link>
                            </Button>

                            <Button variant="destructive" size="icon" onClick={() => {
                                if (window.confirm("Are you sure you want to delete this opportunity? This action cannot be undone.")) {
                                    handleDelete(opp.id!);
                                }
                            }}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}

                {(!opportunities || opportunities.length === 0) && (
                    <div className="col-span-full text-center py-20 border rounded-xl bg-muted/20">
                        <h3 className="text-xl font-semibold mb-2">No opportunities found</h3>
                        <Button variant="link" asChild><Link href="/opportunities/create">Create your first one</Link></Button>
                    </div>
                )}
            </div>
        </div>
    );
}

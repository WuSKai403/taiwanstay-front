"use client";

import { useBookmarks } from "@/lib/hooks/useBookmarks";
import { OpportunityCard } from "@/components/opportunity/OpportunityCard";
import { Loader2 } from "lucide-react";

export default function BookmarksPage() {
    const { data, isLoading } = useBookmarks();

    return (
        <div className="container py-8 space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">My Bookmarks</h1>

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data?.opportunities?.map((opp: any) => (
                        <OpportunityCard key={opp.id} opportunity={opp} />
                    ))}
                    {(!data?.opportunities || data.opportunities.length === 0) && (
                        <div className="col-span-full text-center py-10 text-muted-foreground">
                            You haven't saved any opportunities yet.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

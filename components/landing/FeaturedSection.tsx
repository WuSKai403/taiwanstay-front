"use client";

import { useOpportunities } from "@/lib/hooks/useOpportunities";
import { OpportunityCard } from "@/components/opportunity/OpportunityCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export function FeaturedSection() {
    const { data: opportunities, isLoading } = useOpportunities({ limit: 3 });

    return (
        <section className="py-20 bg-slate-50">
            <div className="container px-4">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl font-bold text-[#006994] mb-2">Featured Opportunities</h2>
                        <p className="text-muted-foreground">Top-rated hosts waiting for your help.</p>
                    </div>
                    <Button variant="outline" className="hidden md:flex border-[#006994] text-[#006994] hover:bg-[#006994]/10" asChild>
                        <Link href="/opportunities">View All</Link>
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-[#006994]" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {opportunities?.slice(0, 3).map((opp) => (
                            <OpportunityCard key={opp.id} opportunity={opp as any} />
                        ))}
                    </div>
                )}

                <div className="mt-10 text-center md:hidden">
                    <Button className="w-full bg-[#006994] text-white" asChild>
                        <Link href="/opportunities">View All Opportunities</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}

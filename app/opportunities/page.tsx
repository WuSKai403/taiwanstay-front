"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { OpportunityCard } from "@/components/opportunity/OpportunityCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { IOpportunity } from "@/types/opportunity";

export default function OpportunitiesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [locationFilter, setLocationFilter] = useState("all");

    // Fetch opportunities
    const { data: opportunities, isLoading, error } = useQuery({
        queryKey: ["opportunities", searchQuery, locationFilter],
        queryFn: async () => {
            // In a real app, pass params to the API
            // const params = new URLSearchParams();
            // if (searchQuery) params.append("q", searchQuery);
            // if (locationFilter !== "all") params.append("location", locationFilter);

            const res = await api.get("/opportunities");
            return res.data as IOpportunity[];
        },
    });

    // Mock data for fallback if API fails or is empty (for development preview)
    const mockOpportunities: Partial<IOpportunity>[] = [
        {
            publicId: "1",
            title: "Surf Hostel Helper in Kenting",
            type: "HOSTEL_HELP" as any,
            location: { city: "Hengchun", country: "Taiwan" },
            media: { coverImage: { url: "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?q=80&w=2574&auto=format&fit=crop" } } as any,
            ratings: { overall: 4.8, reviewCount: 12 } as any,
        },
        {
            publicId: "2",
            title: "Organic Farm Volunteer",
            type: "FARM_STAY" as any,
            location: { city: "Taitung", country: "Taiwan" },
            media: { coverImage: { url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=2669&auto=format&fit=crop" } } as any,
            ratings: { overall: 4.9, reviewCount: 8 } as any,
        },
        {
            publicId: "3",
            title: "Language Exchange & Babysitting",
            type: "LANGUAGE_EXCHANGE" as any,
            location: { city: "Kaohsiung", country: "Taiwan" },
            media: { coverImage: { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2673&auto=format&fit=crop" } } as any,
            ratings: { overall: 4.5, reviewCount: 5 } as any,
        },
    ];

    const display opportunities = (opportunities && opportunities.length > 0) ? opportunities : mockOpportunities;

    return (
        <div className="container py-8 space-y-8">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Find Opportunities</h1>
                    <p className="text-muted-foreground">Discover {displayOpportunities?.length || 0} hosts waiting for you.</p>
                </div>

                <div className="flex w-full md:w-auto gap-2">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon">
                        <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 pb-4 border-b">
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        <SelectItem value="Hengchun">Hengchun</SelectItem>
                        <SelectItem value="Taitung">Taitung</SelectItem>
                        <SelectItem value="Kaohsiung">Kaohsiung</SelectItem>
                        <SelectItem value="Green Island">Green Island</SelectItem>
                    </SelectContent>
                </Select>

                <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="HOSTEL_HELP">Hostel Help</SelectItem>
                        <SelectItem value="FARM_STAY">Farm Stay</SelectItem>
                        <SelectItem value="LANGUAGE_EXCHANGE">Language Exchange</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-[350px] bg-muted animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayOpportunities?.map((opp) => (
                        <OpportunityCard key={opp.publicId || opp._id} opportunity={opp} />
                    ))}
                </div>
            )}
        </div>
    );
}

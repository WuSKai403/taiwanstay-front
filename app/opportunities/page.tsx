"use client";

import { useState } from "react";
import { useOpportunities } from "@/lib/hooks/useOpportunities";
import { OpportunityCard } from "@/components/opportunity/OpportunityCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { Opportunity } from "@/lib/api/opportunity";

export default function OpportunitiesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [locationFilter, setLocationFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");

    // Fetch opportunities using the Hook
    const { data: opportunities, isLoading, error } = useOpportunities({
        // query: searchQuery, // If backend supports generic 'q' or 'query'
        city: locationFilter !== "all" ? locationFilter : undefined,
        categories: typeFilter !== "all" ? [typeFilter] : undefined,
    });

    return (
        <div className="container py-8 space-y-8">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Find Opportunities</h1>
                    <p className="text-muted-foreground">Discover {opportunities?.length || 0} hosts waiting for you.</p>
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
                        <SelectItem value="Yilan">Yilan</SelectItem>
                        <SelectItem value="Hualien">Hualien</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
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
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : error ? (
                <div className="text-center py-20 text-destructive">
                    <p>Error loading opportunities. Please try again later.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {opportunities?.map((opp) => (
                        <OpportunityCard key={opp.id} opportunity={opp as any} />
                    ))}
                    {opportunities?.length === 0 && (
                        <div className="col-span-full text-center py-10 text-muted-foreground">
                            No opportunities found matching your criteria.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}


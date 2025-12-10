"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Opportunity } from "@/lib/api/opportunity";

const OpportunityMap = dynamic(
    () => import("./OpportunityMap"),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-[600px] flex items-center justify-center bg-muted/20 rounded-lg border">
                <Skeleton className="w-full h-full rounded-lg" />
            </div>
        )
    }
);

interface OpportunityMapWrapperProps {
    opportunities: Opportunity[];
}

export function OpportunityMapWrapper({ opportunities }: OpportunityMapWrapperProps) {
    return (
        <div className="w-full h-[calc(100vh-200px)] min-h-[500px]">
            <OpportunityMap opportunities={opportunities} />
        </div>
    );
}

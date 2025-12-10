"use client";

import { useEffect, useState, MouseEvent } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBookmarks, useToggleBookmark } from "@/lib/hooks/useBookmarks";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
    opportunityId: string;
    variant?: "default" | "ghost" | "outline" | "icon_only";
    className?: string;
    label?: string; // e.g., "Save to wishlist"
}

export function BookmarkButton({ opportunityId, variant = "ghost", className, label }: BookmarkButtonProps) {
    const { data: bookmarksData, isLoading } = useBookmarks();
    const { mutate: toggleBookmark, isPending } = useToggleBookmark();

    // Check if bookmarked
    // Assuming bookmarksData returns { opportunities: Opportunity[] }
    // We check if opportunityId exists in the list
    const isBookmarked = bookmarksData?.opportunities?.some((opp: any) => opp.id === opportunityId) ?? false;

    const handleClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        toggleBookmark({ id: opportunityId, isBookmarked });
    };

    const isIconOnly = (variant as string) === "icon_only";

    if (isIconOnly) {
        return (
            <button
                onClick={handleClick}
                disabled={isPending || isLoading}
                className={cn("p-2 rounded-full bg-white/50 hover:bg-white transition-colors backdrop-blur-sm", className)}
                title={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
            >
                <Heart className={cn("w-5 h-5 transition-colors", isBookmarked ? "fill-red-500 text-red-500" : "text-gray-600")} />
            </button>
        )
    }

    return (
        <Button
            variant={(variant as any) === "icon_only" ? "ghost" : variant as any}
            size={(variant as any) === "icon_only" ? "icon" : "default"}
            className={cn("gap-2", className)}
            onClick={handleClick}
            disabled={isPending || isLoading}
        >
            <Heart className={cn("w-4 h-4", isBookmarked ? "fill-red-500 text-red-500" : "")} />
            {label || (isBookmarked ? "Saved" : "Save")}
        </Button>
    );
}

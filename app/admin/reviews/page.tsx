"use client";

import { useReviews } from "@/lib/hooks/useReviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "@/components/reviews/StarRating";
import { Loader2 } from "lucide-react";

// Mocking a list of global reviews for admin
// In real app, we would need GET /admin/reviews
export default function AdminReviewsPage() {
    // Reusing useReviews with a mock generic ID or we would need a new hook
    // For now, let's just show a placeholder message since backend support is missing

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Review Moderation</h1>
                <p className="text-muted-foreground">Monitor and moderate user reviews.</p>
            </div>

            <div className="p-12 text-center border border-dashed rounded-lg bg-muted/10">
                <p className="text-muted-foreground">Review moderation API is currently under development.</p>
                <div className="mt-4 flex justify-center opacity-50">
                    <StarRating rating={5} readonly />
                </div>
            </div>
        </div>
    );
}

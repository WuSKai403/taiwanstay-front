"use client";

import { useReviews } from "@/lib/hooks/useReviews";
import { StarRating } from "./StarRating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ReviewListProps {
    targetId: string;
}

export function ReviewList({ targetId }: ReviewListProps) {
    const { data: reviews, isLoading } = useReviews(targetId);

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
    }

    if (!reviews || reviews.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-lg">
                No reviews yet. Be the first to review!
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold">Reviews ({reviews.length})</h3>
            <div className="space-y-6">
                {reviews.map((review) => (
                    <div key={review.id} className="space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={review.authorAvatar} />
                                    <AvatarFallback>{review.authorName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-semibold">{review.authorName}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                                    </div>
                                </div>
                            </div>
                            <StarRating rating={review.rating} readonly size="sm" />
                        </div>
                        <p className="text-muted-foreground">{review.content}</p>
                        <Separator />
                    </div>
                ))}
            </div>
        </div>
    );
}

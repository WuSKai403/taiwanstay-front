"use client";

import { useReviews, ReviewTargetType } from "@/lib/hooks/useReviews";
import { ReviewSkeleton } from "@/components/skeletons/ReviewSkeleton";
import { StarRating } from "./StarRating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ReviewListProps {
    targetId: string;
    targetType?: ReviewTargetType;
}

export function ReviewList({ targetId, targetType = 'OPPORTUNITY' }: ReviewListProps) {
    const { data: reviews, isLoading } = useReviews(targetId, targetType);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <ReviewSkeleton />
                <ReviewSkeleton />
                <ReviewSkeleton />
            </div>
        );
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
                                    <AvatarImage src={review.user?.image} />
                                    <AvatarFallback>{review.user?.name?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-semibold">{review.user?.name || 'Anonymous'}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {review.createdAt ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }) : 'Recently'}
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

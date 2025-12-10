import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReviews, createReview } from "@/lib/api/review";
import { CreateReviewInput } from "@/lib/schemas/review";

export const REVIEWS_QUERY_KEY = "reviews";

export function useReviews(targetId: string) {
    return useQuery({
        queryKey: [REVIEWS_QUERY_KEY, targetId],
        queryFn: () => getReviews(targetId),
        enabled: !!targetId,
    });
}

export function useCreateReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateReviewInput) => createReview(data),
        onSuccess: (newReview) => {
            // Invalidate the query to fetch fresh data
            queryClient.invalidateQueries({ queryKey: [REVIEWS_QUERY_KEY, newReview.targetId] });
            // Or manually update cache for optimistic UI (optional for now since we have mock delay)
        },
    });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReviews, createReview, ReviewWithUser } from "@/lib/api/review";
import { CreateReviewInput } from "@/lib/schemas/review";

export const REVIEWS_QUERY_KEY = "reviews";

export function useReviews(opportunityId: string) {
    return useQuery({
        queryKey: [REVIEWS_QUERY_KEY, opportunityId],
        queryFn: () => getReviews(opportunityId),
        enabled: !!opportunityId,
    });
}

export function useCreateReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateReviewInput) => createReview(data),
        onSuccess: (newReview) => {
            // Invalidate the query to fetch fresh data
            queryClient.invalidateQueries({ queryKey: [REVIEWS_QUERY_KEY, newReview.opportunityId] });
        },
    });
}

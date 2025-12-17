import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReviews, getHostReviews, createReview } from "@/lib/api/review";
import { CreateReviewInput } from "@/lib/schemas/review";

export const REVIEWS_QUERY_KEY = "reviews";

export type ReviewTargetType = 'OPPORTUNITY' | 'HOST';

export function useReviews(targetId: string, type: ReviewTargetType = 'OPPORTUNITY') {
    return useQuery({
        queryKey: [REVIEWS_QUERY_KEY, type, targetId],
        queryFn: () => {
            if (type === 'HOST') {
                return getHostReviews(targetId);
            }
            return getReviews(targetId);
        },
        enabled: !!targetId,
    });
}

export function useCreateReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateReviewInput) => createReview(data),
        onSuccess: (newReview) => {
            // Invalidate opportunity reviews
            queryClient.invalidateQueries({ queryKey: [REVIEWS_QUERY_KEY, 'OPPORTUNITY', newReview.opportunityId] });
            // Ideally we also invalidate Host reviews if we knew the Host ID here,
            // but the response might not contain it directly or we need to derive it.
            // For now, opportunity invalidation corresponds to where the user just posted.
        },
    });
}

import { http } from '../api';
import { CreateReviewInput, Review } from "@/lib/schemas/review";
import { components } from "@/types/api";

export type ReviewWithUser = components['schemas']['service.ReviewWithUser'];

/**
 * Get reviews for an opportunity
 */
export const getReviews = async (opportunityId: string): Promise<ReviewWithUser[]> => {
    return http.get<ReviewWithUser[]>(`/opportunities/${opportunityId}/reviews`);
};

/**
 * Create a review for an opportunity
 */
export const createReview = async (data: CreateReviewInput): Promise<Review> => {
    // The API expects 'service.CreateReviewRequest'.
    // Our CreateReviewInput matches it (content, rating, opportunityId).
    return http.post<Review>(`/opportunities/${data.opportunityId}/reviews`, data);
};

import { http } from '../api';
import { CreateReviewInput } from "@/lib/schemas/review";
import { components } from "@/types/api";

// Use the exact type generated from backend
export type ReviewWithUser = components['schemas']['service.ReviewWithUser'];
export type Review = components['schemas']['domain.Review'];

/**
 * Get reviews for an opportunity
 */
export const getReviews = async (opportunityId: string): Promise<ReviewWithUser[]> => {
    return http.get<ReviewWithUser[]>(`/opportunities/${opportunityId}/reviews`);
};

/**
 * Get reviews for a host (user)
 */
export const getHostReviews = async (userId: string): Promise<ReviewWithUser[]> => {
    return http.get<ReviewWithUser[]>(`/users/${userId}/reviews`);
};

/**
 * Create a review for an opportunity
 */
export const createReview = async (data: CreateReviewInput): Promise<Review> => {
    // The API expects 'service.CreateReviewRequest'.
    // Our CreateReviewInput updates matches: content, rating, opportunityId.
    return http.post<Review>(`/opportunities/${data.opportunityId}/reviews`, data);
};

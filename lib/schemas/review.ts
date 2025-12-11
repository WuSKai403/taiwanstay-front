import { z } from "zod";

export const reviewSchema = z.object({
  id: z.string().optional(),
  content: z.string().min(10, "Review must be at least 10 characters").max(1000),
  rating: z.number().min(1).max(5),
  opportunityId: z.string(),
  userId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  // For frontend display
  user: z.object({
    id: z.string(),
    name: z.string().optional(),
    avatar: z.string().optional(),
  }).optional(),
});

export const createReviewSchema = z.object({
  content: z.string().min(10, "Review must be at least 10 characters").max(1000),
  rating: z.number().min(1).max(5),
  opportunityId: z.string(),
});

export type Review = z.infer<typeof reviewSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
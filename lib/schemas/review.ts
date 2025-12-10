import { z } from "zod";

export const reviewSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  authorAvatar: z.string().optional(),
  targetId: z.string(), // ID of the Host or Opportunity being reviewed
  targetType: z.enum(["HOST", "OPPORTUNITY", "VOLUNTEER"]),
  rating: z.number().min(1).max(5),
  content: z.string().min(10, "Review must be at least 10 characters").max(1000),
  createdAt: z.string().or(z.date()),
});

export const createReviewSchema = reviewSchema.omit({
  id: true,
  authorId: true, // Inferred from session
  authorName: true,
  authorAvatar: true,
  createdAt: true,
});

export type Review = z.infer<typeof reviewSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
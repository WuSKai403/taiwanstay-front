"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { StarRating } from "./StarRating";
import { createReviewSchema } from "@/lib/schemas/review";
import { useCreateReview } from "@/lib/hooks/useReviews";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ReviewFormProps {
    opportunityId: string;
    onSuccess?: () => void;
}

// Omit opportunityId from form input since passed as props
const formSchema = createReviewSchema.omit({ opportunityId: true });
type ReviewFormValues = z.infer<typeof formSchema>;

export function ReviewForm({ opportunityId, onSuccess }: ReviewFormProps) {
    const { toast } = useToast();
    const { mutate: createReview, isPending } = useCreateReview();

    const form = useForm<ReviewFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            rating: 5,
            content: "",
        },
    });

    const onSubmit = (values: ReviewFormValues) => {
        createReview(
            {
                ...values,
                opportunityId,
            },
            {
                onSuccess: () => {
                    toast({ title: "Review submitted successfully!" });
                    form.reset();
                    onSuccess?.();
                },
                onError: () => {
                    toast({ title: "Failed to submit review", variant: "destructive" });
                },
            }
        );
    };

    return (
        <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="rating"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Rating</FormLabel>
                                <FormControl>
                                    <StarRating
                                        rating={field.value}
                                        onRatingChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Review</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Share your experience..."
                                        className="min-h-[100px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Review
                    </Button>
                </form>
            </Form>
        </div>
    );
}

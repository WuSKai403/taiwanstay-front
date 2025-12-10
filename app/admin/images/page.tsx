"use client";

import { usePendingImages, useReviewImage } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminImagesPage() {
    const { data, isLoading, isError } = usePendingImages();
    const { mutate: reviewImage, isPending: isReviewing } = useReviewImage();
    const { toast } = useToast();

    const handleReview = (id: string, status: 'APPROVED' | 'REJECTED') => {
        reviewImage({ id, status }, {
            onSuccess: () => toast({ title: `Image ${status.toLowerCase()}` }),
            onError: () => toast({ title: "Failed to review image", variant: "destructive" })
        });
    };

    if (isLoading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    if (isError) return <div className="p-8 text-center text-red-500">Failed to load images</div>;

    const images = data?.images || [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Content Moderation</h1>
                <p className="text-muted-foreground">Review pending images ({data?.total || 0}).</p>
            </div>

            {images.length === 0 ? (
                <div className="p-12 text-center border rounded-lg bg-muted/20 text-muted-foreground">
                    No pending images to review.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {images.map((img) => (
                        <Card key={img.id} className="overflow-hidden">
                            <div className="aspect-square relative bg-muted">
                                <img
                                    src={img.publicUrl}
                                    alt="Review"
                                    className="object-cover w-full h-full"
                                />
                                {img.visionData && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2">
                                        <div>Adult: {img.visionData.adult}</div>
                                        <div>Violence: {img.visionData.violence}</div>
                                        <div>Racy: {img.visionData.racy}</div>
                                    </div>
                                )}
                            </div>
                            <CardFooter className="p-2 gap-2">
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    onClick={() => handleReview(img.id!, 'APPROVED')}
                                    disabled={isReviewing}
                                >
                                    <Check className="w-4 h-4 mr-1" /> Approve
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => handleReview(img.id!, 'REJECTED')}
                                    disabled={isReviewing}
                                >
                                    <X className="w-4 h-4 mr-1" /> Reject
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

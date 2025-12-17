'use client';

import { components } from '@/types/api';
import { SecureImage } from './SecureImage';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

type Image = components['schemas']['domain.Image'];
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, AlertTriangle } from 'lucide-react';
import { useReviewImage } from '@/lib/hooks/useAdmin';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

interface AdminImageCardProps {
    image: Image;
}

export function AdminImageCard({ image }: AdminImageCardProps) {
    const { mutate: review, isPending } = useReviewImage();

    // Parse Vision Data if available
    const visionData = image.visionData || {};
    const riskCategories = ['adult', 'racy', 'violence', 'medical', 'spoof'] as const;
    const risks = riskCategories.filter(cat => {
        const likelihood = visionData[cat];
        return likelihood && likelihood !== 'VERY_UNLIKELY' && likelihood !== 'UNLIKELY';
    });

    const handleReview = (status: 'APPROVED' | 'REJECTED') => {
        if (!image.id) return;
        review(
            { id: image.id, status },
            {
                onSuccess: () => {
                    toast.success(`Image ${status.toLowerCase()}`);
                },
                onError: () => {
                    toast.error('Failed to review image');
                }
            }
        );
    };

    return (
        <Card className="overflow-hidden flex flex-col h-full border-2 border-transparent hover:border-border transition-colors">
            <CardHeader className="p-3 bg-muted/30 text-xs text-muted-foreground flex flex-row justify-between">
                <span>Uploaded {image.createdAt ? formatDistanceToNow(new Date(image.createdAt)) : 'recently'} ago</span>
                <span>User: {image.userId || 'Unknown'}</span>
            </CardHeader>

            <div className="relative aspect-square bg-black/5">
                <SecureImage
                    imageId={image.id || ''}
                    className="w-full h-full object-contain"
                    alt={`Image ${image.id}`}
                />
                {/* Overlay Risk Badges */}
                {risks.length > 0 && (
                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                        {risks.map(cat => (
                            <Badge key={cat} variant="destructive" className="bg-red-500/90 hover:bg-red-600/90 text-[10px] px-1.5 py-0.5 backdrop-blur-sm">
                                <AlertTriangle className="w-3 h-3 mr-1 inline" />
                                {cat.toUpperCase()}: {visionData[cat]}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            <CardContent className="p-3 flex-grow">
                {/* Could show caption or other metadata here */}
                <div className="text-xs text-muted-foreground break-all">
                    ID: {image.id}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-[10px]">{image.status}</Badge>
                </div>
            </CardContent>

            <CardFooter className="p-3 pt-0 grid grid-cols-2 gap-2">
                <Button
                    variant="outline"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                    onClick={() => handleReview('REJECTED')}
                    disabled={isPending}
                >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                </Button>
                <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleReview('APPROVED')}
                    disabled={isPending}
                >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                </Button>
            </CardFooter>
        </Card>
    );
}

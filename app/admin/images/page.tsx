'use client';

import { usePendingImages } from '@/lib/hooks/useAdmin';
import { AdminImageCard } from '@/components/admin/AdminImageCard';
import { Loader2, RefreshCcw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminImageModerationPage() {
    const { data: images, isLoading, isError, refetch } = usePendingImages();

    // Assuming API returns array directly based on our service implementation
    // If it wraps in { data: [...] }, we need to adjust.
    // Based on `api/admin.ts` `return http.get(...)`, it returns whatever Axios interceptor returns.
    // Standard practice in this project seems to be data directly.
    const pendingImages = Array.isArray(images) ? images : [];

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Image Moderation</h1>
                    <p className="text-muted-foreground mt-1">Review user uploaded content for safety and guidelines.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                    <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Loader2 className="w-10 h-10 animate-spin mb-4" />
                    <p>Loading pending images...</p>
                </div>
            )}

            {isError && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-md border border-destructive/20 text-center">
                    Failed to load images. Please try again.
                </div>
            )}

            {!isLoading && !isError && pendingImages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                    <CheckCircle className="w-12 h-12 mb-4 text-green-500/50" />
                    <h3 className="text-lg font-medium text-foreground">All caught up!</h3>
                    <p>No pending images to review at this time.</p>
                </div>
            )}

            {!isLoading && pendingImages.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {pendingImages.map((image: any) => (
                        <AdminImageCard key={image.id} image={image} />
                    ))}
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { usePrivateImage } from '@/lib/hooks/useAdmin';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    imageId: string;
    fallbackSrc?: string;
}

/**
 * SecureImage Component
 * Fetches a Signed URL from the backend for a private image and renders it.
 * Handles loading state and errors.
 */
export function SecureImage({
    imageId,
    fallbackSrc = '/placeholder-image.jpg',
    className,
    alt,
    ...props
}: SecureImageProps) {

    const { data, isLoading, isError } = usePrivateImage(imageId);
    const [imgSrc, setImgSrc] = useState<string | null>(null);

    useEffect(() => {
        if (data?.url) {
            setImgSrc(data.url);
        }
    }, [data]);

    if (isLoading) {
        return (
            <div className={cn("flex items-center justify-center bg-muted animate-pulse", className)}>
                <ImageIcon className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
        );
    }

    if (isError || !imgSrc) {
        return (
            <div className={cn("flex items-center justify-center bg-muted/50", className)}>
                <AlertCircle className="w-6 h-6 text-destructive/50" />
            </div>
        );
    }

    return (
        <img
            src={imgSrc}
            alt={alt || "Private Image"}
            className={cn("object-cover", className)}
            onError={(e) => {
                // Fallback if the signed URL is expired or invalid
                e.currentTarget.src = fallbackSrc;
            }}
            {...props}
        />
    );
}

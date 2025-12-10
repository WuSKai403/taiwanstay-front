"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { uploadImage } from "@/lib/api/image";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    onRemove?: () => void;
    className?: string;
    disabled?: boolean;
    aspectRatio?: "square" | "video" | "auto";
}

export function ImageUpload({
    value,
    onChange,
    onRemove,
    className,
    disabled,
    aspectRatio = "square"
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error("Image size must be less than 5MB");
            return;
        }

        try {
            setIsUploading(true);
            const data = await uploadImage(file);
            if (data && data.publicUrl) {
                onChange(data.publicUrl);
                toast.success("Image uploaded");
            } else {
                toast.error("Failed to get image URL");
            }
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(error.message || "Failed to upload image");
        } finally {
            setIsUploading(false);
            // Reset input so same file can be selected again
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemove = () => {
        onChange("");
        onRemove?.();
    };

    return (
        <div className={cn("space-y-4 w-full", className)}>
            {value ? (
                <div className={cn(
                    "relative overflow-hidden rounded-md border bg-muted group",
                    aspectRatio === "square" ? "aspect-square" : aspectRatio === "video" ? "aspect-video" : "h-64"
                )}>
                    <img
                        src={value}
                        alt="Upload"
                        className="object-cover w-full h-full"
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            type="button"
                            onClick={handleRemove}
                            variant="destructive"
                            size="icon"
                            disabled={disabled}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        "relative flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 rounded-lg cursor-pointer transition-colors bg-muted/5",
                        aspectRatio === "square" ? "aspect-square" : aspectRatio === "video" ? "aspect-video" : "h-64",
                        disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                    )}
                >
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleUpload}
                        disabled={disabled || isUploading}
                    />

                    {isUploading ? (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span>Uploading...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <div className="p-4 rounded-full bg-muted">
                                <Upload className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                                <span className="font-semibold text-primary">Click to upload</span>
                                <span className="block text-xs mt-1">or drag and drop</span>
                            </div>
                            <span className="text-xs text-muted-foreground/75">
                                JPG, PNG, WEBP up to 5MB
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { useSession } from "next-auth/react";

interface ImageUploadProps {
    value?: string; // URL or ID
    onChange: (value: string) => void;
    onImageUploaded?: (image: any) => void;
    className?: string;
}

export function ImageUpload({ value, onChange, onImageUploaded, className }: ImageUploadProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { data: session } = useSession();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        const formData = new FormData();
        formData.append("image", file);

        try {
            const res = await api.post("/images/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            const image = res.data;

            // If approved, use publicUrl. If pending, use private endpoint or blob preview
            let url = image.publicUrl;
            if (image.status !== "APPROVED") {
                // For immediate feedback, we can use a local blob URL or the private endpoint
                // Using private endpoint ensures we test the flow
                // url = `/api/v1/images/private/${image.id}`;
                // But since we are in frontend, we need to call our Next.js API proxy or direct backend
                // Let's use the backend URL directly if we have the token, but <img> tag can't send headers easily.
                // So we might need a frontend proxy or just use the local blob for preview until page refresh.
                url = URL.createObjectURL(file);
            }

            setPreviewUrl(url);
            onChange(image.publicUrl || image.id); // Prefer publicUrl, fallback to ID
            if (onImageUploaded) onImageUploaded(image);

        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = () => {
        setPreviewUrl(null);
        onChange("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className={className}>
            <Input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />

            {!previewUrl ? (
                <Button
                    type="button"
                    variant="outline"
                    className="w-full h-32 border-dashed flex flex-col gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        <>
                            <Upload className="w-6 h-6" />
                            <span>Upload Image</span>
                        </>
                    )}
                </Button>
            ) : (
                <div className="relative w-full h-64 rounded-lg overflow-hidden border">
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                    />
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemove}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                    {isLoading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

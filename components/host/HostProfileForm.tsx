"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ImageUpload } from "@/components/common/ImageUpload";
import { Host } from "@/lib/api/host";
import { useToast } from "@/hooks/use-toast";

const hostProfileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    photos: z.array(z.string()).optional(),
});

type HostProfileFormValues = z.infer<typeof hostProfileSchema>;

interface HostProfileFormProps {
    initialData?: Host;
    onSubmit: (values: HostProfileFormValues) => Promise<void>;
    isLoading?: boolean;
}

export function HostProfileForm({ initialData, onSubmit, isLoading }: HostProfileFormProps) {
    const form = useForm<HostProfileFormValues>({
        resolver: zodResolver(hostProfileSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            city: initialData?.location?.city || "",
            country: initialData?.location?.country || "Taiwan",
            photos: initialData?.photos?.map(p => p.secureUrl || "").filter(Boolean) || [],
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Organization / Host Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Sunny Surf Hostel" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                    <Input placeholder="Hengchun" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Country</FormLabel>
                                <FormControl>
                                    <Input placeholder="Taiwan" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Tell us about your organization..."
                                    className="min-h-[150px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="photos"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Main Photo</FormLabel>
                            <FormControl>
                                <ImageUpload
                                    value={field.value?.[0]}
                                    onChange={(url) => {
                                        // Simple logic: just replace the first photo or add it
                                        const current = field.value || [];
                                        if (current.length > 0) {
                                            field.onChange([url, ...current.slice(1)]);
                                        } else {
                                            field.onChange([url]);
                                        }
                                    }}
                                    onRemove={() => {
                                        const current = field.value || [];
                                        field.onChange(current.slice(1));
                                    }}
                                    aspectRatio="video"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-4">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save Profile"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

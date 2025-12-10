"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/common/ImageUpload";
import { Opportunity } from "@/lib/schemas/opportunity";

const formSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    description: z.string().min(20, "Description must be at least 20 characters"),
    type: z.string(),
    city: z.string().min(2, "City is required"),
    country: z.string().min(2, "Country is required"),
    coverImage: z.string().optional(),
});

export type OpportunityFormValues = z.infer<typeof formSchema>;

interface OpportunityFormProps {
    initialData?: Opportunity;
    onSubmit: (values: OpportunityFormValues) => Promise<void>;
    isLoading?: boolean;
    submitLabel?: string;
}

export function OpportunityForm({ initialData, onSubmit, isLoading, submitLabel = "Submit" }: OpportunityFormProps) {
    const defaultValues: Partial<OpportunityFormValues> = {
        title: initialData?.title || "",
        description: initialData?.description || "",
        type: initialData?.type || "HOSTEL_HELP",
        city: initialData?.location?.city || "",
        country: initialData?.location?.country || "Taiwan",
        coverImage: initialData?.media?.coverImage?.secureUrl || "",
    };

    const form = useForm<OpportunityFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues,
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Surf Hostel Helper" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="HOSTEL_HELP">Hostel Help</SelectItem>
                                    <SelectItem value="FARM_STAY">Farm Stay</SelectItem>
                                    <SelectItem value="LANGUAGE_EXCHANGE">Language Exchange</SelectItem>
                                    <SelectItem value="ART_PROJECT">Art Project</SelectItem>
                                </SelectContent>
                            </Select>
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
                                    placeholder="Describe the role, accommodation, and what you offer..."
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
                    name="coverImage"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cover Image</FormLabel>
                            <FormControl>
                                <ImageUpload
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-4">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Saving..." : submitLabel}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

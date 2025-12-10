"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ApplicationFormData, applicationSchema } from "@/lib/schemas/application";
import { Loader2 } from "lucide-react";

// Simplified schema for the modal form - we only collect specific details here
// The main schema has standard ISO strings for dates, but input type="date" returns YYYY-MM-DD which is compatible
const applyFormSchema = z.object({
    message: z.string().min(50, "Please provide at least 50 characters describing why you want to apply."),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Required format: YYYY-MM-DD"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Required format: YYYY-MM-DD"),
}).refine(data => new Date(data.startDate) < new Date(data.endDate), {
    message: "End date must be after start date",
    path: ["endDate"]
});

type ApplyFormValues = z.infer<typeof applyFormSchema>;

interface ApplicationApplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ApplyFormValues) => void;
    isSubmitting: boolean;
    opportunityTitle?: string;
}

export function ApplicationApplyModal({ isOpen, onClose, onSubmit, isSubmitting, opportunityTitle }: ApplicationApplyModalProps) {
    const form = useForm<ApplyFormValues>({
        resolver: zodResolver(applyFormSchema),
        defaultValues: {
            message: "",
            startDate: "",
            endDate: "",
        },
    });

    const handleSubmit = (data: ApplyFormValues) => {
        onSubmit(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Apply for {opportunityTitle || "Opportunity"}</DialogTitle>
                    <DialogDescription>
                        Introduce yourself to the host and let them know when you can help.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>End Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Message to Host</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Hi, I'm [Name]. I love your project because..."
                                            className="min-h-[150px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Share your skills, previous experience, and why you are a good fit.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Application
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

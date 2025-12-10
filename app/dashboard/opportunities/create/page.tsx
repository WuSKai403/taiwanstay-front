"use client";

import { OpportunityForm, OpportunityFormValues } from "@/components/opportunity/OpportunityForm";
import { useCreateOpportunity } from "@/lib/hooks/useOpportunities";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CreateOpportunityPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { mutate: createOpportunity, isPending } = useCreateOpportunity();

    const onSubmit = async (values: OpportunityFormValues) => {
        const payload = {
            title: values.title,
            description: values.description,
            shortDescription: values.description.substring(0, 150),
            type: values.type,
            location: {
                city: values.city,
                country: values.country,
            },
            media: {
                coverImage: {
                    url: values.coverImage,
                }
            }
        };

        createOpportunity(payload as any, {
            onSuccess: () => {
                toast({ title: "Opportunity created successfully" });
                router.push("/dashboard/opportunities");
            },
            onError: (error) => {
                console.error(error);
                toast({ title: "Failed to create opportunity", variant: "destructive" });
            }
        });
    };

    return (
        <div className="container max-w-2xl py-10 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/opportunities"><ArrowLeft className="w-4 h-4" /></Link>
                </Button>
                <h1 className="text-3xl font-bold">Post a New Opportunity</h1>
            </div>

            <OpportunityForm onSubmit={onSubmit} isLoading={isPending} submitLabel="Create Opportunity" />
        </div>
    );
}

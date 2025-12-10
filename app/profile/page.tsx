"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMyProfile, useUpdateProfile } from "@/lib/hooks/useProfile";
import { profileSchema, ProfileFormData } from "@/lib/schemas/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User, Save } from "lucide-react";
// import ImageUpload from "@/components/common/ImageUpload"; // Assuming it exists and works, or I will use Input for URL first to be safe

export default function ProfilePage() {
    const { data: profile, isLoading } = useMyProfile();
    const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();

    const form = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            // Set simple defaults, will reset when data loads
            bio: "",
            phoneNumber: "",
            languages: [],
            skills: [],
            personalInfo: {
                nationality: "",
                occupation: "",
            },
            socialMedia: {
                instagram: "",
                facebook: "",
            }
        },
    });

    // Populate form when data loads
    useEffect(() => {
        if (profile) {
            form.reset({
                bio: profile.bio || "",
                phoneNumber: profile.phoneNumber || "",
                // Ensure arrays are initialized
                languages: profile.languages || [],
                skills: profile.skills || [],
                personalInfo: {
                    nationality: profile.personalInfo?.nationality || "",
                    occupation: profile.personalInfo?.occupation || "",
                    birthdate: profile.personalInfo?.birthdate || "",
                    gender: profile.personalInfo?.gender || "",
                    currentLocation: profile.personalInfo?.currentLocation || "",
                },
                socialMedia: {
                    instagram: profile.socialMedia?.instagram || "",
                    facebook: profile.socialMedia?.facebook || "",
                },
                // Add other fields as needed
            });
        }
    }, [profile, form]);

    const onSubmit = (data: ProfileFormData) => {
        updateProfile(data as any); // Type cast if slight mismatch between Form and API types
    };

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="container py-10 max-w-4xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
                    <p className="text-muted-foreground">Manage your personal information and how hosts see you.</p>
                </div>
                <Button onClick={form.handleSubmit(onSubmit)} disabled={isUpdating} size="lg">
                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Share a bit about yourself with the community.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* Avatar - Placeholder for ImageUpload */}
                            {/* <div className="flex flex-col gap-2">
                                <FormLabel>Profile Picture</FormLabel>
                                <div className="flex items-center gap-4">
                                     <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
                                        {profile?.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-muted-foreground" />}
                                     </div>
                                     <Button variant="outline" type="button">Change Photo</Button>
                                </div>
                            </div> */}

                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+886 912 345 678" {...field} />
                                        </FormControl>
                                        <FormDescription>Hosts may use this to contact you after acceptance.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bio / Introduction</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Tell us about your hobbies, travel experience, and why you want to volunteer..."
                                                className="min-h-[120px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Personal Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="personalInfo.nationality"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nationality</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Taiwan" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="personalInfo.occupation"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Occupation</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Student, Designer" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="personalInfo.currentLocation"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Current Location</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Where are you now?" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Skills & Languages */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Skills & Languages</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="skills"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Skills (Comma separated)</FormLabel>
                                        <FormControl>
                                            {/* Simple implementation: text input to array */}
                                            <Input
                                                placeholder="Photography, Cooking, Gardening..."
                                                value={field.value?.join(", ") || ""}
                                                onChange={e => field.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                                            />
                                        </FormControl>
                                        <FormDescription>List skills that might be helpful for hosts.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="languages"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Languages (Comma separated)</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="English, Mandarin, Japanese..."
                                                value={field.value?.join(", ") || ""}
                                                onChange={e => field.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Social Media */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Social Media</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="socialMedia.instagram"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Instagram</FormLabel>
                                        <FormControl>
                                            <Input placeholder="@username" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="socialMedia.facebook"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Facebook</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Profile URL" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                </form>
            </Form>
        </div>
    );
}

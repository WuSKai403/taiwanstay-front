import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturedSection } from "@/components/landing/FeaturedSection";
import { HowItWorks } from "@/components/landing/HowItWorks";

export default function Home() {
    return (
        <main className="min-h-screen">
            <HeroSection />
            <FeaturedSection />
            <HowItWorks />
        </main>
    );
}

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function HeroSection() {
    const [search, setSearch] = useState("");
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/opportunities?keyword=${encodeURIComponent(search)}`);
    };

    return (
        <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
            {/* Background Image / Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=2670&auto=format&fit=crop"
                    alt="Taiwan Coast"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-blue-900/60 mix-blend-multiply" />
            </div>

            {/* Content */}
            <div className="relative z-10 container text-center px-4">
                <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg">
                    Experience Real <span className="text-[#FFD700]">Taiwan</span>
                </h1>
                <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-md font-medium">
                    Exchange your skills for accommodation and meals in sunny Southern Taiwan.
                </p>

                {/* Search Box */}
                <form onSubmit={handleSearch} className="max-w-3xl mx-auto bg-white rounded-full p-2 pl-6 flex flex-col md:flex-row items-center shadow-2xl">
                    <div className="flex-grow w-full md:w-auto mb-2 md:mb-0">
                        <Input
                            type="text"
                            placeholder="What are you looking for? (e.g. Surfing, Teaching)"
                            className="border-0 shadow-none focus-visible:ring-0 text-lg py-6"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full md:w-auto rounded-full px-8 py-6 text-lg font-bold bg-[#006994] hover:bg-[#005a80] text-white"
                    >
                        <Search className="mr-2 h-5 w-5" />
                        Search
                    </Button>
                </form>

                <div className="mt-8 flex justify-center gap-4 text-white/80 text-sm font-medium">
                    <span>Popular:</span>
                    <Link href="/opportunities?type=HOSTEL_HELP" className="hover:text-[#FFD700] hover:underline">Hostel Help</Link>
                    <Link href="/opportunities?type=FARM_STAY" className="hover:text-[#FFD700] hover:underline">Farm Stay</Link>
                    <Link href="/opportunities?type=LANGUAGE_EXCHANGE" className="hover:text-[#FFD700] hover:underline">Language Exchange</Link>
                </div>
            </div>
        </section>
    );
}

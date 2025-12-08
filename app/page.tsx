import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Sun, Waves, Palmtree, ArrowRight, Heart, Users, Shield } from "lucide-react";

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative h-[600px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1533240332313-0db49b459ad6?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
                <div className="container relative z-10 text-center space-y-6 px-4">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight drop-shadow-lg">
                        Experience the Real Taiwan
                    </h1>
                    <p className="text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md text-primary-50">
                        Connect with local hosts, exchange skills for accommodation, and immerse yourself in the vibrant culture of Southern Taiwan.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <Button size="lg" className="bg-secondary hover:bg-secondary-600 text-secondary-foreground font-bold text-lg px-8 py-6 rounded-full shadow-lg transition-transform hover:scale-105" asChild>
                            <Link href="/opportunities">Find Opportunities</Link>
                        </Button>
                        <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm border-white text-white hover:bg-white/20 font-semibold text-lg px-8 py-6 rounded-full" asChild>
                            <Link href="/hosts">Become a Host</Link>
                        </Button>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent"></div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-background">
                <div className="container px-4">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-bold text-primary-900">Why TaiwanStay?</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            We're more than just a platform. We're a community dedicated to authentic cultural exchange and sustainable travel.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Card className="border-none shadow-soft hover:shadow-lg transition-shadow duration-300">
                            <CardContent className="p-8 text-center space-y-4">
                                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto text-primary-600">
                                    <Waves className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Ocean & Nature</h3>
                                <p className="text-muted-foreground">
                                    From surfing in Kenting to diving in Green Island. Discover hidden gems and breathtaking landscapes.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-soft hover:shadow-lg transition-shadow duration-300">
                            <CardContent className="p-8 text-center space-y-4">
                                <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto text-secondary-600">
                                    <Sun className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Warm Hospitality</h3>
                                <p className="text-muted-foreground">
                                    Experience the famous Taiwanese friendliness. Live like a local and build lifelong friendships.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-soft hover:shadow-lg transition-shadow duration-300">
                            <CardContent className="p-8 text-center space-y-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                                    <Palmtree className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Cultural Exchange</h3>
                                <p className="text-muted-foreground">
                                    Share your skills, learn new languages, and contribute to local communities in meaningful ways.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Popular Destinations */}
            <section className="py-20 bg-primary-50">
                <div className="container px-4">
                    <div className="flex justify-between items-end mb-12">
                        <div className="space-y-2">
                            <h2 className="text-3xl md:text-4xl font-bold text-primary-900">Popular Destinations</h2>
                            <p className="text-muted-foreground">Explore the most sought-after locations in Southern Taiwan.</p>
                        </div>
                        <Button variant="link" className="text-primary font-semibold hidden md:flex items-center gap-2" asChild>
                            <Link href="/opportunities">View all <ArrowRight className="w-4 h-4" /></Link>
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { name: "Kenting", image: "https://images.unsplash.com/photo-1542042958-3b313a488190?q=80&w=2670&auto=format&fit=crop", count: "45+ Hosts" },
                            { name: "Hengchun", image: "https://images.unsplash.com/photo-1571474004502-c18476e81579?q=80&w=2574&auto=format&fit=crop", count: "32+ Hosts" },
                            { name: "Taitung", image: "https://images.unsplash.com/photo-1470004914212-05527e49370b?q=80&w=2674&auto=format&fit=crop", count: "28+ Hosts" },
                            { name: "Green Island", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2673&auto=format&fit=crop", count: "15+ Hosts" },
                        ].map((dest, index) => (
                            <Link href={`/opportunities?location=${dest.name}`} key={index} className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 aspect-[3/4]">
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors z-10"></div>
                                <img src={dest.image} alt={dest.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute bottom-0 left-0 p-6 z-20 text-white">
                                    <h3 className="text-2xl font-bold mb-1">{dest.name}</h3>
                                    <p className="text-sm font-medium opacity-90 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {dest.count}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="mt-8 text-center md:hidden">
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/opportunities">View all destinations</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Trust & Safety */}
            <section className="py-20 bg-background">
                <div className="container px-4">
                    <div className="bg-primary-900 rounded-3xl p-8 md:p-16 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary-700 rounded-full opacity-50 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-secondary-500 rounded-full opacity-20 blur-3xl"></div>

                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <h2 className="text-3xl md:text-4xl font-bold">Travel with Confidence</h2>
                                <p className="text-primary-100 text-lg">
                                    Your safety is our priority. We verify every host and provide 24/7 support to ensure you have a worry-free experience.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3">
                                        <div className="bg-primary-800 p-2 rounded-full"><Shield className="w-5 h-5 text-secondary" /></div>
                                        <span>Verified Hosts & Travelers</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="bg-primary-800 p-2 rounded-full"><Heart className="w-5 h-5 text-secondary" /></div>
                                        <span>Community Reviews & Ratings</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="bg-primary-800 p-2 rounded-full"><Users className="w-5 h-5 text-secondary" /></div>
                                        <span>Dedicated Support Team</span>
                                    </li>
                                </ul>
                                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary-600 font-bold mt-4" asChild>
                                    <Link href="/safety">Learn more about safety</Link>
                                </Button>
                            </div>
                            <div className="hidden md:block">
                                <img src="https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2670&auto=format&fit=crop" alt="Safe Travel" className="rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

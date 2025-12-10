import { Search, Send, Plane } from "lucide-react";

export function HowItWorks() {
    const steps = [
        {
            icon: Search,
            title: "Find Opportunity",
            desc: "Browse through hundreds of hosts in beautiful Southern Taiwan."
        },
        {
            icon: Send,
            title: "Apply Online",
            desc: "Connect with hosts, share your skills, and get approved."
        },
        {
            icon: Plane,
            title: "Start Journey",
            desc: "Pack your bags and experience the real local life."
        }
    ];

    return (
        <section className="py-20 bg-white">
            <div className="container px-4 text-center">
                <h2 className="text-3xl font-bold text-[#006994] mb-12">How It Works</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {steps.map((step, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full bg-[#E0F7FA] flex items-center justify-center mb-6 text-[#006994]">
                                <step.icon className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                            <p className="text-muted-foreground max-w-xs mx-auto">
                                {step.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

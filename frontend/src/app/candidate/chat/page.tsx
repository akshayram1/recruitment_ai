"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import dynamic from "next/dynamic";

// Lazy load the heavy C1ChatContainer component
const C1ChatContainer = dynamic(
    () => import("@/components/thesys/c1-chat-container"),
    {
        loading: () => (
            <div className="flex items-center justify-center h-full bg-neutral-950">
                <div className="text-center">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin mx-auto mb-6" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-purple-400" />
                        </div>
                    </div>
                    <p className="text-white/60 text-lg">Loading AI Assistant...</p>
                    <p className="text-white/40 text-sm mt-2">This may take a moment</p>
                </div>
            </div>
        ),
        ssr: false,
    }
);

export default function CandidateChatPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading } = useAuth();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, loading, router]);

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                    <p className="text-white/60">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/10 flex-shrink-0 bg-neutral-950/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16">
                        <Link
                            href="/candidate"
                            className="flex items-center text-white/60 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            Back
                        </Link>
                        <div className="ml-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <h1 className="text-lg font-semibold text-white">
                                AI Career Assistant
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Chat Container */}
            <main className="relative z-10 flex-1 overflow-hidden">
                <C1ChatContainer userRole="candidate" />
            </main>
        </div>
    );
}

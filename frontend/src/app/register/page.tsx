"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Users, Briefcase, ArrowLeft, Loader2, Mail, Lock, User, Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { register } = useAuth();

    const [role, setRole] = useState<"candidate" | "recruiter">(
        (searchParams.get("role") as "candidate" | "recruiter") || "candidate"
    );
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        company: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (role === "recruiter" && !formData.company) {
            setError("Company name is required for recruiters");
            return;
        }

        setLoading(true);

        try {
            await register({
                email: formData.email,
                password: formData.password,
                name: formData.name,
                company: role === "recruiter" ? formData.company : undefined,
                role,
            });

            router.push(role === "candidate" ? "/candidate" : "/recruiter");
        } catch (err: any) {
            setError(err.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Back Link */}
                <Link
                    href="/"
                    className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                </Link>

                {/* Card */}
                <div className="relative p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10">
                    <div className="relative">
                        {/* Logo */}
                        <div className="flex items-center justify-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                                <Sparkles className="h-6 w-6 text-white" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-center text-white mb-2">
                            Create your account
                        </h1>
                        <p className="text-center text-white/50 mb-8">
                            Join RecruitAI today
                        </p>

                        {/* Role Toggle */}
                        <div className="flex bg-white/5 rounded-2xl p-1.5 mb-6 border border-white/10">
                            <button
                                type="button"
                                onClick={() => setRole("candidate")}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${role === "candidate"
                                    ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25"
                                    : "text-white/60 hover:text-white"
                                    }`}
                            >
                                <Users className="h-4 w-4" />
                                Candidate
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole("recruiter")}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${role === "recruiter"
                                    ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/25"
                                    : "text-white/60 hover:text-white"
                                    }`}
                            >
                                <Briefcase className="h-4 w-4" />
                                Recruiter
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-white/70 mb-2"
                                >
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                                    <input
                                        type="text"
                                        id="name"
                                        required
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-white/70 mb-2"
                                >
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                                    <input
                                        type="email"
                                        id="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                        className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            {role === "recruiter" && (
                                <div className="animate-fade-in">
                                    <label
                                        htmlFor="company"
                                        className="block text-sm font-medium text-white/70 mb-2"
                                    >
                                        Company Name
                                    </label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                                        <input
                                            type="text"
                                            id="company"
                                            required
                                            value={formData.company}
                                            onChange={(e) =>
                                                setFormData({ ...formData, company: e.target.value })
                                            }
                                            className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                            placeholder="Acme Inc."
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-white/70 mb-2"
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                                    <input
                                        type="password"
                                        id="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) =>
                                            setFormData({ ...formData, password: e.target.value })
                                        }
                                        className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="confirmPassword"
                                    className="block text-sm font-medium text-white/70 mb-2"
                                >
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) =>
                                            setFormData({ ...formData, confirmPassword: e.target.value })
                                        }
                                        className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 rounded-xl font-semibold text-white transition-all shadow-lg ${role === "candidate"
                                    ? "bg-gradient-to-r from-purple-500 to-purple-600 shadow-purple-500/25 hover:opacity-90"
                                    : "bg-gradient-to-r from-cyan-500 to-cyan-600 shadow-cyan-500/25 hover:opacity-90"
                                    } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        Creating Account...
                                    </span>
                                ) : (
                                    "Create Account"
                                )}
                            </button>
                        </form>

                        <p className="text-center text-white/50 mt-8">
                            Already have an account?{" "}
                            <Link
                                href="/login"
                                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}

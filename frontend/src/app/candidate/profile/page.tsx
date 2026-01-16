"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Loader2, Check, FileText, Sparkles, Briefcase, GraduationCap, Code } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import FileUpload from "@/components/ui/file-upload";

export default function CandidateProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    const [resume, setResume] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, authLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchResume();
        }
    }, [isAuthenticated]);

    const fetchResume = async () => {
        try {
            const response = await api.get("/candidate/resume");
            setResume(response.data);
        } catch (err: any) {
            if (err.response?.status !== 404) {
                setError("Failed to fetch resume");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        setError("");
        setSuccess("");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await api.post("/candidate/resume/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setResume(response.data);
            setSuccess("Resume uploaded successfully!");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to upload resume");
        } finally {
            setUploading(false);
        }
    };

    if (authLoading || loading) {
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
        <div className="min-h-screen bg-neutral-950 text-white">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16">
                        <Link
                            href="/candidate"
                            className="flex items-center text-white/60 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-white mb-2">Your Profile</h1>
                <p className="text-white/50 mb-8">Manage your resume and profile details</p>

                {/* Upload Section */}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <Upload className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">
                                {resume ? "Update Resume" : "Upload Resume"}
                            </h2>
                            <p className="text-white/50 text-sm">PDF or DOCX files supported</p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-4">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center mb-4">
                            <Check className="h-5 w-5 mr-2" />
                            {success}
                        </div>
                    )}

                    <FileUpload
                        onUpload={handleFileUpload}
                        uploading={uploading}
                        accept=".pdf,.docx"
                    />
                </div>

                {/* Resume Preview */}
                {resume && (
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-cyan-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">
                                        Resume Details
                                    </h2>
                                    {resume.file_name && (
                                        <p className="text-white/50 text-sm">{resume.file_name}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Name & Contact */}
                            {resume.parsed_data?.name && (
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <h3 className="text-xl font-semibold text-white mb-1">
                                        {resume.parsed_data.name}
                                    </h3>
                                    <p className="text-white/50">
                                        {resume.parsed_data.email} {resume.parsed_data.phone && `• ${resume.parsed_data.phone}`}
                                    </p>
                                </div>
                            )}

                            {/* Summary */}
                            {resume.parsed_data?.summary && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles className="h-5 w-5 text-purple-400" />
                                        <h4 className="font-medium text-white">Summary</h4>
                                    </div>
                                    <p className="text-white/60 leading-relaxed">{resume.parsed_data.summary}</p>
                                </div>
                            )}

                            {/* Skills */}
                            {resume.parsed_data?.skills?.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Code className="h-5 w-5 text-cyan-400" />
                                        <h4 className="font-medium text-white">Skills</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {resume.parsed_data.skills.map((skill: string, index: number) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-lg text-sm border border-purple-500/20"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Experience */}
                            {resume.parsed_data?.experience?.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Briefcase className="h-5 w-5 text-emerald-400" />
                                        <h4 className="font-medium text-white">Experience</h4>
                                    </div>
                                    <div className="space-y-4">
                                        {resume.parsed_data.experience.map((exp: any, index: number) => (
                                            <div key={index} className="pl-4 border-l-2 border-emerald-500/30">
                                                <h5 className="font-medium text-white">
                                                    {exp.title} at {exp.company}
                                                </h5>
                                                <p className="text-white/40 text-sm mb-2">{exp.duration}</p>
                                                {exp.description && (
                                                    <p className="text-white/60 text-sm">{exp.description}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Education */}
                            {resume.parsed_data?.education?.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <GraduationCap className="h-5 w-5 text-amber-400" />
                                        <h4 className="font-medium text-white">Education</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {resume.parsed_data.education.map((edu: any, index: number) => (
                                            <div key={index}>
                                                <h5 className="font-medium text-white">{edu.degree}</h5>
                                                <p className="text-white/50 text-sm">
                                                    {edu.institution} {edu.year && `• ${edu.year}`}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

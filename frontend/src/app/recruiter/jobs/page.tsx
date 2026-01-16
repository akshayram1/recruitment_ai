"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Plus, Trash2, Briefcase, MapPin, DollarSign, Calendar, Code } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import FileUpload from "@/components/ui/file-upload";

export default function RecruiterJobsPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, authLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchJobs();
        }
    }, [isAuthenticated]);

    const fetchJobs = async () => {
        try {
            const response = await api.get("/recruiter/jobs");
            setJobs(response.data);
        } catch (err: any) {
            setError("Failed to fetch jobs");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await api.post("/recruiter/job/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setJobs([response.data, ...jobs]);
            setShowUpload(false);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to upload job description");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteJob = async (jobId: string) => {
        if (!confirm("Are you sure you want to delete this job?")) return;

        try {
            await api.delete(`/recruiter/job/${jobId}`);
            setJobs(jobs.filter((job) => job.id !== jobId));
        } catch (err: any) {
            setError("Failed to delete job");
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                    <p className="text-white/60">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link
                            href="/recruiter"
                            className="flex items-center text-white/60 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            Back to Dashboard
                        </Link>
                        <button
                            onClick={() => setShowUpload(!showUpload)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl font-medium text-white hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/25"
                        >
                            <Plus className="h-5 w-5" />
                            Add Job
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-white mb-2">Job Postings</h1>
                <p className="text-white/50 mb-8">Manage your job listings and find the best candidates</p>

                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
                        {error}
                    </div>
                )}

                {/* Upload Section */}
                {showUpload && (
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-8 animate-fade-in">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                <Upload className="h-6 w-6 text-cyan-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">
                                    Upload Job Description
                                </h2>
                                <p className="text-white/50 text-sm">PDF, DOCX, or TXT files supported</p>
                            </div>
                        </div>
                        <FileUpload
                            onUpload={handleFileUpload}
                            uploading={uploading}
                            accept=".pdf,.docx,.txt"
                        />
                    </div>
                )}

                {/* Jobs List */}
                {jobs.length === 0 ? (
                    <div className="p-12 rounded-2xl bg-white/5 border border-white/10 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                            <Briefcase className="h-8 w-8 text-cyan-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            No jobs posted yet
                        </h3>
                        <p className="text-white/50 mb-6">
                            Upload a job description to get started finding candidates
                        </p>
                        <button
                            onClick={() => setShowUpload(true)}
                            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl font-medium text-white hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/25"
                        >
                            Add Your First Job
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {jobs.map((job, index) => (
                            <div
                                key={job.id}
                                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all animate-fade-in"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                                                <Briefcase className="h-6 w-6 text-cyan-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-semibold text-white mb-2">
                                                    {job.parsed_data?.title || "Untitled Position"}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-4 text-white/50 text-sm mb-4">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-4 w-4" />
                                                        {job.parsed_data?.location || "Location not specified"}
                                                    </span>
                                                    {job.parsed_data?.salary_range && (
                                                        <span className="flex items-center gap-1">
                                                            <DollarSign className="h-4 w-4" />
                                                            {job.parsed_data.salary_range}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-4 w-4" />
                                                        {new Date(job.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                {/* Skills */}
                                                {job.parsed_data?.required_skills?.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {job.parsed_data.required_skills.slice(0, 5).map(
                                                            (skill: string, idx: number) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg text-sm border border-cyan-500/20"
                                                                >
                                                                    {skill}
                                                                </span>
                                                            )
                                                        )}
                                                        {job.parsed_data.required_skills.length > 5 && (
                                                            <span className="px-3 py-1 bg-white/5 text-white/50 rounded-lg text-sm border border-white/10">
                                                                +{job.parsed_data.required_skills.length - 5} more
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDeleteJob(job.id)}
                                        className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                        title="Delete job"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

"use client";

import { User, Mail, Briefcase, Award } from "lucide-react";
import { CandidateCardData } from "@/types";

interface CandidateCardProps {
    data: CandidateCardData;
}

export default function CandidateCard({ data }: CandidateCardProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{data.name}</h3>
                        {data.email && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Mail className="h-3 w-3" />
                                {data.email}
                            </div>
                        )}
                    </div>
                </div>
                {data.match_score !== undefined && (
                    <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${data.match_score >= 80
                                ? "bg-green-100 text-green-700"
                                : data.match_score >= 60
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                    >
                        {data.match_score}% Match
                    </div>
                )}
            </div>

            {data.summary && (
                <p className="text-sm text-gray-600 mb-3">{data.summary}</p>
            )}

            {data.experience_years !== undefined && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Briefcase className="h-4 w-4" />
                    <span>{data.experience_years} years experience</span>
                </div>
            )}

            {data.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {data.skills.slice(0, 6).map((skill, index) => (
                        <span
                            key={index}
                            className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs"
                        >
                            {skill}
                        </span>
                    ))}
                    {data.skills.length > 6 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                            +{data.skills.length - 6} more
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

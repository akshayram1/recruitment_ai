"use client";

import { Building2, MapPin, DollarSign, Briefcase } from "lucide-react";
import { JobCardData } from "@/types";

interface JobCardProps {
    data: JobCardData;
}

export default function JobCard({ data }: JobCardProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{data.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Building2 className="h-4 w-4" />
                        <span>{data.company}</span>
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

            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                {data.location && (
                    <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{data.location}</span>
                    </div>
                )}
                {data.salary_range && (
                    <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{data.salary_range}</span>
                    </div>
                )}
            </div>

            {data.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {data.description}
                </p>
            )}

            {data.required_skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {data.required_skills.slice(0, 6).map((skill, index) => (
                        <span
                            key={index}
                            className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs"
                        >
                            {skill}
                        </span>
                    ))}
                    {data.required_skills.length > 6 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                            +{data.required_skills.length - 6} more
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

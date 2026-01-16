"use client";

import { CheckCircle, AlertCircle, Info } from "lucide-react";
import { MatchSummaryData } from "@/types";

interface MatchSummaryProps {
    data: MatchSummaryData;
}

export default function MatchSummary({ data }: MatchSummaryProps) {
    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-yellow-600";
        if (score >= 40) return "text-orange-600";
        return "text-red-600";
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return "bg-green-100";
        if (score >= 60) return "bg-yellow-100";
        if (score >= 40) return "bg-orange-100";
        return "bg-red-100";
    };

    const getScoreIcon = (score: number) => {
        if (score >= 70) {
            return <CheckCircle className="h-5 w-5 text-green-500" />;
        }
        if (score >= 40) {
            return <Info className="h-5 w-5 text-yellow-500" />;
        }
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            {/* Overall Score */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Match Summary</h3>
                <div
                    className={`px-4 py-2 rounded-full ${getScoreBg(
                        data.overall_score
                    )} ${getScoreColor(data.overall_score)} font-bold text-lg`}
                >
                    {data.overall_score}%
                </div>
            </div>

            {/* Breakdown */}
            {data.breakdown && data.breakdown.length > 0 && (
                <div className="space-y-3 mb-4">
                    {data.breakdown.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                            {getScoreIcon(item.score)}
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">
                                        {item.category}
                                    </span>
                                    <span
                                        className={`text-sm font-medium ${getScoreColor(
                                            item.score
                                        )}`}
                                    >
                                        {item.score}%
                                    </span>
                                </div>
                                {item.notes && (
                                    <p className="text-xs text-gray-500 mt-0.5">{item.notes}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Recommendation */}
            {data.recommendation && (
                <div className="bg-indigo-50 rounded-lg p-3 mt-4">
                    <p className="text-sm text-indigo-800">
                        <span className="font-medium">AI Recommendation:</span>{" "}
                        {data.recommendation}
                    </p>
                </div>
            )}
        </div>
    );
}

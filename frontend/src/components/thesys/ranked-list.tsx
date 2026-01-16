"use client";

import { Trophy, Medal, Award } from "lucide-react";
import { RankedListData } from "@/types";

interface RankedListProps {
    data: RankedListData;
}

export default function RankedList({ data }: RankedListProps) {
    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="h-5 w-5 text-yellow-500" />;
            case 2:
                return <Medal className="h-5 w-5 text-gray-400" />;
            case 3:
                return <Award className="h-5 w-5 text-amber-600" />;
            default:
                return (
                    <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-gray-500">
                        {rank}
                    </span>
                );
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "bg-green-100 text-green-700";
        if (score >= 60) return "bg-yellow-100 text-yellow-700";
        if (score >= 40) return "bg-orange-100 text-orange-700";
        return "bg-gray-100 text-gray-700";
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">{data.title}</h3>

            <div className="space-y-3">
                {data.items.map((item, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div className="flex-shrink-0">{getRankIcon(item.rank)}</div>

                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{item.name}</p>
                            {item.details && (
                                <p className="text-sm text-gray-500 truncate">{item.details}</p>
                            )}
                        </div>

                        <div
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(
                                item.score
                            )}`}
                        >
                            {item.score}%
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

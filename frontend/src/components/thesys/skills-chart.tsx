"use client";

import { SkillsChartData } from "@/types";

interface SkillsChartProps {
    data: SkillsChartData;
}

export default function SkillsChart({ data }: SkillsChartProps) {
    const getLevelLabel = (level: number) => {
        switch (level) {
            case 5:
                return "Expert";
            case 4:
                return "Advanced";
            case 3:
                return "Intermediate";
            case 2:
                return "Basic";
            case 1:
                return "Beginner";
            default:
                return "Unknown";
        }
    };

    const getLevelColor = (level: number) => {
        switch (level) {
            case 5:
                return "bg-green-500";
            case 4:
                return "bg-blue-500";
            case 3:
                return "bg-yellow-500";
            case 2:
                return "bg-orange-500";
            case 1:
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Skills Assessment</h3>

            <div className="space-y-4">
                {data.skills.map((skill, index) => (
                    <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700">
                                {skill.name}
                            </span>
                            <span className="text-xs text-gray-500">
                                {getLevelLabel(skill.level)}
                            </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${getLevelColor(skill.level)} transition-all duration-500`}
                                style={{ width: `${(skill.level / 5) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span>Expert</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span>Advanced</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                        <span>Intermediate</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-orange-500 rounded"></div>
                        <span>Basic</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

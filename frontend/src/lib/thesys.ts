// Thesys C1 Configuration and Utilities
import { C1Provider } from "@anthropic-ai/thesys-c1-react";

export const THESYS_API_KEY = process.env.NEXT_PUBLIC_THESYS_API_KEY || "";

// Component schemas for Thesys generative UI
export const componentSchemas = {
    // Candidate Card Component
    CandidateCard: {
        type: "object",
        properties: {
            name: { type: "string", description: "Candidate name" },
            email: { type: "string", description: "Candidate email" },
            skills: {
                type: "array",
                items: { type: "string" },
                description: "List of skills",
            },
            experience_years: {
                type: "number",
                description: "Years of experience",
            },
            match_score: {
                type: "number",
                description: "Match score (0-100)",
            },
            summary: {
                type: "string",
                description: "Brief summary of the candidate",
            },
        },
        required: ["name", "skills"],
    },

    // Job Card Component
    JobCard: {
        type: "object",
        properties: {
            title: { type: "string", description: "Job title" },
            company: { type: "string", description: "Company name" },
            location: { type: "string", description: "Job location" },
            salary_range: { type: "string", description: "Salary range" },
            required_skills: {
                type: "array",
                items: { type: "string" },
                description: "Required skills",
            },
            match_score: {
                type: "number",
                description: "Match score (0-100)",
            },
            description: {
                type: "string",
                description: "Job description summary",
            },
        },
        required: ["title", "company"],
    },

    // Ranked List Component
    RankedList: {
        type: "object",
        properties: {
            title: { type: "string", description: "List title" },
            items: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        rank: { type: "number" },
                        name: { type: "string" },
                        score: { type: "number" },
                        details: { type: "string" },
                    },
                },
                description: "Ranked items",
            },
        },
        required: ["title", "items"],
    },

    // Skills Chart Component
    SkillsChart: {
        type: "object",
        properties: {
            skills: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        level: { type: "number", description: "Skill level 1-5" },
                    },
                },
                description: "Skills with proficiency levels",
            },
        },
        required: ["skills"],
    },

    // Match Summary Component
    MatchSummary: {
        type: "object",
        properties: {
            overall_score: {
                type: "number",
                description: "Overall match score",
            },
            breakdown: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        category: { type: "string" },
                        score: { type: "number" },
                        notes: { type: "string" },
                    },
                },
                description: "Score breakdown by category",
            },
            recommendation: {
                type: "string",
                description: "AI recommendation",
            },
        },
        required: ["overall_score"],
    },
};

// Helper function to create a Thesys message with UI components
export function createUIMessage(
    componentType: keyof typeof componentSchemas,
    data: any
) {
    return {
        type: "ui_component",
        component: componentType,
        data,
    };
}

// Parse UI components from AI response
export function parseUIComponents(response: string) {
    const uiRegex = /\[UI:(\w+)\]([\s\S]*?)\[\/UI\]/g;
    const components: Array<{ type: string; data: any }> = [];
    let match;

    while ((match = uiRegex.exec(response)) !== null) {
        const [_, componentType, jsonData] = match;
        try {
            const data = JSON.parse(jsonData.trim());
            components.push({ type: componentType, data });
        } catch (e) {
            console.error("Failed to parse UI component data:", e);
        }
    }

    // Extract the text content without UI components
    const textContent = response.replace(uiRegex, "").trim();

    return { textContent, components };
}

export default {
    THESYS_API_KEY,
    componentSchemas,
    createUIMessage,
    parseUIComponents,
};

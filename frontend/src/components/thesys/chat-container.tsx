"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, User } from "lucide-react";
import { api } from "@/lib/api";
import { parseUIComponents } from "@/lib/thesys";
import CandidateCard from "./candidate-card";
import JobCard from "./job-card";
import RankedList from "./ranked-list";
import SkillsChart from "./skills-chart";
import MatchSummary from "./match-summary";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    components?: Array<{ type: string; data: any }>;
}

interface ChatContainerProps {
    userRole: "candidate" | "recruiter";
}

export default function ChatContainer({ userRole }: ChatContainerProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const response = await api.post("/chat/message", {
                message: input,
                conversation_id: conversationId,
            });

            const { textContent, components } = parseUIComponents(
                response.data.message.content
            );

            const assistantMessage: Message = {
                id: response.data.message.id,
                role: "assistant",
                content: textContent || response.data.message.content,
                components: components.length > 0 ? components : undefined,
            };

            setMessages((prev) => [...prev, assistantMessage]);
            setConversationId(response.data.conversation_id);
        } catch (error: any) {
            const errorMessage: Message = {
                id: Date.now().toString(),
                role: "assistant",
                content:
                    error.response?.data?.detail ||
                    "Sorry, I encountered an error. Please try again.",
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const renderComponent = (component: { type: string; data: any }) => {
        switch (component.type) {
            case "CandidateCard":
                return <CandidateCard key={component.data.name} data={component.data} />;
            case "JobCard":
                return <JobCard key={component.data.title} data={component.data} />;
            case "RankedList":
                return <RankedList key={component.data.title} data={component.data} />;
            case "SkillsChart":
                return <SkillsChart key="skills" data={component.data} />;
            case "MatchSummary":
                return <MatchSummary key="match" data={component.data} />;
            default:
                return null;
        }
    };

    const accentColor = userRole === "candidate" ? "indigo" : "purple";

    const suggestedPrompts =
        userRole === "candidate"
            ? [
                "What jobs match my skills?",
                "Analyze my resume",
                "How can I improve my profile?",
                "What skills are in demand?",
            ]
            : [
                "Find candidates with Python skills",
                "Show me senior developers",
                "Who matches this job best?",
                "Compare these candidates",
            ];

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Sparkles className={`h-16 w-16 text-${accentColor}-600 mb-4`} />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {userRole === "candidate"
                                ? "Your AI Career Assistant"
                                : "Your AI Recruitment Assistant"}
                        </h2>
                        <p className="text-gray-600 mb-8 max-w-md">
                            {userRole === "candidate"
                                ? "Ask me about jobs, get resume feedback, or explore career opportunities."
                                : "Search for candidates, analyze profiles, or get hiring recommendations."}
                        </p>

                        {/* Suggested Prompts */}
                        <div className="grid grid-cols-2 gap-3 max-w-lg">
                            {suggestedPrompts.map((prompt, index) => (
                                <button
                                    key={index}
                                    onClick={() => setInput(prompt)}
                                    className={`p-3 text-sm text-left bg-white border border-gray-200 rounded-lg hover:border-${accentColor}-300 hover:bg-${accentColor}-50 transition-colors`}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"
                                }`}
                        >
                            {message.role === "assistant" && (
                                <div
                                    className={`w-8 h-8 rounded-full bg-${accentColor}-100 flex items-center justify-center flex-shrink-0`}
                                >
                                    <Sparkles className={`h-4 w-4 text-${accentColor}-600`} />
                                </div>
                            )}
                            <div
                                className={`max-w-[80%] ${message.role === "user"
                                        ? `bg-${accentColor}-600 text-white rounded-2xl rounded-br-md px-4 py-2`
                                        : "space-y-3"
                                    }`}
                            >
                                {message.role === "user" ? (
                                    <p>{message.content}</p>
                                ) : (
                                    <>
                                        {message.content && (
                                            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
                                                <p className="text-gray-800 whitespace-pre-wrap">
                                                    {message.content}
                                                </p>
                                            </div>
                                        )}
                                        {message.components?.map((component, idx) => (
                                            <div key={idx}>{renderComponent(component)}</div>
                                        ))}
                                    </>
                                )}
                            </div>
                            {message.role === "user" && (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                    <User className="h-4 w-4 text-gray-600" />
                                </div>
                            )}
                        </div>
                    ))
                )}

                {loading && (
                    <div className="flex gap-3">
                        <div
                            className={`w-8 h-8 rounded-full bg-${accentColor}-100 flex items-center justify-center`}
                        >
                            <Sparkles className={`h-4 w-4 text-${accentColor}-600`} />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 bg-white p-4">
                <form onSubmit={handleSubmit} className="flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                            userRole === "candidate"
                                ? "Ask about jobs, resume advice..."
                                : "Search candidates, analyze profiles..."
                        }
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className={`px-4 py-3 bg-${accentColor}-600 text-white rounded-xl hover:bg-${accentColor}-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}

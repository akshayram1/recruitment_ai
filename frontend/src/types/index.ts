// User types
export interface User {
    id: string;
    email: string;
    name: string;
    role: "candidate" | "recruiter";
    company?: string;
    created_at: string;
}

// Resume types
export interface Experience {
    title: string;
    company: string;
    duration: string;
    description?: string;
}

export interface Education {
    degree: string;
    institution: string;
    year?: string;
}

export interface ParsedResume {
    name: string;
    email: string;
    phone?: string;
    summary?: string;
    skills: string[];
    experience: Experience[];
    education: Education[];
}

export interface Resume {
    id: string;
    user_id: string;
    file_name: string;
    parsed_data: ParsedResume;
    created_at: string;
    updated_at: string;
}

// Job types
export interface ParsedJob {
    title: string;
    company: string;
    location?: string;
    salary_range?: string;
    employment_type?: string;
    description: string;
    required_skills: string[];
    preferred_skills?: string[];
    responsibilities?: string[];
    qualifications?: string[];
}

export interface Job {
    id: string;
    recruiter_id: string;
    file_name?: string;
    parsed_data: ParsedJob;
    created_at: string;
    updated_at: string;
}

// Search types
export interface SearchResult<T> {
    item: T;
    score: number;
    match_details?: string;
}

export interface CandidateSearchResult extends SearchResult<Resume> {
    matching_skills: string[];
    experience_match: boolean;
}

export interface JobSearchResult extends SearchResult<Job> {
    matching_skills: string[];
    salary_match: boolean;
}

// Chat types
export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    ui_components?: UIComponent[];
}

export interface Conversation {
    id: string;
    user_id: string;
    messages: Message[];
    created_at: string;
    updated_at: string;
}

// UI Component types for Thesys
export interface UIComponent {
    type: string;
    data: any;
}

export interface CandidateCardData {
    name: string;
    email?: string;
    skills: string[];
    experience_years?: number;
    match_score?: number;
    summary?: string;
}

export interface JobCardData {
    title: string;
    company: string;
    location?: string;
    salary_range?: string;
    required_skills: string[];
    match_score?: number;
    description?: string;
}

export interface RankedListData {
    title: string;
    items: Array<{
        rank: number;
        name: string;
        score: number;
        details?: string;
    }>;
}

export interface SkillsChartData {
    skills: Array<{
        name: string;
        level: number;
    }>;
}

export interface MatchSummaryData {
    overall_score: number;
    breakdown?: Array<{
        category: string;
        score: number;
        notes?: string;
    }>;
    recommendation?: string;
}

// API Response types
export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}

export interface ChatResponse {
    message: Message;
    conversation_id: string;
}

export interface StreamChunk {
    type: "chunk" | "complete" | "error";
    content?: string;
    data?: any;
}

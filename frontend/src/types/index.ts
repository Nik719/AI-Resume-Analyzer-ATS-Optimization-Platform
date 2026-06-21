export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar?: string;
  current_role?: string;
  target_role?: string;
  years_experience?: number;
  date_joined: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface Resume {
  id: string;
  title: string;
  file_url: string;
  file_type: "pdf" | "docx";
  file_size: number;
  status: "pending" | "parsing" | "parsed" | "error";
  is_primary: boolean;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: string[];
  summary: string;
  contact_info: ContactInfo;
  total_years_experience?: number;
  seniority_level?: string;
  created_at: string;
  parsed_at?: string;
  error_message?: string;
}

export interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface ExperienceItem {
  title: string;
  company: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  duration_months?: number;
  bullets: string[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  graduation_year?: string;
  gpa?: string;
}

export interface JobDescription {
  id: string;
  title: string;
  company?: string;
  location?: string;
  job_type?: string;
  experience_level?: string;
  raw_text: string;
  required_skills: string[];
  preferred_skills: string[];
  responsibilities: string[];
  qualifications: string[];
  keywords: string[];
  source_url?: string;
  created_at: string;
}

export type Priority = "high" | "medium" | "low";
export type HireProbability = "high" | "moderate" | "low";

export interface Recommendation {
  priority: Priority;
  category: "skills" | "keywords" | "format" | "experience";
  title: string;
  description: string;
  action: string;
}

export interface AnalysisResult {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  resume: string;
  job_description: string;
  resume_detail?: Pick<Resume, "id" | "title" | "file_type" | "status" | "is_primary" | "skills" | "created_at">;
  job_detail?: Pick<JobDescription, "id" | "title" | "company" | "location" | "experience_level" | "required_skills" | "created_at">;
  ats_score?: number;
  match_score?: number;
  keyword_match_score?: number;
  experience_match_score?: number;
  skills_match_score?: number;
  matched_skills: string[];
  missing_required_skills: string[];
  missing_preferred_skills: string[];
  matched_keywords: string[];
  missing_keywords: string[];
  strengths: string[];
  gaps: string[];
  recommendations: Recommendation[];
  resume_improvements: string[];
  overall_verdict?: string;
  hire_probability?: HireProbability;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface DashboardStats {
  total_resumes: number;
  total_analyses: number;
  avg_ats_score: number;
  best_match_score: number;
  recent_analyses: AnalysisResult[];
  score_trend: Array<{ completed_at: string; ats_score: number; match_score: number }>;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

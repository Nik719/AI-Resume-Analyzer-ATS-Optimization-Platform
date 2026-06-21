import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-500";
}

export function scoreBg(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-800";
  if (score >= 60) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-700";
}

export function scoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  return "Needs Work";
}

export function priorityColor(priority: string): string {
  return priority === "high"
    ? "bg-red-100 text-red-700 border-red-200"
    : priority === "medium"
    ? "bg-yellow-100 text-yellow-700 border-yellow-200"
    : "bg-blue-100 text-blue-700 border-blue-200";
}

export function hireProbabilityColor(prob?: string): string {
  return prob === "high" ? "text-green-600" : prob === "moderate" ? "text-yellow-600" : "text-red-500";
}

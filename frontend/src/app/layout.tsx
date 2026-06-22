import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: "ResumeAI — ATS-Optimized Resume Analyzer",
  description: "AI-powered resume analyzer with ATS scoring, skill gap analysis, and personalized recommendations.",
  keywords: ["resume", "ATS", "AI", "job match", "career"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

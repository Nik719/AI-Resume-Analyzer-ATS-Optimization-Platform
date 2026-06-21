import Link from "next/link";
import { ArrowRight, Zap, Target, TrendingUp, Shield, FileText, Sparkles } from "lucide-react";

const features = [
  { icon: Sparkles, title: "AI-Powered Parsing", desc: "Gemini extracts skills, experience, and insights from any PDF or DOCX resume.", color: "bg-purple-100 text-purple-600" },
  { icon: Target, title: "ATS Score Analysis", desc: "Know exactly how your resume performs in Applicant Tracking Systems before applying.", color: "bg-indigo-100 text-indigo-600" },
  { icon: TrendingUp, title: "Job Match %", desc: "Compare your resume against any job description and get a precise match percentage.", color: "bg-emerald-100 text-emerald-600" },
  { icon: FileText, title: "Skill Gap Detection", desc: "Identify missing required and preferred skills with prioritized action steps.", color: "bg-amber-100 text-amber-600" },
  { icon: Zap, title: "Smart Recommendations", desc: "Receive ranked, actionable suggestions to improve your ATS score immediately.", color: "bg-rose-100 text-rose-600" },
  { icon: Shield, title: "Dashboard Analytics", desc: "Track your improvement over time with score trends and application history.", color: "bg-cyan-100 text-cyan-600" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">ResumeAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm py-2 px-4">Sign in</Link>
            <Link href="/register" className="btn-primary text-sm py-2 px-4">Get started free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50 pointer-events-none" />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700 ring-1 ring-primary-100">
            <Sparkles className="h-3.5 w-3.5" /> Powered by Google Gemini AI
          </span>
          <h1 className="mt-4 text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Beat the ATS.<br />
            <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">Land the interview.</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Upload your resume, paste a job description, and get an instant AI analysis with ATS score,
            skill gaps, and ranked recommendations to maximize your chances.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/register" className="btn-primary text-base px-7 py-3">
              Analyze my resume <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Already have an account →
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[["98%", "Parse accuracy"], ["2.5s", "Avg analysis time"], ["40+", "Resume signals checked"]].map(([val, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{val}</div>
                <div className="mt-1 text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Everything you need to stand out</h2>
            <p className="mt-4 text-lg text-gray-600">From parsing to recommendations — your full job-search toolkit in one place.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card group hover:shadow-card-hover transition-all duration-200">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color} mb-4`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold text-gray-900">Ready to optimize your resume?</h2>
          <p className="mt-4 text-lg text-gray-600">Join thousands of job seekers getting interview-ready with AI.</p>
          <Link href="/register" className="btn-primary mt-8 text-base px-8 py-3">
            Start free — no credit card needed <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 px-6 py-8">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-600">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">ResumeAI</span>
          </div>
          <p className="text-sm text-gray-500">© 2024 ResumeAI. Built with Django, Next.js & Gemini.</p>
        </div>
      </footer>
    </div>
  );
}

"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, AlertTriangle, TrendingUp, Lightbulb, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { AnalysisResult, Recommendation } from "@/types";
import { cn, scoreColor, scoreBg, scoreLabel, priorityColor, hireProbabilityColor } from "@/lib/utils";

function ScoreRing({ score, label, size = 120 }: { score: number; label: string; size?: number }) {
  const r = (size - 20) / 2;
  const circ = 2 * Math.PI * r;
  const fill = ((score || 0) / 100) * circ;
  const color = (score || 0) >= 80 ? "#10b981" : (score || 0) >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="#f3f4f6" strokeWidth={10} fill="none" />
        <circle cx={size/2} cy={size/2} r={r}
          stroke={color} strokeWidth={10} fill="none"
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
          className="score-ring-fill"
        />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
          style={{ transform: "rotate(90deg)", transformOrigin: "center", fontFamily: "Inter", fontSize: 22, fontWeight: 700, fill: "#111" }}>
          {score ?? "–"}
        </text>
      </svg>
      <p className="text-xs font-medium text-gray-500 text-center">{label}</p>
    </div>
  );
}

function SkillChip({ skill, variant }: { skill: string; variant: "matched" | "missing-req" | "missing-pref" }) {
  const cls = {
    matched: "bg-green-50 text-green-700 border border-green-100",
    "missing-req": "bg-red-50 text-red-700 border border-red-100",
    "missing-pref": "bg-yellow-50 text-yellow-700 border border-yellow-100",
  }[variant];
  return <span className={`badge text-xs ${cls}`}>{skill}</span>;
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <div className={cn("rounded-xl border p-4 space-y-2", priorityColor(rec.priority))}>
      <div className="flex items-start gap-2">
        <span className={cn("badge text-xs border font-semibold shrink-0", priorityColor(rec.priority))}>
          {rec.priority.toUpperCase()}
        </span>
        <p className="text-sm font-semibold">{rec.title}</p>
      </div>
      <p className="text-xs leading-relaxed opacity-80">{rec.description}</p>
      <div className="flex items-start gap-1.5 text-xs font-medium">
        <span className="mt-0.5 shrink-0">→</span>
        <span>{rec.action}</span>
      </div>
    </div>
  );
}

export default function AnalysisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalysis = useCallback(() => {
    api.get(`/analysis/${id}/`).then(r => setAnalysis(r.data)).catch(() => router.push("/dashboard")).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadAnalysis();
  }, [loadAnalysis]);

  useEffect(() => {
    if (!analysis || analysis.status === "completed" || analysis.status === "failed") return;
    const interval = setInterval(() => {
      api.get(`/analysis/${id}/`).then(r => setAnalysis(r.data));
    }, 3000);
    return () => clearInterval(interval);
  }, [id, analysis?.status]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-400" />
        <p className="mt-3 text-sm text-gray-500">Loading analysis...</p>
      </div>
    </div>
  );

  if (!analysis) return null;

  const isProcessing = analysis.status === "pending" || analysis.status === "processing";

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resume Analysis</h1>
          <p className="text-sm text-gray-500">
            {analysis.resume_detail?.title} vs {analysis.job_detail?.title}
            {analysis.job_detail?.company && ` @ ${analysis.job_detail.company}`}
          </p>
        </div>
        <button onClick={loadAnalysis} className="ml-auto text-gray-400 hover:text-gray-600">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Processing state */}
      {isProcessing && (
        <div className="card border-primary-100 bg-primary-50/50 text-center py-12">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary-500" />
          <h3 className="mt-4 font-semibold text-gray-800">AI is analyzing your resume...</h3>
          <p className="mt-2 text-sm text-gray-500">This usually takes 15-30 seconds. This page auto-updates.</p>
        </div>
      )}

      {analysis.status === "failed" && (
        <div className="card border-red-100 bg-red-50 text-center py-10">
          <XCircle className="mx-auto h-8 w-8 text-red-400" />
          <h3 className="mt-3 font-semibold text-gray-800">Analysis failed</h3>
          <p className="mt-1 text-sm text-gray-500">{analysis.error_message || "Something went wrong. Please try again."}</p>
        </div>
      )}

      {analysis.status === "completed" && (
        <>
          {/* Score summary */}
          <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold">Overall Scores</h3>
                {analysis.overall_verdict && <p className="text-sm text-gray-500 mt-1">{analysis.overall_verdict}</p>}
              </div>
              {analysis.hire_probability && (
                <div className="text-right">
                  <p className="text-xs text-gray-400">Hire probability</p>
                  <p className={cn("text-lg font-bold capitalize", hireProbabilityColor(analysis.hire_probability))}>
                    {analysis.hire_probability}
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              <ScoreRing score={analysis.ats_score!} label="ATS Score" />
              <ScoreRing score={analysis.match_score!} label="Overall Match" />
              <ScoreRing score={analysis.keyword_match_score!} label="Keywords" size={100} />
              <ScoreRing score={analysis.skills_match_score!} label="Skills" size={100} />
              <ScoreRing score={analysis.experience_match_score!} label="Experience" size={100} />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Skills breakdown */}
            <div className="card space-y-4">
              <h3>Skills Analysis</h3>
              {analysis.matched_skills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Matched ({analysis.matched_skills.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.matched_skills.map(s => <SkillChip key={s} skill={s} variant="matched" />)}
                  </div>
                </div>
              )}
              {analysis.missing_required_skills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> Missing Required ({analysis.missing_required_skills.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.missing_required_skills.map(s => <SkillChip key={s} skill={s} variant="missing-req" />)}
                  </div>
                </div>
              )}
              {analysis.missing_preferred_skills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Missing Preferred ({analysis.missing_preferred_skills.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.missing_preferred_skills.map(s => <SkillChip key={s} skill={s} variant="missing-pref" />)}
                  </div>
                </div>
              )}
            </div>

            {/* Strengths & Gaps */}
            <div className="space-y-4">
              {analysis.strengths.length > 0 && (
                <div className="card space-y-3">
                  <h3 className="flex items-center gap-2 text-green-700"><CheckCircle className="h-4 w-4" /> Strengths</h3>
                  <ul className="space-y-2">
                    {analysis.strengths.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {analysis.gaps.length > 0 && (
                <div className="card space-y-3">
                  <h3 className="flex items-center gap-2 text-red-600"><XCircle className="h-4 w-4" /> Gaps</h3>
                  <ul className="space-y-2">
                    {analysis.gaps.map((g, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="card space-y-4">
              <h3 className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary-600" /> Recommendations</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {analysis.recommendations.map((rec, i) => <RecommendationCard key={i} rec={rec} />)}
              </div>
            </div>
          )}

          {/* Resume improvements */}
          {analysis.resume_improvements.length > 0 && (
            <div className="card space-y-3">
              <h3 className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-amber-500" /> Resume Improvements</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {analysis.resume_improvements.map((item, i) => (
                  <li key={i} className="flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-gray-700">
                    <span className="mt-0.5 text-amber-500 shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
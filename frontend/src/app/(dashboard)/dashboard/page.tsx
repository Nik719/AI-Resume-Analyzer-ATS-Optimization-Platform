"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { TrendingUp, FileText, Briefcase, BarChart2, ArrowRight, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const ScoreTrendChart = dynamic(() => import("./ScoreTrendChart"), { ssr: false, loading: () => <div className="h-[220px] skeleton" /> });
import api from "@/lib/api";
import { DashboardStats, AnalysisResult } from "@/types";
import { cn, scoreColor, scoreBg, scoreLabel, hireProbabilityColor } from "@/lib/utils";
import { format } from "date-fns";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: AnalysisResult["status"] }) {
  const map = {
    completed: { label: "Completed", icon: CheckCircle, cls: "text-green-600 bg-green-50" },
    processing: { label: "Analyzing...", icon: Loader2, cls: "text-blue-600 bg-blue-50" },
    pending: { label: "Queued", icon: Clock, cls: "text-yellow-600 bg-yellow-50" },
    failed: { label: "Failed", icon: AlertCircle, cls: "text-red-600 bg-red-50" },
  };
  const { label, icon: Icon, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      <Icon className={cn("h-3 w-3", status === "processing" && "animate-spin")} />
      {label}
    </span>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/analysis/dashboard/").then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4">
      <div className="h-6 skeleton w-48" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton" />)}
      </div>
    </div>
  );

  const trendData = (stats?.score_trend || []).slice().reverse().map(t => ({
    date: format(new Date(t.completed_at), "MMM d"),
    ATS: t.ats_score,
    Match: t.match_score,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Your resume performance at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Resumes" value={stats?.total_resumes || 0} icon={FileText} color="bg-primary-50 text-primary-600" />
        <StatCard label="Analyses Run" value={stats?.total_analyses || 0} icon={BarChart2} color="bg-purple-50 text-purple-600" />
        <StatCard label="Avg ATS Score" value={`${stats?.avg_ats_score || 0}%`} icon={TrendingUp} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Best Match" value={`${stats?.best_match_score || 0}%`} icon={Briefcase} color="bg-amber-50 text-amber-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Score trend chart */}
        <div className="card lg:col-span-2">
          <h3 className="mb-4">Score Trend</h3>
          {trendData.length > 0 ? (
            <ScoreTrendChart data={trendData} />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-100">
              <div className="text-center">
                <BarChart2 className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-400">No data yet. Run your first analysis.</p>
                <Link href="/resumes/upload" className="btn-primary mt-3 text-xs px-4 py-2">Upload resume</Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card">
          <h3 className="mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {[
              { label: "Upload new resume", href: "/resumes/upload", desc: "Add PDF or DOCX", color: "bg-primary-50 text-primary-700 hover:bg-primary-100" },
              { label: "Add job description", href: "/jobs", desc: "Paste a JD to match", color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
            ].map(({ label, href, desc, color }) => (
              <Link key={href} href={href}
                className={`flex items-center justify-between rounded-lg p-3.5 transition-colors ${color}`}>
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs opacity-70 mt-0.5">{desc}</div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent analyses */}
      {(stats?.recent_analyses?.length || 0) > 0 && (
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3>Recent Analyses</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
                  <th className="pb-3 pr-4">Resume</th>
                  <th className="pb-3 pr-4">Job</th>
                  <th className="pb-3 pr-4">ATS Score</th>
                  <th className="pb-3 pr-4">Match</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats?.recent_analyses.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-gray-900">{a.resume_detail?.title || "Resume"}</td>
                    <td className="py-3 pr-4 text-gray-600">{a.job_detail?.title || "JD"}</td>
                    <td className="py-3 pr-4">
                      {a.ats_score != null ? (
                        <span className={`font-semibold ${scoreColor(a.ats_score)}`}>{a.ats_score}%</span>
                      ) : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {a.match_score != null ? (
                        <span className={`badge ${scoreBg(a.match_score)}`}>{a.match_score}%</span>
                      ) : "—"}
                    </td>
                    <td className="py-3"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
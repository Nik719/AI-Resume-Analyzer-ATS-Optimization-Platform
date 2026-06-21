"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Briefcase, Plus, Trash2, X, ExternalLink, Sparkles, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { JobDescription, Resume } from "@/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [analyzeModal, setAnalyzeModal] = useState<JobDescription | null>(null);
  const [selectedResume, setSelectedResume] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ title: string; company: string; raw_text: string; source_url: string }>();

  const fetchAll = async () => {
    const [jRes, rRes] = await Promise.all([api.get("/jobs/"), api.get("/resumes/")]);
    setJobs(jRes.data.results || jRes.data);
    setResumes((rRes.data.results || rRes.data).filter((r: Resume) => r.status === "parsed"));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const onSubmit = async (data: any) => {
    try {
      await api.post("/jobs/", data);
      toast.success("Job description saved and parsing in background...");
      reset();
      setShowForm(false);
      fetchAll();
    } catch { toast.error("Failed to save job description"); }
  };

  const deleteJob = async (id: string) => {
    if (!confirm("Delete this job description?")) return;
    try { await api.delete(`/jobs/${id}/`); toast.success("Deleted"); fetchAll(); } catch { toast.error("Failed"); }
  };

  const runAnalysis = async () => {
    if (!selectedResume || !analyzeModal) return;
    setAnalyzing(true);
    try {
      const r = await api.post("/analysis/", { resume: selectedResume, job_description: analyzeModal.id });
      toast.success("Analysis started!");
      setAnalyzeModal(null);
      router.push(`/analysis/${r.data.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to start analysis");
    } finally { setAnalyzing(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Descriptions</h1>
          <p className="mt-1 text-sm text-gray-500">Paste JDs to match against your resumes</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="h-4 w-4" /> Add JD
        </button>
      </div>

      {/* Add JD form */}
      {showForm && (
        <div className="card border-primary-100 animate-slide-up">
          <div className="mb-4 flex items-center justify-between">
            <h3>Add Job Description</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Job title *</label>
                <input {...register("title", { required: true })} placeholder="Senior Software Engineer" className="input" />
              </div>
              <div>
                <label className="label">Company</label>
                <input {...register("company")} placeholder="Acme Corp" className="input" />
              </div>
            </div>
            <div>
              <label className="label">Job description text *</label>
              <textarea {...register("raw_text", { required: true })} rows={10}
                placeholder="Paste the full job description here..."
                className="input resize-none font-mono text-xs leading-relaxed" />
            </div>
            <div>
              <label className="label">Source URL (optional)</label>
              <input {...register("source_url")} placeholder="https://linkedin.com/jobs/..." className="input" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? "Saving..." : <><Sparkles className="h-4 w-4" /> Save & analyze</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Job list */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}</div>
      ) : jobs.length === 0 ? (
        <div className="card py-16 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-gray-200" />
          <h3 className="mt-4 text-base font-medium text-gray-700">No job descriptions yet</h3>
          <p className="mt-2 text-sm text-gray-400">Add a JD to start matching against your resume</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-5">
            <Plus className="h-4 w-4" /> Add first JD
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(j => (
            <div key={j.id} className="card group flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 truncate">{j.title}</p>
                  {j.source_url && (
                    <a href={j.source_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-500">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                {j.company && <p className="text-sm text-gray-500 mt-0.5">{j.company}</p>}
                {j.required_skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {j.required_skills.slice(0, 6).map(s => <span key={s} className="badge bg-primary-50 text-primary-700 text-xs">{s}</span>)}
                    {j.required_skills.length > 6 && <span className="badge bg-gray-100 text-gray-500 text-xs">+{j.required_skills.length - 6}</span>}
                  </div>
                )}
                <p className="mt-2 text-xs text-gray-400">{format(new Date(j.created_at), "MMM d, yyyy")}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button onClick={() => setAnalyzeModal(j)} className="btn-primary text-xs py-1.5 px-3">
                  Analyze
                </button>
                <button onClick={() => deleteJob(j.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analyze modal */}
      {analyzeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="card w-full max-w-md shadow-xl animate-slide-up">
            <div className="mb-4 flex items-center justify-between">
              <h3>Match resume to JD</h3>
              <button onClick={() => setAnalyzeModal(null)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Select a resume to analyze against <span className="font-medium">{analyzeModal.title}</span>
            </p>
            {resumes.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
                No parsed resumes found. Upload and wait for parsing to complete first.
              </p>
            ) : (
              <select value={selectedResume} onChange={e => setSelectedResume(e.target.value)} className="input">
                <option value="">Select a resume...</option>
                {resumes.map(r => <option key={r.id} value={r.id}>{r.title} {r.is_primary ? "(Primary)" : ""}</option>)}
              </select>
            )}
            <div className="mt-5 flex gap-3">
              <button onClick={() => setAnalyzeModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={runAnalysis} disabled={!selectedResume || analyzing} className="btn-primary flex-1">
                {analyzing ? "Starting..." : <><Sparkles className="h-4 w-4" /> Run analysis</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
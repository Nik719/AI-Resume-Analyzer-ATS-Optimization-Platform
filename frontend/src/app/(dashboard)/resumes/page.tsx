"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Upload, CheckCircle, Loader2, AlertCircle, Clock, Trash2, Star, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Resume } from "@/types";
import { cn, formatFileSize } from "@/lib/utils";
import { format } from "date-fns";

function StatusChip({ status }: { status: Resume["status"] }) {
  const map = {
    parsed: { icon: CheckCircle, label: "Parsed", cls: "bg-green-50 text-green-700" },
    parsing: { icon: Loader2, label: "Parsing...", cls: "bg-blue-50 text-blue-700" },
    pending: { icon: Clock, label: "Pending", cls: "bg-yellow-50 text-yellow-700" },
    error: { icon: AlertCircle, label: "Error", cls: "bg-red-50 text-red-700" },
  };
  const { icon: Icon, label, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      <Icon className={cn("h-3 w-3", status === "parsing" && "animate-spin")} />
      {label}
    </span>
  );
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResumes = () => {
    api.get("/resumes/").then(r => setResumes(r.data.results || r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchResumes(); }, []);

  const setPrimary = async (id: string) => {
    try {
      await api.post(`/resumes/${id}/set-primary/`);
      toast.success("Primary resume updated");
      fetchResumes();
    } catch { toast.error("Failed to update"); }
  };

  const deleteResume = async (id: string) => {
    if (!confirm("Delete this resume?")) return;
    try {
      await api.delete(`/resumes/${id}/`);
      toast.success("Resume deleted");
      fetchResumes();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resumes</h1>
          <p className="mt-1 text-sm text-gray-500">{resumes.length} resume{resumes.length !== 1 ? "s" : ""} uploaded</p>
        </div>
        <Link href="/resumes/upload" className="btn-primary">
          <Upload className="h-4 w-4" /> Upload resume
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 skeleton rounded-xl" />)}
        </div>
      ) : resumes.length === 0 ? (
        <div className="card text-center py-16">
          <FileText className="mx-auto h-12 w-12 text-gray-200" />
          <h3 className="mt-4 text-base font-medium text-gray-700">No resumes yet</h3>
          <p className="mt-2 text-sm text-gray-400">Upload your first resume to get started</p>
          <Link href="/resumes/upload" className="btn-primary mt-5 inline-flex">
            <Upload className="h-4 w-4" /> Upload resume
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map(r => (
            <div key={r.id} className="card group relative flex flex-col gap-3">
              {r.is_primary && (
                <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Primary
                </span>
              )}
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                  <FileText className="h-5 w-5 text-primary-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{r.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.file_type.toUpperCase()} · {formatFileSize(r.file_size)}</p>
                </div>
              </div>

              <StatusChip status={r.status} />

              {r.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {r.skills.slice(0, 5).map(s => (
                    <span key={s} className="badge bg-gray-100 text-gray-600 text-xs">{s}</span>
                  ))}
                  {r.skills.length > 5 && <span className="badge bg-gray-100 text-gray-500 text-xs">+{r.skills.length - 5}</span>}
                </div>
              )}

              <p className="text-xs text-gray-400">{format(new Date(r.created_at), "MMM d, yyyy")}</p>

              <div className="flex items-center gap-2 border-t border-gray-50 pt-3">
                {!r.is_primary && r.status === "parsed" && (
                  <button onClick={() => setPrimary(r.id)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                    Set primary
                  </button>
                )}
                <button onClick={() => deleteResume(r.id)} className="ml-auto text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
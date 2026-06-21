"use client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { cn, formatFileSize } from "@/lib/utils";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    setError("");
    if (rejected.length) { setError("Only PDF or DOCX files under 10 MB are accepted."); return; }
    const f = accepted[0];
    setFile(f);
    setTitle(f.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase()));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title || file.name);
      await api.post("/resumes/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Resume uploaded! Parsing in background...");
      router.push("/resumes");
    } catch (err: any) {
      const msg = err?.response?.data;
      if (typeof msg === "object") toast.error(Object.values(msg).flat().join(", ") as string);
      else toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Resume</h1>
        <p className="mt-1 text-sm text-gray-500">Supports PDF and DOCX up to 10 MB</p>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-150",
          isDragActive ? "border-primary-400 bg-primary-50 scale-[1.01]" : "border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/40",
          file && "border-green-300 bg-green-50"
        )}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="space-y-3">
            <CheckCircle className="mx-auto h-10 w-10 text-green-500" />
            <p className="font-medium text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
            <button type="button" onClick={e => { e.stopPropagation(); setFile(null); setTitle(""); }}
              className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
              <X className="h-3 w-3" /> Remove
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
              <Upload className="h-6 w-6 text-primary-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {isDragActive ? "Drop it here!" : "Drag & drop your resume"}
              </p>
              <p className="mt-1 text-sm text-gray-500">or <span className="text-primary-600 font-medium">click to browse</span></p>
            </div>
            <p className="text-xs text-gray-400">PDF or DOCX · Max 10 MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {file && (
        <div className="card space-y-4">
          <div>
            <label className="label">Resume title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Software Engineer Resume 2024"
              className="input"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.back()} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleUpload} disabled={uploading} className="btn-primary flex-1">
              {uploading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Uploading...
                </>
              ) : (
                <><FileText className="h-4 w-4" /> Upload & parse</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
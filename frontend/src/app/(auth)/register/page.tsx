"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Sparkles, Eye, EyeOff, Check } from "lucide-react";
import { register as registerUser } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  password2: z.string(),
}).refine(d => d.password === d.password2, { message: "Passwords dont match", path: ["password2"] });

type FormData = z.infer<typeof schema>;
const benefits = ["AI-powered resume parsing","ATS score analysis","Skill gap detection","Personalized recommendations"];

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const { user } = await registerUser(data.email, data.password, data.password2, data.full_name);
      setUser(user);
      toast.success("Account created!");
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data;
      if (typeof msg === "object") Object.values(msg).flat().forEach((m: any) => toast.error(m));
      else toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="hidden lg:flex lg:w-5/12 flex-col items-center justify-center p-12 bg-primary-600">
        <div className="max-w-xs text-white">
          <div className="flex items-center gap-2 mb-10">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">ResumeAI</span>
          </div>
          <h2 className="text-3xl font-bold leading-snug">Stand out with AI-optimized resumes</h2>
          <p className="mt-4 text-primary-100 text-sm leading-relaxed">Get your ATS score, identify skill gaps, and land more interviews.</p>
          <ul className="mt-8 space-y-3">
            {benefits.map(b => (
              <li key={b} className="flex items-center gap-3 text-sm text-white">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20"><Check className="h-3 w-3" /></span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-600 mb-6">Free forever. No credit card required.</p>
          <div className="card shadow-lg">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Full name</label>
                <input {...register("full_name")} placeholder="Alex Johnson" className={cn("input", errors.full_name && "border-red-400")} />
                {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>}
              </div>
              <div>
                <label className="label">Email address</label>
                <input {...register("email")} type="email" placeholder="you@example.com" className={cn("input", errors.email && "border-red-400")} />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input {...register("password")} type={showPass ? "text" : "password"} placeholder="Min. 8 characters" className={cn("input pr-10", errors.password && "border-red-400")} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              </div>
              <div>
                <label className="label">Confirm password</label>
                <input {...register("password2")} type="password" placeholder="••••••••" className={cn("input", errors.password2 && "border-red-400")} />
                {errors.password2 && <p className="mt-1 text-xs text-red-500">{errors.password2.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5 mt-2">
                {isSubmitting ? "Creating account..." : "Create free account"}
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
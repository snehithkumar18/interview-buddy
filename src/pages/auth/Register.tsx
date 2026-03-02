import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Eye, EyeOff, Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";

const COLLEGES = [
  "IIT Bombay", "IIT Delhi", "IIT Madras", "IIT Kanpur", "IIT Kharagpur",
  "IIT Roorkee", "IIT Guwahati", "IIT Hyderabad", "BITS Pilani", "NIT Trichy",
  "NIT Warangal", "NIT Surathkal", "IIIT Hyderabad", "DTU Delhi", "NSUT Delhi",
  "VIT Vellore", "SRM Chennai", "Manipal Institute", "COEP Pune", "VJTI Mumbai",
];

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [collegeSuggestions, setCollegeSuggestions] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email address";
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Password must be at least 8 characters";
    if (!confirmPassword) e.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) e.confirmPassword = "Passwords do not match";
    if (phone && !/^\d{10}$/.test(phone)) e.phone = "Enter a valid 10-digit phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCollegeChange = (val: string) => {
    setCollege(val);
    if (val.length > 1) {
      setCollegeSuggestions(
        COLLEGES.filter((c) => c.toLowerCase().includes(val.toLowerCase())).slice(0, 5)
      );
    } else {
      setCollegeSuggestions([]);
    }
  };

  const handleResumeUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    setResumeFile(file);
    setUploading(true);
    setUploadProgress(0);

    // Simulate progress since supabase doesn't expose upload progress
    const interval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 15, 90));
    }, 200);

    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("resumes")
      .upload(fileName, file, { contentType: "application/pdf" });

    clearInterval(interval);

    if (error) {
      toast.error("Failed to upload resume");
      setResumeFile(null);
      setUploadProgress(0);
      setUploading(false);
      return;
    }

    const { data: publicData } = supabase.storage.from("resumes").getPublicUrl(data.path);
    setResumeUrl(publicData.publicUrl);
    setUploadProgress(100);
    setUploading(false);
    toast.success("Resume uploaded successfully");
  };

  const removeResume = () => {
    setResumeFile(null);
    setResumeUrl("");
    setUploadProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await signUp(email, password, fullName);

      // Wait for session to be established, then update profile
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase
          .from("profiles")
          .update({
            phone: phone || null,
            college: college || null,
            graduation_year: graduationYear ? parseInt(graduationYear) : null,
            resume_url: resumeUrl || null,
          })
          .eq("user_id", session.user.id);
      }

      toast.success("Welcome to InterviewAI! You have 30 free credits to start.");
      navigate("/app");
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-sm text-destructive mt-1">{errors[field]}</p> : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold gradient-text">InterviewAI</span>
          </Link>
          <p className="text-muted-foreground text-sm">Practice Interviews. Get Hired.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-lg p-8 space-y-4">
          <h2 className="text-xl font-bold text-center mb-2">Create your account</h2>

          {/* Full Name */}
          <div className="space-y-1">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="bg-background border-border" />
            <FieldError field="fullName" />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="bg-background border-border" />
            <FieldError field="email" />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" className="bg-background border-border pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <FieldError field="password" />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative">
              <Input id="confirmPassword" type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="bg-background border-border pr-10" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <FieldError field="confirmPassword" />
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 rounded-md border border-border bg-muted text-sm text-muted-foreground shrink-0">+91</div>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" className="bg-background border-border" />
            </div>
            <FieldError field="phone" />
          </div>

          {/* College */}
          <div className="space-y-1 relative">
            <Label htmlFor="college">College / University</Label>
            <Input id="college" value={college} onChange={(e) => handleCollegeChange(e.target.value)} placeholder="Start typing..." className="bg-background border-border" autoComplete="off" />
            {collegeSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 rounded-md border border-border bg-card shadow-lg">
                {collegeSuggestions.map((s) => (
                  <button key={s} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors" onClick={() => { setCollege(s); setCollegeSuggestions([]); }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Graduation Year */}
          <div className="space-y-1">
            <Label>Graduation Year</Label>
            <Select value={graduationYear} onValueChange={setGraduationYear}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 11 }, (_, i) => 2020 + i).map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resume Upload */}
          <div className="space-y-1">
            <Label>Resume (PDF, max 5MB)</Label>
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleResumeUpload(e.target.files[0])} />
            {!resumeFile ? (
              <Button type="button" variant="outline" className="w-full border-dashed border-border" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" /> Upload Resume (PDF)
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted text-sm">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate flex-1">{resumeFile.name}</span>
                  <button type="button" onClick={removeResume} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {(uploading || uploadProgress > 0) && (
                  <Progress value={uploadProgress} className="h-2" />
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" disabled={loading || uploading} className="w-full glow-primary" style={{ background: "var(--gradient-primary)" }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account →"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

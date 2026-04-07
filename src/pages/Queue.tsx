import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock3, MessageSquare, Trash2, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";

interface Job {
  id: number;
  project_id: number;
  target_format: string;
  target_preset: string;
  status: string;
  output_path?: string;
  notes?: string;
}

export function QueuePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const navigate = useNavigate();

  async function fetchJobs() {
    try {
      const res = await fetch(`${API_BASE_URL}/jobs`);
      const data = await res.json();
      setJobs(data);
    } catch (e) {
      console.error("Failed to fetch jobs", e);
    }
  }

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (jobId: number) => {
    if (!confirm("Are you sure you want to delete this job record?")) return;
    
    setIsDeleting(jobId);
    try {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Job record deleted.");
        setJobs(jobs.filter(j => j.id !== jobId));
      } else {
        toast.error("Failed to delete job.");
      }
    } catch (e) {
      toast.error("Network error.");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="p-8 space-y-6 cyber-grid min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-widest text-white">Job Queue</h1>
          <p className="text-white/40 text-sm mt-1">Monitor and manage your background quantization tasks.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {jobs.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center text-white/20 flex flex-col items-center bg-black/20 backdrop-blur-sm">
            <Activity className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-bold">Your queue is empty.</p>
          </div>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} className="bg-[#161b22] border-white/10 cyber-glow overflow-hidden group">
              <CardHeader className="py-6 flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                    job.status === 'failed' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-cyan-500/10 text-cyan-400 animate-pulse'
                  }`}>
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">Project #{job.project_id}</CardTitle>
                    <CardDescription className="text-white/40">Target: {job.target_preset} ({job.target_format})</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-white/40 bg-black/20 px-3 py-1.5 rounded-full border border-white/5">
                    <Clock3 className="h-3 w-3" />
                    <span className="uppercase">{job.status}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {job.status === "completed" && (
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20"
                        onClick={() => navigate(`/playground?model=${encodeURIComponent(job.output_path || "")}`)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Playground
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white/20 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      disabled={isDeleting === job.id}
                      onClick={() => handleDelete(job.id)}
                    >
                      {isDeleting === job.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="bg-black/20 pb-6 pt-0">
                  <div className="bg-black/40 text-cyan-400/80 p-5 rounded-xl font-mono text-xs border border-white/5 shadow-inner leading-relaxed">
                    <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                      <span className="text-white/20">LOGS_LEVEL: DEBUG</span>
                      <span className="text-white/20">JOB_ID: {job.id}</span>
                    </div>
                    <p className="text-white/60 mb-1">[{new Date().toLocaleTimeString()}] INITIALIZING_QUANTIZATION_ENGINE...</p>
                    <p className="text-white/60">{job.notes || "READY_FOR_PROCESSING"}</p>
                    {job.output_path && (
                      <div className="mt-3 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                        <span className="text-emerald-400 font-bold">✓ OUTPUT_COMPILED:</span>
                        <span className="text-white/40 ml-2 truncate block mt-1">{job.output_path}</span>
                      </div>
                    )}
                  </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

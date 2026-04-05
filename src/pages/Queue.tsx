import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock3, MessageSquare } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

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
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch(`${API_BASE_URL}/jobs`);
        const data = await res.json();
        setJobs(data);
      } catch (e) {
        console.error("Failed to fetch jobs", e);
      }
    }
    fetchJobs();

    // Poll every 5 seconds for status updates
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Job Queue</h1>
        <p className="text-muted-foreground">Monitor the progress of your background quantization tasks.</p>
      </div>

      <div className="grid gap-4">
        {jobs.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground flex flex-col items-center">
            <Activity className="h-12 w-12 mb-4 opacity-50" />
            <p>Your queue is empty.</p>
          </div>
        ) : (
          jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader className="py-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Project #{job.project_id}</CardTitle>
                  <CardDescription>Target: {job.target_preset} ({job.target_format})</CardDescription>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock3 className="h-4 w-4 text-muted-foreground" />
                  <div className="capitalize">{job.status}</div>
                  {job.status === "completed" && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/playground?model=${encodeURIComponent(job.output_path || "")}`)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Open in Playground
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                  <div className="bg-black text-green-400 p-4 rounded-md font-mono text-xs shadow-inner h-32 overflow-hidden border">
                    <p>[Job ID {job.id}] Status: {job.status.toUpperCase()}</p>
                    <p className="mt-2 text-muted-foreground">{job.notes || "Initializing process..."}</p>
                    {job.output_path && (
                      <p className="mt-2 text-emerald-400 font-bold">Output: {job.output_path}</p>
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

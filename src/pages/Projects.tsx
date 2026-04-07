import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Hammer, Trash2, LibraryBig, FolderCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";

export function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch(`${API_BASE_URL}/projects`);
        const data = await res.json();
        setProjects(data);
      } catch (e) {
        console.error("Failed to fetch projects", e);
      }
    }
    fetchProjects();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project? Logs and statistics will be permanently removed.")) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Project purged from database.");
        setProjects(projects.filter((p) => p.id !== id));
      }
    } catch (e) {
      toast.error("Failed to delete project.");
    }
  };

  return (
    <div className="p-8 space-y-8 cyber-grid min-h-screen">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-widest text-white">Model Repository</h1>
          <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-mono">Managed local quantization projects</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <div className="col-span-full border border-dashed border-white/10 rounded-2xl p-24 text-center text-white/20 flex flex-col items-center bg-black/20 backdrop-blur-sm">
            <LibraryBig className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-xl font-bold mb-6">No active projects found.</p>
            <Button 
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-black uppercase tracking-widest"
              onClick={() => navigate("/import")}
            >
              Initialize New Project
            </Button>
          </div>
        ) : (
          projects.map((proj) => (
            <Card key={proj.id} className="bg-[#161b22] border-white/10 cyber-glow flex flex-col group overflow-hidden">
              <CardHeader className="bg-black/20 border-b border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[9px] font-mono border-cyan-500/30 text-cyan-500 uppercase tracking-tighter">
                    {proj.architecture}
                  </Badge>
                  <FolderCode className="h-4 w-4 text-white/10 group-hover:text-cyan-500/40 transition-colors" />
                </div>
                <CardTitle className="text-2xl font-black italic text-white truncate">{proj.name}</CardTitle>
                <CardDescription className="truncate text-[10px] font-mono text-white/40" title={proj.source_path}>
                  PATH: {proj.source_path}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-6 space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Initialization_Notes</span>
                  <p className="text-sm text-white/60 leading-relaxed italic">"{proj.notes}"</p>
                </div>
              </CardContent>
              <div className="px-6 pb-6 pt-0 mt-auto flex gap-3">
                <Button 
                  className="flex-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500 hover:text-black font-black uppercase tracking-widest transition-all" 
                  onClick={() => navigate(`/workbench/${proj.id}`)}
                >
                  <Hammer className="h-4 w-4 mr-2" />
                  Workbench
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white/20 hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20" 
                  onClick={() => handleDelete(proj.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function Badge({ children, variant, className }: any) {
    return (
        <span className={`px-2 py-0.5 rounded-full border text-[10px] ${className}`}>
            {children}
        </span>
    )
}

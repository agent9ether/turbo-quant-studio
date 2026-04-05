import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Hammer, Trash2, LibraryBig } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/lib/api";

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
    if (!confirm("Are you sure you want to delete this project? Statistics and logs for this project will be removed from the local database.")) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProjects(projects.filter((p) => p.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete project", e);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">My Projects</h1>
        <p className="text-muted-foreground">Manage your imported models and open the quantization workbench.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 && (
          <div className="col-span-full border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground flex flex-col items-center">
            <LibraryBig className="h-12 w-12 mb-4 opacity-50" />
            <p className="mb-4">No projects found. Import a model to get started!</p>
            <Button onClick={() => navigate("/")}>Import Model</Button>
          </div>
        )}

        {projects.map((proj) => (
          <Card key={proj.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="scroll-m-20 text-xl font-semibold tracking-tight">{proj.name}</CardTitle>
              <CardDescription className="truncate" title={proj.source_path}>{proj.source_path}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
              <div className="text-sm">
                <span className="font-semibold">Architecture:</span> <span className="font-mono bg-muted px-1 rounded">{proj.architecture}</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold">Notes:</span> <span>{proj.notes}</span>
              </div>
            </CardContent>
            <div className="p-4 pt-0 mt-auto flex gap-2">
              <Button className="flex-1" onClick={() => navigate(`/workbench/${proj.id}`)}>
                <Hammer className="h-4 w-4 mr-2" />
                Quantize
              </Button>
              <Button variant="outline" size="icon" className="text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleDelete(proj.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

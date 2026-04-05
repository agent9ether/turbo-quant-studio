import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid, Cpu } from "lucide-react";

export function DiagnosticsPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`${API_BASE_URL}/system/diagnostics`);
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error("Failed to fetch diagnostics", e);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">System Diagnostics</h1>
        <p className="text-muted-foreground">View detected software runtime and hardware constraints.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LayoutGrid className="h-5 w-5" /> Environment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">OS Platform:</span>
              <span className="font-mono">{stats?.platform || "Detecting..."}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Backend Status:</span>
              <span className="font-mono text-green-500">{stats ? "Connected" : "Disconnected"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5" /> Host Hardware</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">CPU Cores:</span>
              <span className="font-mono">{stats?.cpu_cores || "-"} / {stats?.cpu_threads || "-"} threads</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Total RAM:</span>
              <span className="font-mono">{stats?.ram_total_gb ? `${stats.ram_total_gb} GB` : "-"}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Available RAM:</span>
              <span className="font-mono">{stats?.ram_available_gb ? `${stats.ram_available_gb} GB` : "-"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

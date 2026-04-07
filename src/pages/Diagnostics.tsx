import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Cpu, Activity, HardDrive, Thermometer, Layers, Info } from "lucide-react";

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
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div className="p-8 font-mono text-cyan-500 animate-pulse">CONNECTING TO HOST TELEMETRY...</div>;

  return (
    <div className="p-8 space-y-8 cyber-grid min-h-screen">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-widest text-white">System Analytics</h1>
          <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-mono">Real-time hardware telemetry streams</p>
        </div>
        <div className="text-[10px] font-mono text-cyan-500/50 bg-cyan-500/5 px-4 py-2 border border-cyan-500/10 rounded-full">
          REFRESH_RATE: 5000MS
        </div>
      </div>

      {/* Main Gauges Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <AnalyticsGauge label="CPU LOAD" value={Math.round(stats.cpu_usage)} icon={Cpu} />
        <AnalyticsGauge label="RAM USAGE" value={Math.round(stats.ram_usage)} icon={Layers} />
        <AnalyticsGauge label="GPU LOAD" value={Math.round(stats.gpu?.load || 0)} icon={Activity} />
        <AnalyticsGauge label="VRAM UTIL" value={Math.round(stats.gpu?.memory_util || 0)} icon={Info} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GPU SPEC CARD */}
        <Card className="bg-[#161b22] border-white/10 cyber-glow col-span-1 lg:col-span-2">
          <CardHeader className="border-b border-white/5 bg-black/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-cyan-500" />
                  GPU_ENG_DIAGNOSTIC
                </CardTitle>
                <CardDescription className="text-white/40 font-mono text-xs">{stats.gpu?.name.toUpperCase()}</CardDescription>
              </div>
              {stats.gpu?.temp && (
                <div className="flex items-center gap-2 text-rose-500 font-mono text-sm">
                  <Thermometer className="h-4 w-4" />
                  {stats.gpu.temp}°C
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-8">
             <StatBox label="COMPUTE_LOAD" value={`${Math.round(stats.gpu?.load || 0)}%`} color="text-cyan-400" />
             <StatBox label="VRAM_USED" value={`${Math.round(stats.gpu?.memory_used || 0)}MB`} />
             <StatBox label="VRAM_TOTAL" value={`${Math.round(stats.gpu?.memory_total || 0)}MB`} />
             <StatBox label="VRAM_UTIL" value={`${Math.round(stats.gpu?.memory_util || 0)}%`} color={stats.gpu?.memory_util > 90 ? "text-rose-500" : "text-emerald-400"} />
          </CardContent>
        </Card>

        {/* HOST HARDWARE CARD */}
        <Card className="bg-[#161b22] border-white/10 cyber-glow">
          <CardHeader className="border-b border-white/5 bg-black/20">
            <CardTitle className="text-white flex items-center gap-2 text-sm uppercase tracking-widest">
              <Cpu className="h-4 w-4 text-cyan-500" />
              HOST_TOPOLOGY
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 font-mono text-[11px]">
             <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/40">PHYSICAL_CORES</span>
                <span className="text-white">{stats.cpu_cores}</span>
             </div>
             <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/40">LOGICAL_THREADS</span>
                <span className="text-white">{stats.cpu_threads}</span>
             </div>
             <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-white/40">MEMORY_TOPOLOGY</span>
                <span className="text-white">{stats.ram_total_gb}GB DDR4/5</span>
             </div>
             <div className="flex justify-between">
                <span className="text-white/40">SYSTEM_PLATFORM</span>
                <span className="text-white">{stats.platform.toUpperCase()}</span>
             </div>
          </CardContent>
        </Card>

        {/* STORAGE ANALYTICS */}
        <Card className="bg-[#161b22] border-white/10 cyber-glow lg:col-span-3">
           <CardHeader className="border-b border-white/5 bg-black/20">
              <CardTitle className="text-white flex items-center gap-2 text-sm uppercase tracking-widest">
                <HardDrive className="h-4 w-4 text-cyan-500" />
                STORAGE_ARRAY_STATUS
              </CardTitle>
           </CardHeader>
           <CardContent className="p-8">
              <div className="flex items-center gap-8">
                 <div className="flex-1 space-y-4">
                    <div className="flex justify-between text-xs font-mono text-white/40">
                       <span>DRIVE_MOUNT: / (ROOT)</span>
                       <span>{stats.disk_used_gb}GB / {stats.disk_total_gb}GB</span>
                    </div>
                    <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 flex">
                       <div 
                         className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-1000" 
                         style={{ width: `${stats.disk_usage}%` }}
                       />
                    </div>
                    <div className="flex gap-12 pt-4">
                       <div className="flex flex-col">
                          <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Available_Capacity</span>
                          <span className="text-xl font-black text-emerald-400">{Math.round(stats.disk_total_gb - stats.disk_used_gb)}GB</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Disk_Usage_Rate</span>
                          <span className="text-xl font-black text-rose-500">{stats.disk_usage}%</span>
                       </div>
                    </div>
                 </div>
              </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AnalyticsGauge({ label, value, icon: Icon }: any) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const color = value > 85 ? "rose-500" : value > 60 ? "amber-400" : "cyan-500";

  return (
    <Card className="bg-[#161b22]/50 border-white/10 flex flex-col items-center p-8 backdrop-blur-md">
      <div className="relative mb-4">
        <svg className="-rotate-90 w-32 h-32" viewBox="0 0 160 160">
          <circle
            className="text-white/5"
            strokeWidth="12"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="80"
            cy="80"
          />
          <circle
            className={`text-${color} transition-all duration-1000 ease-out`}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="80"
            cy="80"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className={`h-6 w-6 text-${color} opacity-50 mb-1`} />
          <span className="text-2xl font-black text-white">{value}%</span>
        </div>
      </div>
      <span className="text-[10px] font-black tracking-[0.3em] text-white/20 uppercase">{label}</span>
      {/* Decorative glow */}
      <div className={`absolute inset-x-12 bottom-0 h-px bg-${color} blur-sm opacity-20`} />
    </Card>
  );
}

function StatBox({ label, value, color = "text-white/80" }: any) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{label}</span>
      <span className={`text-lg font-mono font-bold ${color}`}>{value}</span>
    </div>
  );
}

import { useState, useEffect } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Cpu, HardDrive, Activity, 
  Terminal, User as UserIcon,
  Circle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/lib/api";


export function DashboardPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    cpu_usage: 0,
    ram_usage: 0,
    disk_usage: 0,
    gpu: { name: "Detecting...", load: 0, memory_util: 0 }
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [jobsRes, diagRes] = await Promise.all([
          fetch(`${API_BASE_URL}/jobs`),
          fetch(`${API_BASE_URL}/system/diagnostics`)
        ]);
        
        const newJobs = await jobsRes.json();
        const newStats = await diagRes.json();
        
        setJobs(newJobs);
        setStats(newStats);
        
        // Update Chart Data (Rolling 30 points)
        setChartData(prev => {
          const newData = [
            ...prev,
            { 
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
              ram: newStats.ram_usage, 
              vram: newStats.gpu?.memory_util || 0 
            }
          ];
          return newData.slice(-30); // Keep last 30 readings
        });
      } catch (e) {
        console.error("Dashboard data fetch failed", e);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-[#0d1117] cyber-grid overflow-hidden">
      {/* Top Status Bar */}
      <div className="h-14 border-b border-white/10 bg-[#0d1117]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <UserIcon className="h-4 w-4" />
            <span>User: <span className="text-white font-medium">agent9ether</span></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500 animate-pulse" />
            <span className="text-emerald-500 font-bold uppercase tracking-wider text-[10px]">Status: ONLINE</span>
          </div>
        </div>
        <div className="text-sm font-mono text-white/40">
          Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Hardware Sidebar */}
        <div className="w-24 border-r border-white/5 flex flex-col items-center py-6 gap-8 bg-black/20">
          <HardwareModule icon={Cpu} label="CPU" value={Math.round(stats.cpu_usage)} detail="REAL-TIME" />
          <HardwareModule icon={Activity} label="GPU" value={Math.round(stats.gpu?.load || 0)} detail={stats.gpu?.name?.substring(0, 10).toUpperCase() || "NO GPU"} active />
          <HardwareModule icon={HardDrive} label="DISK" value={Math.round(stats.disk_usage)} detail="PRIMARY" />
        </div>

        {/* Main Dashboard Area */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 gap-6">
            {/* Resource Usage Chart */}
            <Card className="bg-[#161b22] border-white/10 cyber-glow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-white">SYSTEM RESOURCE USAGE (LIVE)</CardTitle>
                  <CardDescription className="text-white/40">RAM & VRAM Performance Analytics</CardDescription>
                </div>
                <div className="flex gap-4 text-[10px] font-bold">
                  <div className="flex items-center gap-1"><div className="h-2 w-2 bg-cyan-400 rounded-full" /> RAM ({stats.ram_usage}%)</div>
                  <div className="flex items-center gap-1"><div className="h-2 w-2 bg-blue-500 rounded-full" /> VRAM ({stats.gpu?.memory_util || 0}%)</div>
                </div>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorVram" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="time" stroke="#ffffff40" fontSize={10} axisLine={false} tickLine={false} hide={chartData.length < 2} />
                    <YAxis stroke="#ffffff40" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0d1117', border: '1px solid #ffffff20', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="ram" stroke="#22d3ee" fillOpacity={1} fill="url(#colorRam)" strokeWidth={2} isAnimationActive={false} />
                    <Area type="monotone" dataKey="vram" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVram)" strokeWidth={2} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Job Queue Table */}
            <Card className="bg-[#161b22] border-white/10 cyber-glow">
              <CardHeader>
                <CardTitle className="text-white uppercase tracking-widest text-sm">Quantization Job Queue</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-black/20">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-white/40 font-bold uppercase text-[10px]"># Jobs</TableHead>
                      <TableHead className="text-white/40 font-bold uppercase text-[10px]">Quant</TableHead>
                      <TableHead className="text-white/40 font-bold uppercase text-[10px]">Progress</TableHead>
                      <TableHead className="text-white/40 font-bold uppercase text-[10px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-white/20">No active jobs</TableCell>
                      </TableRow>
                    ) : (
                      jobs.map((job) => (
                        <TableRow key={job.id} className="border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="font-medium text-white/80">
                            <div className="flex items-center gap-3">
                              <Terminal className="h-4 w-4 text-cyan-500" />
                              <span>Job #{job.id}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-white/60 font-mono text-xs">{job.target_preset}</TableCell>
                          <TableCell className="w-[40%]">
                            <div className="flex items-center gap-3 w-full">
                              <Progress value={job.status === 'completed' ? 100 : job.status === 'processing' ? 68 : 0} className="h-1.5 flex-1 bg-white/5" />
                              <span className="text-[10px] font-mono text-white/40">{job.status === 'completed' ? '100' : '68'}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              job.status === 'completed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                              job.status === 'processing' ? "bg-cyan-500/10 text-cyan-500 border-cyan-500/20 animate-pulse" :
                              "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            }>
                              {job.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Chat Sidebar Lounge (Placeholder integration) */}
        <div className="w-[320px] border-l border-white/5 bg-black/20 flex flex-col">
           <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Live Quantization Chat</span>
              <Badge variant="secondary" className="text-[9px] h-5">Assistant-TQS</Badge>
           </div>
           <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="text-[11px] font-mono text-cyan-400/80">
                [16:08:12] Job #1: processing layers...
              </div>
              <div className="text-[11px] font-mono text-emerald-400/80">
                [16:08:15] System RAM usage increased: 118GB/128GB
              </div>
              <div className="bg-white/5 p-3 rounded-md border border-white/10">
                <p className="text-xs text-white/80 leading-relaxed italic">
                  "TurboQuant workstation operating optimally... Streaming text continues..."
                </p>
              </div>
           </div>
           <div className="p-4 border-t border-white/5">
              <div className="h-12 bg-white/5 rounded-md border border-white/10 flex items-center px-4 text-white/20 text-xs italic">
                Type command or message...
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function HardwareModule({ icon: Icon, label, value, detail, active }: any) {
  return (
    <div className={`flex flex-col items-center gap-2 group cursor-default`}>
      <div className={`p-3 rounded-xl border transition-all duration-300 ${active ? 'bg-cyan-500/10 border-cyan-500 cyber-glow' : 'bg-white/5 border-white/10 group-hover:border-white/30'}`}>
        <Icon className={`h-6 w-6 ${active ? 'text-cyan-400' : 'text-white/40'}`} />
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className={`text-[10px] font-bold tracking-tighter ${active ? 'text-cyan-400' : 'text-white/40'}`}>{label}</span>
        <span className={`text-base font-black ${active ? 'text-white shadow-cyan-500/50 drop-shadow-md' : 'text-white/60'}`}>{value}%</span>
        <span className="text-[8px] text-white/20 font-bold uppercase truncate max-w-[60px]">{detail}</span>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cpu, Play, Settings2, Zap, Hourglass } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";

export function WorkbenchPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [engine, setEngine] = useState("llamacpp");
  const [preset, setPreset] = useState("q4_k_m");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startJob = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          target_format: engine === "llamacpp" ? "GGUF" : "Unknown",
          target_preset: preset,
        }),
      });
      if (res.ok) {
        toast.success("Quantization sequence initiated.");
        navigate("/queue");
      }
    } catch (e) {
      toast.error("Failed to start quantization process.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 cyber-grid min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-widest text-white">Quantization Workbench</h1>
            <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-mono">Precision weight compression & optimization</p>
          </div>
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-white/40 uppercase tracking-widest">
            PID_{projectId}
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-8">
            <Card className="bg-[#161b22] border-white/10 cyber-glow overflow-hidden">
              <CardHeader className="bg-black/20 border-b border-white/5">
                <CardTitle className="text-white flex items-center gap-2 text-sm uppercase tracking-widest">
                  <Settings2 className="h-4 w-4 text-cyan-500" />
                  Strategy_Configuration
                </CardTitle>
                <CardDescription className="text-white/40 text-[11px] font-mono uppercase tracking-tighter">
                  Select model processing engine and target precision levels.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] px-1">Engine_Select</Label>
                  <Select value={engine} onValueChange={(val) => setEngine(val || "llamacpp")}>
                    <SelectTrigger className="bg-black/40 border-white/10 text-white font-black uppercase tracking-widest h-12 focus:ring-cyan-500/20">
                      <SelectValue placeholder="Select Engine" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1117] border-white/10 text-white">
                      <SelectItem value="llamacpp">llama.cpp (OPTIMIZED_GGUF)</SelectItem>
                      <SelectItem value="bitsandbytes" disabled>BITSANDBYTES (COMING_SOON)</SelectItem>
                      <SelectItem value="torchao" disabled>TORCHAO (COMING_SOON)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] px-1">Weight_Preset_Tuning</Label>
                  <Select value={preset} onValueChange={(val) => setPreset(val || "q4_k_m")}>
                    <SelectTrigger className="bg-black/40 border-white/10 text-white font-black uppercase tracking-widest h-12 focus:ring-cyan-500/20">
                      <SelectValue placeholder="Select Preset" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1117] border-white/10 text-white">
                      <SelectItem value="q4_k_m">Q4_K_M (BALANCED_STABLE)</SelectItem>
                      <SelectItem value="q5_k_m">Q5_K_M (HIGH_FIDELITY)</SelectItem>
                      <SelectItem value="q8_0">Q8_0 (8_BIT_LOSSLESS_EST)</SelectItem>
                      <SelectItem value="q3_k_m">Q3_K_M (MAX_COMPRESSION)</SelectItem>
                      <SelectItem value="f16">F16 (FULL_PRECISION_PASSTHROUGH)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="bg-[#161b22] border-white/10 cyber-glow overflow-hidden">
              <CardHeader className="bg-black/20 border-b border-white/5 pb-6">
                <CardTitle className="text-white flex items-center gap-2 text-sm uppercase tracking-widest">
                  <Cpu className="h-4 w-4 text-cyan-500" />
                  Preflight_Estimates
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <EstimateRow icon={Zap} label="Peak RAM Demand" value="~32.4 GB" />
                <EstimateRow icon={Hourglass} label="Est. Process Time" value="~12 MINS" color="text-amber-400" />
                <EstimateRow icon={Settings2} label="Target Extension" value=".GGUF" color="text-cyan-400" />
              </CardContent>
              <CardFooter className="p-6 bg-black/40 border-t border-white/5">
                <Button 
                  onClick={startJob} 
                  disabled={isSubmitting} 
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase tracking-widest h-14 text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all"
                >
                  <Play className="h-5 w-5 mr-3" fill="currentColor" />
                  {isSubmitting ? "INITIATING..." : "Start Quantization"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function EstimateRow({ icon: Icon, label, value, color = "text-white" }: any) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/5 pb-4 last:border-0 last:pb-0">
      <div className="flex items-center gap-2">
        <Icon className="h-3 w-3 text-white/20" />
        <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{label}</span>
      </div>
      <span className={`text-xl font-black font-mono pl-5 ${color}`}>{value}</span>
    </div>
  );
}

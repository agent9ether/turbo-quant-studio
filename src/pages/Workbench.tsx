import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cpu, Play } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

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
        navigate("/queue");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-2">Quantization Workbench</h1>
        <p className="text-muted-foreground">Configure your exact quantization settings for Project ID: {projectId}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Engine & Strategy</CardTitle>
              <CardDescription>Select the backend toolchain handling the operation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Quantization Engine</Label>
                <Select value={engine} onValueChange={(val) => setEngine(val || "llamacpp")}>
                  <SelectTrigger><SelectValue placeholder="Select an engine" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="llamacpp">llama.cpp (Best for GGUF)</SelectItem>
                    <SelectItem value="bitsandbytes" disabled>bitsandbytes (Coming Soon)</SelectItem>
                    <SelectItem value="torchao" disabled>TorchAO (Coming Soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Quantization Level (Preset)</Label>
                <Select value={preset} onValueChange={(val) => setPreset(val || "q4_k_m")}>
                  <SelectTrigger><SelectValue placeholder="Select a preset" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="q4_k_m">Q4_K_M (Recommended Balanced)</SelectItem>
                    <SelectItem value="q5_k_m">Q5_K_M (Higher Quality)</SelectItem>
                    <SelectItem value="q8_0">Q8_0 (8-bit High Quality)</SelectItem>
                    <SelectItem value="q3_k_m">Q3_K_M (Max Compression)</SelectItem>
                    <SelectItem value="f16">F16 (Half Precision - No Quant)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5"/> Resource Estimate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Est. Peak RAM:</span>
                <span className="font-mono">~32 GB</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Est. Time:</span>
                <span className="font-mono">5 - 15 mins</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Output Format:</span>
                <span className="font-mono">{engine === 'llamacpp' ? 'GGUF' : 'HF Weights'}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={startJob} disabled={isSubmitting} className="w-full font-bold" size="lg">
                <Play className="h-4 w-4 mr-2" fill="currentColor" />
                {isSubmitting ? "Starting..." : "Start Quantization"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

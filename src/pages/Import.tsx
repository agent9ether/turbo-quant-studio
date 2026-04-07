import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2, FolderSearch, PlusCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";

interface ValidationResult {
  valid: boolean;
  is_gguf: boolean;
  is_dir: boolean;
  architecture: string;
  message: string;
}

export function ImportPage() {
  const [modelPath, setModelPath] = useState("");
  const [projectName, setProjectName] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [success, setSuccess] = useState(false);

  const handleValidate = async () => {
    if (!modelPath) return;
    setIsValidating(true);
    setValidationResult(null);
    setSuccess(false);

    try {
      const res = await fetch(`${API_BASE_URL}/system/validate-model`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: modelPath }),
      });
      const data = await res.json();
      setValidationResult(data);
      if (data.valid) toast.success("Model signature verified.");
      else toast.error("Invalid model source.");
    } catch (e: any) {
      setValidationResult({
        valid: false,
        is_gguf: false,
        is_dir: false,
        architecture: "error",
        message: "Failed to connect to backend: " + e.message,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!validationResult?.valid) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName || modelPath.split('/').pop() || "New Project",
          source_path: modelPath,
          architecture: validationResult.architecture,
          notes: validationResult.is_gguf ? "Imported GGUF Binary" : "Imported HF Directory",
        }),
      });
      if (res.ok) {
        setSuccess(true);
        toast.success("Project initialized successfully.");
      }
    } catch (e: any) {
      toast.error("Failed to create project.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-8 cyber-grid min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-widest text-white">Initialize Project</h1>
          <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-mono">Stage local model resources for quantization</p>
        </div>

        <Card className="bg-[#161b22] border-white/10 cyber-glow overflow-hidden">
          <CardHeader className="bg-black/20 border-b border-white/5">
            <CardTitle className="text-white flex items-center gap-2 text-sm uppercase tracking-widest">
              <FolderSearch className="h-4 w-4 text-cyan-500" />
              Source_Configuration
            </CardTitle>
            <CardDescription className="text-white/40 text-[11px] font-mono">
              Provide absolute path to model weights or configuration directory.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="path" className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Host_Target_Path</Label>
              <div className="flex gap-3">
                <Input 
                  id="path" 
                  placeholder="/home/user/models/Llama-3-8B" 
                  className="bg-black/40 border-white/10 text-white font-mono h-11 focus:border-cyan-500/50"
                  value={modelPath}
                  onChange={(e) => setModelPath(e.target.value)}
                />
                <Button 
                  className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500 hover:text-black font-black uppercase tracking-widest px-6"
                  onClick={handleValidate} 
                  disabled={isValidating || !modelPath}
                >
                  {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                </Button>
              </div>
            </div>

            {validationResult && (
              <div className={`p-6 rounded-xl border ${validationResult.valid ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"} space-y-4`}>
                <div className="flex items-center gap-3">
                  {validationResult.valid ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertCircle className="h-5 w-5 text-rose-400" />}
                  <span className={`font-black uppercase tracking-widest text-sm ${validationResult.valid ? "text-emerald-400" : "text-rose-400"}`}>
                    {validationResult.valid ? "Signature_Verified" : "Validation_Error"}
                  </span>
                </div>
                <p className="text-white/60 text-xs font-mono lowercase tracking-tighter">{validationResult.message}</p>
                
                {validationResult.valid && (
                  <div className="p-4 bg-black/40 rounded-lg border border-white/5 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-white/20 uppercase block">Topology</span>
                      <span className="text-xs font-mono text-cyan-400">{validationResult.architecture}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-white/20 uppercase block">Encoding</span>
                      <span className="text-xs font-mono text-cyan-400">{validationResult.is_gguf ? "GGUF BINARY" : "HF SAFETENSORS"}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {validationResult?.valid && (
              <div className="space-y-2 pt-4 border-t border-white/5">
                <Label htmlFor="name" className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Internal_Project_Name</Label>
                <Input 
                  id="name" 
                  placeholder="Local Quant Cluster Alpha" 
                  className="bg-black/40 border-white/10 text-white font-mono h-11 focus:border-cyan-500/50"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="p-6 bg-black/20 border-t border-white/5 flex justify-between">
            <Button 
                variant="ghost" 
                className="text-white/20 hover:text-white/40 transition-colors uppercase text-[10px] font-black"
                onClick={() => { setModelPath(''); setValidationResult(null); }}
            >
                Purge_Input
            </Button>
            <Button 
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase tracking-widest px-8 h-12"
              disabled={!validationResult?.valid || isSaving || success} 
              onClick={handleImport}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
              {success ? "Initialized!" : "Deploy Project"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

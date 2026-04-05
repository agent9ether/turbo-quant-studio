import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2, FolderSearch } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { API_BASE_URL } from "@/lib/api";

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
          notes: validationResult.is_gguf ? "Imported GGUF" : "Imported Hugging Face Directory",
        }),
      });
      if (res.ok) {
        setSuccess(true);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-2">Import Model</h1>
        <p className="text-muted-foreground">Select a local directory or GGUF model file to start a new quantization project.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Model Path</CardTitle>
          <CardDescription>
            Enter the absolute path to your local model. This can be a directory containing `config.json` and safetensors, or a single `.gguf` file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="path">Absolute File Path</Label>
            <div className="flex gap-2">
              <Input 
                id="path" 
                placeholder="/home/user/models/Llama-3-8B-Instruct" 
                value={modelPath}
                onChange={(e) => setModelPath(e.target.value)}
              />
              <Button variant="secondary" onClick={handleValidate} disabled={isValidating || !modelPath}>
                {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderSearch className="h-4 w-4 mr-2" />}
                {isValidating ? "Validating..." : "Validate"}
              </Button>
            </div>
          </div>

          {validationResult && (
            <Alert variant={validationResult.valid ? "default" : "destructive"} className={validationResult.valid ? "border-green-500 text-green-600 dark:text-green-400" : ""}>
              {validationResult.valid ? <CheckCircle2 className="h-4 w-4 stroke-current" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{validationResult.valid ? "Valid Model Detected" : "Invalid Path"}</AlertTitle>
              <AlertDescription className="space-y-2 mt-2 text-foreground">
                <p>{validationResult.message}</p>
                {validationResult.valid && (
                  <div className="bg-muted p-3 rounded-md text-sm border">
                    <p><strong>Architecture:</strong> <span className="font-mono bg-background px-1 py-0.5 rounded text-xs">{validationResult.architecture}</span></p>
                    <p><strong>Format:</strong> {validationResult.is_gguf ? "GGUF Binary" : "Hugging Face / Safetensors"}</p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {validationResult?.valid && (
            <div className="grid w-full items-center gap-1.5 pt-4 border-t">
              <Label htmlFor="name">Project Name</Label>
              <Input 
                id="name" 
                placeholder="My Awesome Quant" 
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/20 py-4">
          <Button variant="outline" onClick={() => { setModelPath(''); setValidationResult(null); }}>Clear</Button>
          <Button 
            disabled={!validationResult?.valid || isSaving || success} 
            onClick={handleImport}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {success ? "Imported!" : "Create Project"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

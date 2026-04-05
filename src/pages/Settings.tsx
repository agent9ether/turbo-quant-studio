import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Terminal } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export function SettingsPage() {
  const [logs, setLogs] = useState<string>("");
  const [isInstalling, setIsInstalling] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleInstallLlama = async () => {
    setIsInstalling(true);
    setLogs("");

    try {
      const response = await fetch(`${API_BASE_URL}/system/install-llama`, {
        method: "POST",
      });

      if (!response.body) {
        throw new Error("No response body returned from server.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let done = false;
      while (!done) {
        const { value, done: isDone } = await reader.read();
        done = isDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          setLogs((prev) => prev + chunk);
        }
      }
    } catch (error: any) {
      setLogs((prev) => prev + `\n\nERROR: ${error.message}\n`);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure application settings and manage local backend engines.</p>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Engine Management: llama.cpp</CardTitle>
          <CardDescription>
            Download and build the latest version of <code>llama.cpp</code> from source locally. This requires <code>git</code> and <code>make</code> (along with a C++ compiler) installed on your system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-[450px]">
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5 select-none">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Build Console</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/5" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/5" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/5" />
              </div>
            </div>
            
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed text-emerald-500/90 selection:bg-emerald-500/20 max-h-[500px]"
            >
              <div className="whitespace-pre-wrap">
                {logs || (
                  <span className="text-muted-foreground/40 italic">
                    Ready to build. Click "Install/Update" to begin compilation...
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 flex justify-between border-t py-4">
          <p className="text-sm text-muted-foreground">
            Make sure you have enough disk space before continuing.
          </p>
          <Button 
            onClick={handleInstallLlama} 
            disabled={isInstalling}
            variant={isInstalling ? "secondary" : "default"}
          >
            {isInstalling ? "Installing..." : "Install/Update llama.cpp"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

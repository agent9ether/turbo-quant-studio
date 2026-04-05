import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Cpu, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export function PlaygroundPage() {
  const [searchParams] = useSearchParams();
  const modelPath = searchParams.get("model");
  const [loading, setLoading] = useState(false);
  
  const [messages, setMessages] = useState([
    { 
      role: "assistant", 
      content: modelPath 
        ? `Model loaded: ${modelPath.split('/').pop()}. How can I help you today?` 
        : "Hello! No model is currently loaded. Select a project or quantized model to begin." 
    }
  ]);
  const [input, setInput] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !modelPath) return;
    
    setLoading(true);
    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    // Add a placeholder for the assistant's response
    const assistantPlaceholder = { role: "assistant", content: "" };
    setMessages(prev => [...prev, assistantPlaceholder]);

    try {
      const response = await fetch(`${API_BASE_URL}/inference/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_path: modelPath,
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to get response from model.");
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Could not read response stream.");

      const decoder = new TextDecoder();
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          
          const rawData = line.replace("data: ", "").trim();
          if (rawData === "[DONE]") break;

          try {
            const parsed = JSON.parse(rawData);
            
            // Handle error in stream
            if (parsed.error) {
              throw new Error(parsed.error.message);
            }

            const token = parsed.choices?.[0]?.delta?.content || "";
            assistantContent += token;

            // Update the last message in real-time
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content: assistantContent };
              return updated;
            });
          } catch (e) {
            console.warn("Could not parse stream chunk:", rawData);
          }
        }
      }
    } catch (error: any) {
      console.error("[Inference] Chat Error:", error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { 
          role: "assistant", 
          content: `Error: ${error.message}` 
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Playground</h1>
        <p className="text-muted-foreground">Test chat completions locally using your configured models.</p>
      </div>

      <Card className="flex-1 flex flex-col max-w-4xl shadow-md border-border overflow-hidden">
        <CardHeader className="bg-muted/50 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Local Chat Interface</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Cpu className="h-3 w-3" />
              {modelPath ? `Model: ${modelPath.split('/').pop()}` : "No model selected"}
            </CardDescription>
          </div>
          <div className="text-xs text-muted-foreground bg-background px-2 py-1 rounded border">
            Engine: llama.cpp
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === "assistant" ? "flex-row" : "flex-row-reverse"}`}>
                  <div className={`p-2 rounded-full h-10 w-10 flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {msg.role === "assistant" ? <Bot size={20} /> : <User size={20} />}
                  </div>
                  <div className={`p-3 rounded-lg max-w-[80%] whitespace-pre-wrap ${msg.role === "assistant" ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"}`}>
                    {msg.content || (loading && idx === messages.length - 1 ? <Loader2 className="h-4 w-4 animate-spin" /> : "")}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="p-4 border-t bg-card mt-auto">
          <form 
            className="flex w-full gap-2"
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          >
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..." 
              className="flex-1"
            />
            <Button type="submit" disabled={!input.trim() || loading || !modelPath}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {loading ? "Thinking..." : "Send"}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}

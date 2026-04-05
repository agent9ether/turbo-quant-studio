import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import { HardDrive, Settings, Database, Activity, Cpu, LayoutDashboard, PlusCircle, MessageSquare } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DashboardPage } from "./pages/Dashboard";
import { SettingsPage } from "./pages/Settings";
import { ImportPage } from "./pages/Import";
import { ProjectsPage } from "./pages/Projects";
import { WorkbenchPage } from "./pages/Workbench";
import { QueuePage } from "./pages/Queue";
import { DiagnosticsPage } from "./pages/Diagnostics";
import { PlaygroundPage } from "./pages/Playground";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function Layout() {
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", to: "/" },
    { icon: Activity, label: "Jobs", to: "/queue" },
    { icon: PlusCircle, label: "Import", to: "/import" },
    { icon: Database, label: "Models", to: "/projects" },
    { icon: Cpu, label: "Analytics", to: "/diagnostics" },
    { icon: MessageSquare, label: "Playground", to: "/playground" },
    { icon: Settings, label: "Settings", to: "/settings" },
  ];

  return (
    <div className="flex h-screen w-full bg-[#0d1117] text-foreground dark font-sans flex-col selection:bg-cyan-500/30">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-8 z-50 shrink-0">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg cyber-glow">
              <HardDrive className="h-5 w-5 text-white" />
            </div>
            <h1 className="font-black text-xl tracking-widest text-white italic uppercase">
              TurboQuant <span className="text-cyan-500 not-italic font-light opacity-50">Studio</span>
            </h1>
          </div>
          
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 uppercase tracking-wider",
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      : "text-white/40 hover:text-white/80 hover:bg-white/5"
                  )
                }
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
           <div className="h-8 w-px bg-white/5 mx-2" />
           <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-white/20 transition-colors cursor-pointer group">
              <div className="h-6 w-6 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-transparent group-hover:ring-cyan-500/30 transition-all">
                A
              </div>
              <span className="text-xs font-bold text-white/60">agent9ether</span>
           </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/workbench/:projectId" element={<WorkbenchPage />} />
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/playground" element={<PlaygroundPage />} />
          <Route path="/diagnostics" element={<DiagnosticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

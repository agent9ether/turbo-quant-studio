import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import { Database, Cpu, HardDrive, Settings, Activity, PlusCircle, MessageSquare } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
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

// Main Sidebar Layout
function Layout() {
  const navItems = [
    { icon: PlusCircle, label: "Import", to: "/" },
    { icon: Database, label: "Projects", to: "/projects" },
    { icon: Activity, label: "Job Queue", to: "/queue" },
    { icon: MessageSquare, label: "Playground", to: "/playground" },
    { icon: Cpu, label: "Hardware", to: "/diagnostics" },
    { icon: Settings, label: "Settings", to: "/settings" },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground dark">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="font-bold text-xl tracking-tight flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-primary" />
            TurboQuant
          </h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<ImportPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/workbench/:projectId" element={<WorkbenchPage />} />
            <Route path="/queue" element={<QueuePage />} />
            <Route path="/playground" element={<PlaygroundPage />} />
            <Route path="/diagnostics" element={<DiagnosticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
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

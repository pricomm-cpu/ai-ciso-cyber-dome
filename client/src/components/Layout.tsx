import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Shield, AlertTriangle, CheckSquare, Cpu, Zap,
  BarChart3, Menu, Bell, ClipboardCheck, Plug, Bot
} from "lucide-react";

const NAV = [
  { path: "/",             label: "Command Centre",   icon: BarChart3 },
  { path: "/threats",      label: "Threat Monitor",   icon: AlertTriangle },
  { path: "/compliance",   label: "Compliance",       icon: CheckSquare },
  { path: "/tech-stack",   label: "Tech Stack",       icon: Cpu },
  { path: "/incidents",    label: "Incidents",        icon: Zap },
  { path: "/assessment",   label: "Posture Assessment", icon: ClipboardCheck },
  { path: "/board-report", label: "Board Report",     icon: BarChart3 },
  { path: "/connectors",   label: "Connectors",        icon: Plug },
  { path: "/agents",       label: "Agent Swarm",       icon: Bot },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-60 flex flex-col
        bg-card border-r border-border
        transform transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <div className="w-8 h-8 flex-shrink-0 relative">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" aria-label="AI CISO logo">
              <rect width="32" height="32" rx="6" fill="hsl(192 100% 42% / 0.12)" />
              <path d="M16 5 L23 9 L23 18 Q23 24 16 27 Q9 24 9 18 L9 9 Z" stroke="hsl(192 100% 42%)" strokeWidth="1.5" fill="none" />
              <circle cx="16" cy="17" r="3" fill="hsl(192 100% 42%)" />
              <circle cx="16" cy="17" r="1.5" fill="hsl(220 20% 6%)" />
              <path d="M13 9.5 L16 8 L19 9.5" stroke="hsl(192 100% 42% / 0.5)" strokeWidth="1" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold text-foreground tracking-tight leading-none">AI CISO</div>
            <div className="text-xs text-cyan-400 mt-0.5 ai-pulse">Autonomous · 24/7</div>
          </div>
        </div>

        {/* Org chip */}
        <div className="mx-3 mt-3 mb-1 px-2.5 py-2 rounded-md bg-secondary border border-border">
          <div className="text-xs text-muted-foreground">Tenant</div>
          <div className="text-xs font-medium text-foreground truncate">Acme Technologies Pty Ltd</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {NAV.map(({ path, label, icon: Icon }) => {
            const active = location === path;
            return (
              <Link key={path} href={path}>
                <a
                  data-testid={`nav-${path.replace("/","") || "home"}`}
                  className={`sidebar-link ${active ? "active" : ""}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={15} />
                  <span className="text-xs">{label}</span>
                </a>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            AI agent active · no SI needed
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <button className="lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(true)} data-testid="button-menu">
            <Menu size={20} />
          </button>
          <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
            <Shield size={13} className="text-cyan-400" />
            Security Operations · Live
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-muted-foreground hover:text-foreground" data-testid="button-notifications">
              <Bell size={17} />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] flex items-center justify-center font-bold">3</span>
            </button>
            <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-[10px] font-bold text-cyan-400">
              AI
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-5">
          {children}
        </main>
      </div>
    </div>
  );
}

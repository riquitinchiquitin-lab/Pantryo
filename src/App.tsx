import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Code2,
  Sparkles,
  Database,
  Layers,
  ShieldCheck,
  Users,
  Cpu,
  TrendingUp,
  Leaf,
  Box,
  Snowflake,
  Refrigerator,
  Boxes,
  Package,
  Server,
  Zap,
  CheckCircle2,
  ChefHat,
  Flame,
  MonitorSmartphone,
  Download,
  Share,
  X,
} from 'lucide-react';
import { MobileSimulator } from './components/MobileSimulator';
import { CodebaseExplorer } from './components/CodebaseExplorer';
import { PantryoLogo } from './components/PantryoLogo';

export default function App() {
  const [activeView, setActiveView] = useState<'webapp' | 'frame' | 'code'>('webapp');
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosInstallModal, setShowIosInstallModal] = useState(false);
  const [serverStatus, setServerStatus] = useState<{ healthy: boolean; gemini: boolean }>({
    healthy: true,
    gemini: true,
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setServerStatus({
          healthy: data.status === 'ok',
          gemini: data.geminiConfigured ?? true,
        });
      })
      .catch(() => {
        setServerStatus({ healthy: false, gemini: false });
      });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choice: any) => {
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setInstallPrompt(null);
      });
    } else {
      setShowIosInstallModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7EE] text-[#133E3B] flex flex-col font-sans selection:bg-teal-200">
      {/* Principal Engineering Top Bar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-[#E5DFD0] sticky top-0 z-40 px-4 sm:px-6 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo & Stack info */}
          <div className="flex items-center gap-3">
            <PantryoLogo size={42} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-[#0D3B37] tracking-tight">Pantryo</h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80 tracking-wider">
                  Bento Box Architecture
                </span>
              </div>
              <p className="text-xs text-[#527470]">
                Expo (React Native) · Node.js Express · Prisma PostgreSQL · Gemini Flash Vision
              </p>
            </div>
          </div>

          {/* Mode Switcher & Install */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-[#F0EBE0] rounded-2xl border border-[#E0D9C8]">
              <button
                id="view-webapp-btn"
                onClick={() => setActiveView('webapp')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeView === 'webapp'
                    ? 'bg-white text-[#0D3B37] shadow-xs'
                    : 'text-[#5C7874] hover:text-[#0D3B37]'
                }`}
              >
                <MonitorSmartphone className="w-3.5 h-3.5 text-teal-700" />
                <span>Web App</span>
              </button>

              <button
                id="view-mobile-frame-btn"
                onClick={() => setActiveView('frame')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeView === 'frame'
                    ? 'bg-white text-[#0D3B37] shadow-xs'
                    : 'text-[#5C7874] hover:text-[#0D3B37]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-teal-700" />
                <span>Phone Frame</span>
              </button>

              <button
                id="view-codebase-btn"
                onClick={() => setActiveView('code')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeView === 'code'
                    ? 'bg-white text-[#0D3B37] shadow-xs'
                    : 'text-[#5C7874] hover:text-[#0D3B37]'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-teal-700" />
                <span>Server & API</span>
              </button>
            </div>

            {!isInstalled && (
              <button
                id="install-pwa-header-btn"
                onClick={handleInstallClick}
                className="px-3 py-1.5 rounded-xl bg-[#0E766E] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:bg-[#0A5852] active:scale-95 transition-all"
                title="Install Pantryo as a Web App on your phone or computer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Install App</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col items-center justify-center">
        {activeView === 'preview' ? (
          <div className="w-full flex flex-col items-center space-y-6">
            <div className="text-center max-w-xl space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF4F2] border border-[#CDE3DF] text-xs font-extrabold text-[#0D4B46]">
                <Layers className="w-3.5 h-3.5 text-teal-700" />
                Bento Box UI Design System
              </div>
              <p className="text-xs text-[#527470]">
                Modular compartments for real-time inventory, zero-waste telemetry, short-term expiration alerts, and camera-first Gemini Flash Vision scanning.
              </p>
            </div>

            {/* BENTO DASHBOARD CONTAINER (Wings on Desktop, Centered Mobile Simulator) */}
            <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
              {/* LEFT BENTO WING (Desktop) */}
              <div className="hidden lg:flex flex-col w-72 space-y-4 shrink-0">
                {/* Bento Box 1: Household Ecosystem */}
                <div className="p-4 rounded-3xl bg-white border border-[#E5DFD0] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#527470]">
                      Household Bento
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                      Sync Live
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-800 border border-teal-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-teal-700" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#0D3B37]">Yan & Kriz Kitchen</h4>
                      <p className="text-[11px] text-[#527470]">Multi-user sync active</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#F2ECE0]">
                    <div className="flex -space-x-2">
                      <img
                        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
                        alt="Yan"
                        className="w-7 h-7 rounded-full border-2 border-white object-cover"
                      />
                      <img
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
                        alt="Kriz"
                        className="w-7 h-7 rounded-full border-2 border-white object-cover"
                      />
                    </div>
                    <span className="text-[11px] text-[#527470] font-medium">Both online</span>
                  </div>
                </div>

                {/* Bento Box 2: Storage Zone Capacities */}
                <div className="p-4 rounded-3xl bg-white border border-[#E5DFD0] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#527470]">
                      Storage Compartments
                    </span>
                    <span className="text-[10px] text-[#6A8884]">8 total items</span>
                  </div>

                  {/* Fridge */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0D3B37] flex items-center gap-1.5">
                        <Refrigerator className="w-3.5 h-3.5 text-teal-700" /> Fridge Zone
                      </span>
                      <span className="text-[11px] text-[#527470]">4 items (50%)</span>
                    </div>
                    <div className="w-full h-2 bg-teal-100 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-600 rounded-full" style={{ width: '50%' }} />
                    </div>
                  </div>

                  {/* Freezer */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0D3B37] flex items-center gap-1.5">
                        <Snowflake className="w-3.5 h-3.5 text-sky-600" /> Sub-Zero Freezer (-18°C)
                      </span>
                      <span className="text-[11px] text-[#527470]">2 items (65%)</span>
                    </div>
                    <div className="w-full h-2 bg-sky-100 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-600 rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>

                  {/* Pantry */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0D3B37] flex items-center gap-1.5">
                        <Boxes className="w-3.5 h-3.5 text-amber-600" /> Dry Pantry
                      </span>
                      <span className="text-[11px] text-[#527470]">2 items (30%)</span>
                    </div>
                    <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-600 rounded-full" style={{ width: '30%' }} />
                    </div>
                  </div>
                </div>

                {/* Bento Box 3: Zero-Waste Impact */}
                <div className="p-4 rounded-3xl bg-gradient-to-br from-[#E6F4F1] to-[#D5ECE8] border border-[#BFDFD9] shadow-2xs space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
                      <Leaf className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-teal-950">Zero-Waste Impact</span>
                  </div>
                  <p className="text-xs text-[#17524D] leading-relaxed">
                    Short-term alerts prevented <strong>$42.50</strong> in food waste this month across 6 rescued items.
                  </p>
                </div>
              </div>

              {/* CENTER: THE WEB APP / MOBILE SIMULATOR */}
              <div className={`w-full flex justify-center ${activeView === 'webapp' ? 'max-w-2xl' : 'max-w-[430px]'}`}>
                <MobileSimulator mode={activeView === 'frame' ? 'frame' : 'webapp'} />
              </div>

              {/* RIGHT BENTO WING (Desktop) */}
              <div className="hidden lg:flex flex-col w-72 space-y-4 shrink-0">
                {/* Bento Box 4: Gemini 3.8 Flash Vision */}
                <div className="p-4 rounded-3xl bg-white border border-[#E5DFD0] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#527470]">
                      Multimodal Vision
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                      Gemini 3.8 Flash
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-700 to-teal-500 text-white flex items-center justify-center shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#0D3B37]">Camera-First Scanner</h4>
                      <p className="text-[11px] text-[#527470]">Latency: ~410ms</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-[#F6FBF9] border border-[#E0EFEA] text-[11px] text-[#2D5A55] space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Strict JSON Schema</span>
                      <CheckCircle2 className="w-3 h-3 text-teal-700" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Shelf-Life Auto Calc</span>
                      <CheckCircle2 className="w-3 h-3 text-teal-700" />
                    </div>
                  </div>
                </div>

                {/* Bento Box 5: Chef Inspiration Snippet */}
                <div className="p-4 rounded-3xl bg-white border border-[#E5DFD0] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#527470]">
                      Chef Bento
                    </span>
                    <span className="text-[10px] font-bold text-teal-700">3 Ready</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <ChefHat className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-[#0D3B37]">Strawberry Parfait</h5>
                      <p className="text-[11px] text-[#527470] line-clamp-2">
                        Utilizes Organic Strawberries expiring in 1 day with chilled Greek Yogurt.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bento Box 6: Self-Hosted Infrastructure */}
                <div className="p-4 rounded-3xl bg-white border border-[#E5DFD0] shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#527470]">
                      Infrastructure
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      Docker / Proxmox
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#355B56]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Server className="w-3 h-3 text-slate-500" /> Node.js API
                      </span>
                      <span className="font-mono text-[10px] text-teal-700 font-bold">Port 3000 (Healthy)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Database className="w-3 h-3 text-slate-500" /> PostgreSQL + Prisma
                      </span>
                      <span className="font-mono text-[10px] text-teal-700 font-bold">Connected</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-4">
            <div className="text-center max-w-xl mx-auto space-y-1 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#527470]">
                Complete Architecture & Source Code
              </span>
              <h2 className="text-xl font-bold text-[#0D3B37]">Self-Hosted Multi-User Infrastructure</h2>
              <p className="text-xs text-[#527470]">
                Inspecting all deliverables: Prisma schema, Gemini Flash Vision service, Express inventory endpoints, Expo API client, and Docker Compose stack.
              </p>
            </div>
            <CodebaseExplorer />
          </div>
        )}
      </main>

      {/* iOS / Browser PWA Install Guidance Modal */}
      {showIosInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-[#FAF7EE] border border-[#E0D9C8] rounded-3xl shadow-2xl p-6 text-[#133E3B] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D5]">
              <div className="flex items-center gap-2.5">
                <PantryoLogo size={36} />
                <div>
                  <h3 className="text-base font-bold text-[#0D3B37]">Install Pantryo Web App</h3>
                  <p className="text-xs text-[#527470]">Add directly to your iPhone or Android home screen</p>
                </div>
              </div>
              <button
                onClick={() => setShowIosInstallModal(false)}
                className="w-8 h-8 rounded-full bg-white border border-[#E0D9C8] text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#2A4D48]">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-[#E5DFD0]">
                <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 font-black">
                  1
                </div>
                <div>
                  <p className="font-bold text-[#0D3B37]">On iPhone (Safari):</p>
                  <p className="text-[#527470] mt-0.5">
                    Tap the <strong className="text-teal-800">Share</strong> button (the square with an arrow pointing up <Share className="w-3.5 h-3.5 inline text-teal-700" />), scroll down and tap <strong className="text-teal-800">"Add to Home Screen"</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-[#E5DFD0]">
                <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 font-black">
                  2
                </div>
                <div>
                  <p className="font-bold text-[#0D3B37]">On Android (Chrome) or PC (Edge/Chrome):</p>
                  <p className="text-[#527470] mt-0.5">
                    Tap the three dots menu ⋮ in the browser bar and select <strong className="text-teal-800">"Install App"</strong> or <strong className="text-teal-800">"Add to Home Screen"</strong>.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosInstallModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#0E766E] hover:bg-[#0B5C56] text-white text-xs font-bold transition-all shadow-2xs"
            >
              Got It!
            </button>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <footer className="py-4 border-t border-[#E5DFD0] text-center text-xs text-[#527470] bg-[#F2EDE0]/80">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PantryoLogo size={20} />
            <span className="font-bold text-[#0D3B37]">Pantryo</span>
            <span className="text-slate-400">·</span>
            <span>Bento Box Architecture</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" /> Multi-Tenant Active
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-teal-700" /> Gemini Flash Vision 3.8
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

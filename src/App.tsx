import React, { useState, useEffect } from 'react';
import { MobileSimulator } from './components/MobileSimulator';
import { PantryoLogo } from './components/PantryoLogo';
import { Share, X } from 'lucide-react';

export default function App() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosInstallModal, setShowIosInstallModal] = useState(false);

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
      <main className="flex-1 w-full flex justify-center sm:py-6">
        <MobileSimulator
          mode="webapp"
          onInstall={handleInstallClick}
          isInstalled={isInstalled}
        />
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
    </div>
  );
}

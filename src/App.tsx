import React, { useState, useEffect } from 'react';
import { MobileSimulator } from './components/MobileSimulator';
import { PantryoLogo } from './components/PantryoLogo';
import { Share, X } from 'lucide-react';
import { LanguageProvider, useLanguage } from './utils/i18n';

function AppContent() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosInstallModal, setShowIosInstallModal] = useState(false);
  const { t, lang } = useLanguage();

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

      {/* iOS / Browser PWA Install Guidance (Full Screen with Exit Button) */}
      {showIosInstallModal && (
        <div className="fixed inset-0 z-50 bg-[#FAF7EE] flex flex-col w-full h-full overflow-hidden text-[#133E3B] animate-fade-in">
          <div className="px-5 py-3.5 bg-white border-b border-[#E8E2D5] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <PantryoLogo size={32} />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#0D3B37]">
                  {t('install_modal_title')}
                </h3>
                <p className="text-[11px] text-[#527470]">
                  {t('install_modal_subtitle')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowIosInstallModal(false)}
              className="px-3.5 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
              title={lang === 'FR' ? 'Quitter' : 'Exit'}
            >
              <X className="w-4 h-4" />
              <span>{lang === 'FR' ? 'Quitter' : 'Exit'}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 max-w-lg mx-auto w-full flex flex-col justify-center space-y-4">
            <div className="space-y-3 text-xs text-[#2A4D48]">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-[#E5DFD0] shadow-2xs">
                <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 font-black">
                  1
                </div>
                <div>
                  <p className="font-bold text-sm text-[#0D3B37]">
                    {t('install_step_iphone_title')}
                  </p>
                  <p className="text-[#527470] mt-1 text-xs">
                    {lang === 'FR' ? (
                      <>
                        Touchez le bouton <strong className="text-teal-800">Partager</strong> (le carré avec la flèche <Share className="w-3.5 h-3.5 inline text-teal-700" />), faites défiler et touchez <strong className="text-teal-800">« Sur l'écran d'accueil »</strong>.
                      </>
                    ) : (
                      <>
                        Tap the <strong className="text-teal-800">Share</strong> button (the square with an arrow pointing up <Share className="w-3.5 h-3.5 inline text-teal-700" />), scroll down and tap <strong className="text-teal-800">"Add to Home Screen"</strong>.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-[#E5DFD0] shadow-2xs">
                <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 font-black">
                  2
                </div>
                <div>
                  <p className="font-bold text-sm text-[#0D3B37]">
                    {t('install_step_android_title')}
                  </p>
                  <p className="text-[#527470] mt-1 text-xs">
                    {lang === 'FR' ? (
                      <>
                        Touchez le menu à trois points ⋮ dans votre navigateur et sélectionnez <strong className="text-teal-800">« Installer l'application »</strong> ou <strong className="text-teal-800">« Ajouter à l'écran d'accueil »</strong>.
                      </>
                    ) : (
                      <>
                        Tap the three dots menu ⋮ in the browser bar and select <strong className="text-teal-800">"Install App"</strong> or <strong className="text-teal-800">"Add to Home Screen"</strong>.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosInstallModal(false)}
              className="w-full py-3 rounded-2xl bg-[#0E766E] hover:bg-[#0B5C56] text-white text-xs font-bold transition-all shadow-xs"
            >
              {t('btn_got_it')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}


import React, { useState } from 'react';
import { Download, Share, PlusSquare, CheckCircle2, X, Smartphone, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../utils/i18n';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'pill' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'pill',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { lang } = useLanguage();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showGeneralModal, setShowGeneralModal] = useState(false);

  // If already running as installed standalone PWA, hide or return null
  if (isInstalled) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-900/10 text-teal-800 text-[11px] font-bold border border-teal-700/20 ${className}`}>
        <CheckCircle2 className="w-3 h-3 text-teal-700" />
        <span>{lang === 'FR' ? 'Appli installée' : 'App Installed'}</span>
      </div>
    );
  }

  const handleInstallClick = () => {
    if (isInstallable) {
      install();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // General installation instructions for other browsers / desktop
      setShowGeneralModal(true);
    }
  };

  return (
    <>
      {variant === 'compact' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          title={lang === 'FR' ? "Installer l'application Pantryo sur iOS ou Android" : 'Install Pantryo app on iOS or Android'}
          className={`p-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0D3B37] border border-teal-200 shadow-2xs active:scale-95 transition-all flex items-center justify-center ${className}`}
        >
          <Download className="w-4 h-4 text-teal-700" />
        </button>
      ) : variant === 'banner' ? (
        <div className={`p-3 sm:p-4 rounded-2xl bg-teal-900 text-white flex items-center justify-between gap-3 shadow-md ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800 border border-teal-700 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm">
                {lang === 'FR' ? 'Installer Pantryo sur votre écran d’accueil' : 'Install Pantryo on your home screen'}
              </p>
              <p className="text-[11px] text-teal-200">
                {lang === 'FR' ? 'Accès rapide hors-ligne, caméra plein écran sur iOS & Android' : 'Fast offline access & fullscreen camera on iOS & Android'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="py-2 px-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#0A2E2B] font-extrabold text-xs shrink-0 flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{lang === 'FR' ? 'Installer' : 'Install'}</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleInstallClick}
          title={lang === 'FR' ? "Installer Pantryo sur votre téléphone ou ordinateur" : 'Install Pantryo on phone or desktop'}
          className={`px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-black text-xs flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all active:scale-95 ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-teal-200" />
          <span>{lang === 'FR' ? 'Installer l’Appli' : 'Install App'}</span>
        </button>
      )}

      {/* iOS Safari Installation Guidance Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-60 bg-[#FAF7EE] flex flex-col w-full h-full overflow-hidden text-[#133E3B] animate-fade-in">
          <div className="px-5 py-3.5 bg-white border-b border-[#E8E2D5] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#0D3B37]">
                  {lang === 'FR' ? 'Installer sur iPhone / iPad' : 'Install on iPhone / iPad'}
                </h3>
                <p className="text-[11px] text-[#527470]">
                  {lang === 'FR' ? 'Application Web Progressive (PWA)' : 'Progressive Web App (PWA)'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="px-3.5 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
              title={lang === 'FR' ? 'Quitter' : 'Exit'}
            >
              <X className="w-4 h-4" />
              <span>{lang === 'FR' ? 'Quitter' : 'Exit'}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 max-w-lg mx-auto w-full flex flex-col justify-center space-y-4">
            <div className="p-4 bg-white rounded-2xl border border-[#D5E1D2] space-y-3.5 text-xs leading-relaxed shadow-2xs">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-900 font-black flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <p className="text-slate-700">
                  {lang === 'FR' ? (
                    <>Appuyez sur le bouton <strong>Partager</strong> <Share className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" /> dans la barre de Safari (en bas sur iPhone, en haut sur iPad).</>
                  ) : (
                    <>Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" /> in the Safari toolbar (at the bottom on iPhone, top on iPad).</>
                  )}
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-900 font-black flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <p className="text-slate-700">
                  {lang === 'FR' ? (
                    <>Faites défiler et touchez <strong className="inline-flex items-center gap-1 font-bold">Sur l'écran d'accueil <PlusSquare className="w-3.5 h-3.5 text-teal-700 inline" /></strong>.</>
                  ) : (
                    <>Scroll down and tap <strong className="inline-flex items-center gap-1 font-bold">Add to Home Screen <PlusSquare className="w-3.5 h-3.5 text-teal-700 inline" /></strong>.</>
                  )}
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-900 font-black flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <p className="text-slate-700">
                  {lang === 'FR' ? (
                    <>Touchez <strong>Ajouter</strong> en haut à droite. Pantryo apparaîtra comme une vraie application sur votre écran d’accueil !</>
                  ) : (
                    <>Tap <strong>Add</strong> in the top-right corner. Pantryo will now launch like a native app from your home screen!</>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-xs transition-colors"
            >
              {lang === 'FR' ? 'Compris !' : 'Got it!'}
            </button>
          </div>
        </div>
      )}

      {/* General / Android / Desktop fallback modal */}
      {showGeneralModal && (
        <div className="fixed inset-0 z-60 bg-[#FAF7EE] flex flex-col w-full h-full overflow-hidden text-[#133E3B] animate-fade-in">
          <div className="px-5 py-3.5 bg-white border-b border-[#E8E2D5] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#0D3B37]">
                  {lang === 'FR' ? 'Installer Pantryo' : 'Install Pantryo'}
                </h3>
                <p className="text-[11px] text-[#527470]">
                  {lang === 'FR' ? 'Compatible Android, Chrome, Safari, Edge' : 'Compatible Android, Chrome, Safari, Edge'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowGeneralModal(false)}
              className="px-3.5 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
              title={lang === 'FR' ? 'Quitter' : 'Exit'}
            >
              <X className="w-4 h-4" />
              <span>{lang === 'FR' ? 'Quitter' : 'Exit'}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 max-w-lg mx-auto w-full flex flex-col justify-center space-y-4">
            <div className="p-4 bg-white rounded-2xl border border-[#D5E1D2] space-y-2.5 text-xs text-slate-700 leading-relaxed shadow-2xs">
              <p className="font-bold text-[#0D3B37]">
                {lang === 'FR' ? 'Pour installer Pantryo comme application dédiée :' : 'To install Pantryo as a dedicated app:'}
              </p>
              <ul className="list-disc pl-4 space-y-1.5">
                <li>
                  {lang === 'FR' ? (
                    <><strong>Sur Android (Chrome) :</strong> Touchez le menu ⋮ puis <em>"Ajouter à l'écran d'accueil"</em> ou <em>"Installer l'application"</em>.</>
                  ) : (
                    <><strong>On Android (Chrome):</strong> Tap the ⋮ menu and select <em>"Add to Home screen"</em> or <em>"Install app"</em>.</>
                  )}
                </li>
                <li>
                  {lang === 'FR' ? (
                    <><strong>Sur Ordinateur (Chrome/Edge) :</strong> Cliquez sur l’icône d’installation <Download className="w-3 h-3 inline text-teal-700" /> dans la barre d’adresse.</>
                  ) : (
                    <><strong>On Desktop (Chrome/Edge):</strong> Click the install icon <Download className="w-3 h-3 inline text-teal-700" /> in the browser address bar.</>
                  )}
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setShowGeneralModal(false)}
              className="w-full py-3 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-xs transition-colors"
            >
              {lang === 'FR' ? 'Fermer' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

import React, { useState } from 'react';
import { MobileSimulator } from './components/MobileSimulator';
import { PantryoLogo } from './components/PantryoLogo';
import { Share, X, Download, Smartphone, Check, Laptop } from 'lucide-react';
import { LanguageProvider, useLanguage } from './utils/i18n';
import { usePWAInstall } from './hooks/usePWAInstall';

function AppContent() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>(() => (isIOS ? 'ios' : 'android'));
  const { t, lang } = useLanguage();

  const handleInstallClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowInstallModal(true);
      }
    } else {
      setShowInstallModal(true);
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

      {/* PWA Install Guidance Modal (Phone & Desktop Instructions) */}
      {showInstallModal && (
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
              onClick={() => setShowInstallModal(false)}
              className="px-3.5 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs cursor-pointer"
              title={lang === 'FR' ? 'Quitter' : 'Exit'}
            >
              <X className="w-4 h-4" />
              <span>{lang === 'FR' ? 'Quitter' : 'Exit'}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 max-w-lg mx-auto w-full flex flex-col justify-center space-y-4">
            {/* Device Switcher Tabs */}
            <div className="flex p-1 bg-white rounded-2xl border border-[#E5DFD0] shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'ios'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-[#527470] hover:text-[#0D3B37]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>iPhone / iPad (iOS)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'android'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-[#527470] hover:text-[#0D3B37]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android & Chrome</span>
              </button>
            </div>

            {/* iOS Instructions */}
            {activeTab === 'ios' && (
              <div className="space-y-3 text-xs text-[#2A4D48] animate-fade-in">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-[#E5DFD0] shadow-2xs">
                  <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 font-black">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#0D3B37]">
                      {lang === 'FR' ? 'Ouvrez dans Safari' : 'Open in Safari'}
                    </p>
                    <p className="text-[#527470] mt-1 text-xs leading-relaxed">
                      {lang === 'FR' ? (
                        <>
                          Sur iPhone ou iPad, touchez l’icône <strong>Partager</strong> <Share className="w-3.5 h-3.5 inline text-teal-700 mx-0.5" /> dans la barre de Safari (en bas de l’écran sur iPhone).
                        </>
                      ) : (
                        <>
                          On iPhone or iPad, tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline text-teal-700 mx-0.5" /> in the Safari toolbar (at the bottom of your screen).
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
                      {lang === 'FR' ? 'Sur l’écran d’accueil' : 'Add to Home Screen'}
                    </p>
                    <p className="text-[#527470] mt-1 text-xs leading-relaxed">
                      {lang === 'FR' ? (
                        <>
                          Faites défiler le menu vers le bas et touchez <strong className="text-teal-800 font-bold">« Sur l’écran d’accueil »</strong>.
                        </>
                      ) : (
                        <>
                          Scroll down the share sheet and tap <strong className="text-teal-800 font-bold">"Add to Home Screen"</strong>.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-[#E5DFD0] shadow-2xs">
                  <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 font-black">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#0D3B37]">
                      {lang === 'FR' ? 'Confirmez « Ajouter »' : 'Confirm "Add"'}
                    </p>
                    <p className="text-[#527470] mt-1 text-xs leading-relaxed">
                      {lang === 'FR' ? (
                        <>
                          Touchez <strong>Ajouter</strong> en haut à droite. Pantryo s’installe immédiatement comme une application dédiée avec icône HD et mode plein écran !
                        </>
                      ) : (
                        <>
                          Tap <strong>Add</strong> in the top-right corner. Pantryo will install directly on your home screen with HD icon and fullscreen view!
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Android / Chrome Instructions */}
            {activeTab === 'android' && (
              <div className="space-y-3 text-xs text-[#2A4D48] animate-fade-in">
                {isInstallable && (
                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 shadow-2xs flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm text-teal-950">
                        {lang === 'FR' ? 'Installation en 1 clic disponible' : '1-Click Install Available'}
                      </p>
                      <p className="text-[11px] text-teal-800 mt-0.5">
                        {lang === 'FR' ? 'Votre navigateur prend en charge l’installation directe.' : 'Your browser supports direct installation.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await install();
                        setShowInstallModal(false);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-black text-xs shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{lang === 'FR' ? 'Installer maintenant' : 'Install Now'}</span>
                    </button>
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-[#E5DFD0] shadow-2xs">
                  <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 font-black">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#0D3B37]">
                      {lang === 'FR' ? 'Menu du navigateur (⋮)' : 'Browser Menu (⋮)'}
                    </p>
                    <p className="text-[#527470] mt-1 text-xs leading-relaxed">
                      {lang === 'FR' ? (
                        <>
                          Dans Google Chrome ou votre navigateur mobile, touchez le menu à trois points <strong>⋮</strong> dans le coin supérieur droit.
                        </>
                      ) : (
                        <>
                          In Google Chrome or your mobile browser, tap the three-dot menu <strong>⋮</strong> in the top-right corner.
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
                      {lang === 'FR' ? 'Installer l’application' : 'Install App'}
                    </p>
                    <p className="text-[#527470] mt-1 text-xs leading-relaxed">
                      {lang === 'FR' ? (
                        <>
                          Sélectionnez <strong className="text-teal-800">« Installer l'application »</strong> ou <strong className="text-teal-800">« Ajouter à l'écran d'accueil »</strong>.
                        </>
                      ) : (
                        <>
                          Select <strong className="text-teal-800">"Install app"</strong> or <strong className="text-teal-800">"Add to Home screen"</strong>.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="w-full py-3 rounded-2xl bg-[#0E766E] hover:bg-[#0B5C56] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
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

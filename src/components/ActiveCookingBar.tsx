import React, { useState } from 'react';
import {
  ChefHat,
  Maximize2,
  Play,
  Pause,
  Plus,
  X,
  Timer as TimerIcon,
  BellRing,
  AlertCircle,
} from 'lucide-react';
import { useCookingSession } from '../contexts/CookingSessionContext';
import { useLanguage } from '../utils/i18n';
import { getRecipeDisplayTitle, getRecipeDisplayInstructions } from '../utils/foodTranslator';

export const ActiveCookingBar: React.FC = () => {
  const { lang } = useLanguage();
  const {
    activeRecipe,
    isMinimized,
    currentStepIndex,
    timerSeconds,
    isTimerRunning,
    isTimerFinished,
    resumeCooking,
    exitCooking,
    toggleTimer,
    addTimerMinutes,
  } = useCookingSession();

  const [showExitConfirm, setShowExitConfirm] = useState(false);

  if (!isMinimized || !activeRecipe) return null;

  const localizedTitle = getRecipeDisplayTitle(activeRecipe, lang) || (lang === 'FR' ? 'Recette en cours' : 'Recipe in progress');
  const steps = getRecipeDisplayInstructions(activeRecipe, lang);
  const totalSteps = steps.length > 0 ? steps.length : 1;
  const currentStepNum = Math.min(currentStepIndex + 1, totalSteps);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleExitClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTimerRunning || currentStepIndex > 0) {
      setShowExitConfirm(true);
    } else {
      exitCooking();
    }
  };

  return (
    <>
      {/* Floating Active Cooking Mini-Bar across all pages */}
      <div
        className="fixed bottom-20 xl:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-slide-up"
        role="region"
        aria-label={lang === 'FR' ? 'Cuisine en cours d’exécution' : 'Active cooking session'}
      >
        <div
          onClick={resumeCooking}
          className={`group relative p-3 sm:p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container-highest,#1e293b)] text-white shadow-2xl border transition-all cursor-pointer select-none backdrop-blur-md flex items-center justify-between gap-3 ${
            isTimerFinished
              ? 'border-rose-500 bg-rose-950/95 ring-2 ring-rose-400/50'
              : isTimerRunning
              ? 'border-emerald-500/70 bg-slate-900/95 ring-2 ring-emerald-500/30'
              : 'border-slate-700 bg-slate-900/95'
          }`}
        >
          {/* Left: Chef Hat + Recipe Title & Current Step */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-xs ${
                isTimerFinished
                  ? 'bg-rose-500 text-white animate-bounce'
                  : isTimerRunning
                  ? 'bg-emerald-600 text-white'
                  : 'bg-teal-700 text-white'
              }`}
            >
              {isTimerFinished ? (
                <BellRing className="w-5 h-5 animate-pulse" />
              ) : (
                <ChefHat className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-white/10 text-emerald-300">
                  {lang === 'FR' ? `Étape ${currentStepNum}/${totalSteps}` : `Step ${currentStepNum}/${totalSteps}`}
                </span>
                <span className="text-[11px] text-slate-300 hidden xs:inline">
                  {lang === 'FR' ? 'Cuisine active' : 'Cooking in progress'}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white truncate drop-shadow-xs">
                {localizedTitle}
              </h4>
            </div>
          </div>

          {/* Center/Right: Timer Readout & Quick Controls */}
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Live Timer Pill */}
            <div
              className={`px-2 sm:px-2.5 py-1 rounded-xl text-xs font-mono font-black flex items-center gap-1 transition-all ${
                isTimerFinished
                  ? 'bg-rose-600 text-white animate-pulse'
                  : isTimerRunning
                  ? 'bg-emerald-900/90 text-emerald-200 border border-emerald-500/60'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              <TimerIcon className={`w-3.5 h-3.5 shrink-0 ${isTimerRunning ? 'text-emerald-300 animate-spin' : ''}`} />
              <span className="tracking-wider">{formatTime(timerSeconds)}</span>
            </div>

            {/* Quick Pause/Play Button */}
            <button
              type="button"
              onClick={toggleTimer}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all cursor-pointer"
              title={isTimerRunning ? (lang === 'FR' ? 'Pause' : 'Pause') : (lang === 'FR' ? 'Démarrer le minuteur' : 'Start timer')}
              aria-label={isTimerRunning ? 'Pause timer' : 'Start timer'}
            >
              {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            {/* Quick +1 Min Button */}
            <button
              type="button"
              onClick={() => addTimerMinutes(60)}
              className="px-1.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-[11px] font-bold text-white transition-all cursor-pointer flex items-center gap-0.5"
              title={lang === 'FR' ? '+1 minute au minuteur' : '+1 minute to timer'}
            >
              <Plus className="w-3 h-3" />
              <span>1m</span>
            </button>
          </div>

          {/* Right: Expand / Resume Button & Exit Button */}
          <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-white/10">
            <button
              type="button"
              onClick={resumeCooking}
              className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1 transition-all active:scale-95 shadow-xs cursor-pointer"
              title={lang === 'FR' ? 'Agrandir en plein écran' : 'Resume in full screen'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-bold">{lang === 'FR' ? 'Reprendre' : 'Resume'}</span>
            </button>

            <button
              type="button"
              onClick={handleExitClick}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              title={lang === 'FR' ? 'Quitter la recette' : 'Exit recipe'}
              aria-label={lang === 'FR' ? 'Quitter' : 'Exit'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal if user is quitting while timer running */}
      {showExitConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowExitConfirm(false)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full p-5 shadow-2xl space-y-4 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  {lang === 'FR' ? 'Quitter la cuisine ?' : 'Leave cooking session?'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'FR'
                    ? 'Le minuteur est actif. Vous pouvez minimiser la fenêtre pour naviguer dans l’application sans perdre votre progression.'
                    : 'The kitchen timer is currently running. You can keep browsing other pages without losing your timer.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  // Keeps minimized so user can browse other pages with timer running!
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs shadow-xs cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                <ChefHat className="w-4 h-4" />
                <span>
                  {lang === 'FR'
                    ? 'Continuer à naviguer (garder le minuteur)'
                    : 'Keep browsing (keep timer running)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  exitCooking();
                }}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold text-xs cursor-pointer transition-colors"
              >
                {lang === 'FR' ? 'Arrêter définitivement' : 'Stop and exit completely'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

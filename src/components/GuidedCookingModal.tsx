import React, { useState, useEffect, useRef } from 'react';
import {
  Utensils,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
  ShoppingCart,
  Sparkles,
  Timer as TimerIcon,
  Plus,
  Minus,
  ListOrdered,
  Layers,
  ChefHat,
  Info,
  Maximize2,
  Minimize2,
  Compass,
  AlertCircle,
} from 'lucide-react';
import { InventoryItem } from '../types';
import { useLanguage, LanguageSwitcher } from '../utils/i18n';
import { deductRecipeFromInventory, CookRecipeOutcome, DeductionResult } from '../utils/recipeCooker';
import { detectSafeCookingRule, SafeCookingRule } from '../utils/safeCookingInstructions';
import { getCuratedMealPhoto, getFoodSvgFallback } from '../utils/curatedFoodImages';
import {
  getRecipeDisplayTitle,
  getRecipeDisplayDescription,
  getRecipeDisplayInstructions,
  getItemDisplayName,
} from '../utils/foodTranslator';
import { formatRecipeIngredientAmount } from '../data/ricardoRecipes';
import { playAudioChime } from '../utils/audioAlert';

export interface CookingRecipeData {
  id?: string;
  title: string;
  titleFr?: string;
  titleEn?: string;
  description?: string;
  descriptionFr?: string;
  ingredients: Array<{
    name: string;
    amount?: string;
    nameFr?: string;
    nameEn?: string;
    quantity?: number;
    unit?: string;
  }>;
  instructions?: string[];
  instructionsFr?: string[];
  instructionsEn?: string[];
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings?: number | string;
  imageUrl?: string;
  safeCooking?: any;
  caloriesPerServing?: number;
  macrosPerServing?: {
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  };
  source?: string;
}

interface GuidedCookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  recipe: CookingRecipeData | null;
  inventoryItems: InventoryItem[];
  onCookRecipe: (recipe: {
    title: string;
    ingredients: Array<{ name: string; amount?: string; nameFr?: string; quantity?: number; unit?: string }>;
  }) => Promise<any> | any;
  onAddMissingToGrocery?: (item: {
    name: string;
    category?: string;
    quantity?: number;
    unit?: string;
    recipeTitle?: string;
  }) => void;
  onRecipeCookedSuccessfully?: (recipeTitle: string, deductions: DeductionResult[]) => void;
}

export const GuidedCookingModal: React.FC<GuidedCookingModalProps> = ({
  isOpen,
  onClose,
  onMinimize,
  recipe,
  inventoryItems,
  onCookRecipe,
  onAddMissingToGrocery,
  onRecipeCookedSuccessfully,
}) => {
  const { lang } = useLanguage();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [viewTab, setViewTab] = useState<'step_by_step' | 'all_steps' | 'ingredients'>('step_by_step');
  const [servingsMultiplier, setServingsMultiplier] = useState(1);
  const [isCookingCompleted, setIsCookingCompleted] = useState(false);
  const [cookingSummary, setCookingSummary] = useState<CookRecipeOutcome | null>(null);
  const [isDeducting, setIsDeducting] = useState(false);
  const [addedGroceryItems, setAddedGroceryItems] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Kitchen Timer State
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 minutes default
  const [initialTimerDuration, setInitialTimerDuration] = useState(300);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const timerIntervalRef = useRef<number | null>(null);

  // Handle browser fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Reset state when a new recipe is opened
  useEffect(() => {
    if (isOpen && recipe) {
      setCurrentStepIndex(0);
      setCompletedSteps(new Set());
      setViewTab('step_by_step');
      setServingsMultiplier(1);
      setIsCookingCompleted(false);
      setCookingSummary(null);
      setIsDeducting(false);
      setAddedGroceryItems(new Set());

      // If recipe has cookTimeMinutes, default the timer to it
      const defaultMinutes = recipe.cookTimeMinutes && recipe.cookTimeMinutes > 0 ? recipe.cookTimeMinutes : 5;
      setTimerSeconds(defaultMinutes * 60);
      setInitialTimerDuration(defaultMinutes * 60);
      setIsTimerRunning(false);
      setIsTimerFinished(false);
    }
  }, [isOpen, recipe]);

  // Timer Tick Effect
  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setIsTimerFinished(true);
            playAudioChime('timer');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, timerSeconds]);

  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const handleMinimize = () => {
    setShowExitConfirm(false);
    if (onMinimize) {
      onMinimize();
    } else {
      onClose();
    }
  };

  const handleCloseRequest = () => {
    if (isTimerRunning || currentStepIndex > 0) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  if (!isOpen || !recipe) return null;

  // Determine localized title, description, and steps based on active language
  const title = getRecipeDisplayTitle(recipe, lang) || (lang === 'FR' ? 'Recette' : 'Recipe');
  const description = getRecipeDisplayDescription(recipe, lang) || '';

  // Extract steps translated according to language
  const steps: string[] = (() => {
    const localized = getRecipeDisplayInstructions(recipe, lang);
    if (localized && localized.length > 0) return localized;
    return [
      lang === 'FR'
        ? 'Préparer et assembler tous les ingrédients sur le plan de travail.'
        : 'Prepare and assemble all ingredients on your work surface.',
      lang === 'FR'
        ? 'Suivre la cuisson et ajuster les assaisonnements selon votre goût.'
        : 'Cook and adjust seasonings to your taste.',
      lang === 'FR'
        ? 'Servir chaud et déguster votre création maison !'
        : 'Serve warm and enjoy your homemade meal!',
    ];
  })();

  // Detect food safety rule
  const safeRule: SafeCookingRule | null = recipe.safeCooking
    ? {
        category: recipe.safeCooking.targetMeat || 'Safe Cooking Guidelines',
        categoryFr: recipe.safeCooking.targetMeatFr || 'Consignes de cuisson sécuritaire',
        minTempC: recipe.safeCooking.internalTempC,
        minTempF: recipe.safeCooking.internalTempF,
        restTimeMinutes: recipe.safeCooking.restTimeMinutes || 3,
        restingTipEn: recipe.safeCooking.safetyTipEn,
        restingTipFr: recipe.safeCooking.safetyTipFr,
        standardOrg: recipe.safeCooking.standardAgency || 'Health Canada / CFIA & EFSA',
        keySafetyNotesEn: recipe.safeCooking.safetyTipEn || '',
        keySafetyNotesFr: recipe.safeCooking.safetyTipFr || '',
        color: recipe.safeCooking.color || 'amber',
      }
    : detectSafeCookingRule(recipe);

  // Pre-calculate inventory match outcome
  const previewOutcome = deductRecipeFromInventory(recipe.ingredients, inventoryItems, title);
  const matchedItemIds = new Set(previewOutcome.deductions.map((d) => d.inventoryItemId));

  // Toggle step completed
  const handleToggleStepCompleted = (index: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Perform actual inventory deduction & finalize cooking
  const handleFinishAndDeduct = async () => {
    setIsDeducting(true);
    try {
      // Calculate outcome
      const outcome = deductRecipeFromInventory(recipe.ingredients, inventoryItems, title);
      setCookingSummary(outcome);
      setIsCookingCompleted(true);
      playAudioChime('celebration');

      // Call parent handler
      await onCookRecipe({
        title,
        ingredients: recipe.ingredients,
      });

      if (onRecipeCookedSuccessfully) {
        onRecipeCookedSuccessfully(title, outcome.deductions);
      }
    } catch (e) {
      console.error('Cooking deduction failed:', e);
    } finally {
      setIsDeducting(false);
    }
  };

  // Timer helpers
  const handleSetTimerPreset = (minutes: number) => {
    setIsTimerRunning(false);
    setIsTimerFinished(false);
    const secs = minutes * 60;
    setTimerSeconds(secs);
    setInitialTimerDuration(secs);
  };

  const handleAdjustTimer = (deltaSecs: number) => {
    setTimerSeconds((prev) => {
      const next = Math.max(0, prev + deltaSecs);
      if (next > 0) setIsTimerFinished(false);
      return next;
    });
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setIsTimerFinished(false);
    setTimerSeconds(initialTimerDuration);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const timerProgress = initialTimerDuration > 0
    ? Math.max(0, Math.min(100, ((initialTimerDuration - timerSeconds) / initialTimerDuration) * 100))
    : 0;

  const currentStep = steps[currentStepIndex] || '';
  const isLastStep = currentStepIndex === steps.length - 1;

  // Curated hero image
  const heroPhoto = recipe.imageUrl?.trim() ? recipe.imageUrl : getCuratedMealPhoto(recipe.title);

  return (
    <div className="fixed inset-0 z-50 w-full h-full flex flex-col bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] overflow-hidden animate-fade-in">
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        {/* MODAL HEADER - Full width hero */}
        <div className="relative border-b border-[var(--md-sys-color-outline-variant)] shrink-0 overflow-hidden">
          {/* Hero Banner with darkened overlay */}
          <div className="h-32 sm:h-44 w-full relative bg-slate-900 overflow-hidden">
            <img
              src={heroPhoto}
              alt={title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-65"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.src = getFoodSvgFallback(recipe.title);
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--md-sys-color-surface)] via-black/40 to-black/20" />

            {/* Top Bar with Mode Badge, Timer Countdown Pill & Fullscreen / Close */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-emerald-600/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-md backdrop-blur-xs">
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>{lang === 'FR' ? 'Mode Cuisine Plein Écran' : 'Full Screen Cooking Mode'}</span>
                </span>
                {recipe.prepTimeMinutes ? (
                  <span className="px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-medium flex items-center gap-1 backdrop-blur-xs">
                    <Clock className="w-3 h-3 text-emerald-300" />
                    <span>{recipe.prepTimeMinutes + (recipe.cookTimeMinutes || 0)} min</span>
                  </span>
                ) : null}

                {/* Live Timer Countdown in Header Top Bar */}
                {(isTimerRunning || isTimerFinished) && (
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-mono font-black flex items-center gap-1.5 shadow-md backdrop-blur-md transition-all ${
                      isTimerFinished
                        ? 'bg-rose-600 text-white animate-bounce'
                        : 'bg-emerald-900/95 text-emerald-200 border border-emerald-500/60'
                    }`}
                  >
                    <TimerIcon className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
                    <span className="tracking-widest">{formatTime(timerSeconds)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Segmented Language Switcher to jump between FR and EN */}
                <LanguageSwitcher className="bg-black/60 border-white/20 text-white" />

                {/* Leave Cooking Mode to Browse App (Timer runs in background) */}
                <button
                  type="button"
                  onClick={handleMinimize}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-teal-800/90 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs shadow-md border border-teal-500/40 active:scale-95"
                  title={
                    lang === 'FR'
                      ? "Parcourir d'autres pages (le minuteur continuera de tourner en arrière-plan)"
                      : 'Browse other pages (timer will keep running in the background)'
                  }
                >
                  <Compass className="w-3.5 h-3.5 text-teal-300" />
                  <span className="hidden sm:inline">
                    {lang === 'FR' ? "Parcourir l'app" : 'Browse App'}
                  </span>
                </button>

                {/* Fullscreen browser toggle */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs shadow-md border border-white/20"
                  title={isFullscreen ? (lang === 'FR' ? 'Quitter le plein écran' : 'Exit fullscreen') : (lang === 'FR' ? 'Plein écran' : 'Toggle fullscreen')}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={handleCloseRequest}
                  className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs shadow-md border border-white/20"
                  aria-label={lang === 'FR' ? 'Quitter le mode cuisine' : 'Close cooking mode'}
                  title={lang === 'FR' ? 'Quitter' : 'Exit'}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Recipe Title & Macro Badge */}
            <div className="absolute bottom-2 left-4 right-4 max-w-4xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md truncate">
                {title}
              </h2>
            </div>
          </div>

          {/* Tab Navigation: Pas-à-pas, Toutes les étapes, Ingrédients */}
          <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 bg-[var(--md-sys-color-surface-container)] border-t border-[var(--md-sys-color-outline-variant)]">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewTab('step_by_step')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewTab === 'step_by_step'
                    ? 'm3-btn-filled shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>{lang === 'FR' ? 'Pas-à-pas' : 'Step-by-step'}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewTab('all_steps')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewTab === 'all_steps'
                    ? 'm3-btn-filled shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{lang === 'FR' ? 'Toutes les étapes' : 'All steps'}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewTab('ingredients')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewTab === 'ingredients'
                    ? 'm3-btn-filled shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>
                  {lang === 'FR' ? 'Ingrédients' : 'Ingredients'} ({recipe.ingredients.length})
                </span>
              </button>
            </div>

            {/* Quick portions multiplier */}
            <div className="hidden sm:flex items-center gap-1 text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">
              <span>{recipe.servings ? `${recipe.servings} ` : '4 '}</span>
              <span>{lang === 'FR' ? 'portions' : 'servings'}</span>
            </div>
          </div>
        </div>

        {/* RUNNING TIMER STICKY COUNTDOWN ON TOP */}
        {(isTimerRunning || isTimerFinished) && (
          <div
            className={`sticky top-0 z-40 shrink-0 px-4 sm:px-6 py-2.5 flex items-center justify-between border-b shadow-md transition-all ${
              isTimerFinished
                ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                : 'bg-emerald-950 text-white border-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="relative flex items-center justify-center">
                <TimerIcon className={`w-5 h-5 ${isTimerFinished ? 'text-white animate-bounce' : 'text-emerald-400'}`} />
                {isTimerRunning && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-emerald-200 drop-shadow-xs">
                  {formatTime(timerSeconds)}
                </span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-white">
                  {isTimerFinished
                    ? (lang === 'FR' ? '🚨 TEMPS ÉCOULÉ !' : '🚨 TIME UP!')
                    : (lang === 'FR' ? 'Minuteur actif' : 'Timer running')}
                </span>
              </div>
            </div>

            {/* Quick Actions directly on top banner */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => handleAdjustTimer(60)}
                className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all cursor-pointer"
                title="+1 min"
              >
                +1m
              </button>
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{lang === 'FR' ? 'Reprendre' : 'Resume'}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleResetTimer}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer"
                title={lang === 'FR' ? 'Réinitialiser' : 'Reset'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* MODAL BODY (Scrollable Full Screen with centered inner content) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-4xl mx-auto w-full space-y-4">
          {/* SUCCESS SCREEN IF COOKED */}
          {isCookingCompleted && cookingSummary ? (
            <div className="py-6 px-4 text-center space-y-4 animate-scale-in">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-lg border border-emerald-300">
                <Sparkles className="w-8 h-8 text-emerald-600 animate-pulse" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-[#0D3B37]">
                  {lang === 'FR' ? '🎉 Recette cuisinée avec succès !' : '🎉 Recipe Cooked Successfully!'}
                </h3>
                <p className="text-xs text-[#5D7060] mt-1 max-w-md mx-auto">
                  {lang === 'FR'
                    ? `Bravo ! Vos stocks de cuisine ont été automatiquement mis à jour pour "${title}".`
                    : `Awesome! Your kitchen inventory has been updated for "${title}".`}
                </p>
              </div>

              {/* Deductions Breakdown */}
              <div className="max-w-md mx-auto rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] p-4 text-left space-y-2">
                <span className="text-xs font-bold text-[#0D3B37] uppercase tracking-wider block">
                  {lang === 'FR' ? 'Déductions d’inventaire :' : 'Inventory Deductions:'}
                </span>

                {cookingSummary.deductions.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {cookingSummary.deductions.map((d, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]"
                      >
                        <span className="font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                          {d.inventoryItemName}
                        </span>
                        <span
                          className={`text-[11px] font-bold shrink-0 ml-2 ${
                            d.wasFullyDepleted ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {d.wasFullyDepleted
                            ? lang === 'FR' ? 'Épuisé' : 'Depleted'
                            : `${d.remainingQuantity} ${d.remainingUnit} ${lang === 'FR' ? 'restant' : 'left'}`}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    {lang === 'FR'
                      ? 'Aucun ingrédient de votre cuisine n’a été déduit (ingrédients non répertoriés).'
                      : 'No ingredients deducted from kitchen pantry.'}
                  </p>
                )}
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="m3-btn-filled py-2 px-6 rounded-full text-sm font-bold cursor-pointer shadow-md active:scale-95"
                >
                  {lang === 'FR' ? 'Terminer & Fermer' : 'Finish & Close'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* FOOD SAFETY RULE BANNER */}
              {safeRule && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-950 flex items-start gap-3 shadow-2xs">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-800">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-xs space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="font-black text-amber-900 uppercase tracking-wide">
                        {lang === 'FR' ? safeRule.categoryFr : safeRule.category}
                      </span>
                      {safeRule.minTempC ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-extrabold text-[11px]">
                          🌡️ {safeRule.minTempC}°C ({safeRule.minTempF}°F)
                        </span>
                      ) : null}
                    </div>
                    <p className="text-amber-900/90 leading-relaxed">
                      {lang === 'FR' ? safeRule.keySafetyNotesFr : safeRule.keySafetyNotesEn}
                    </p>
                    {safeRule.restTimeMinutes ? (
                      <p className="text-[11px] font-bold text-amber-800">
                        ⏳ {lang === 'FR' ? `Temps de repos recommandé : ${safeRule.restTimeMinutes} min` : `Recommended rest time: ${safeRule.restTimeMinutes} min`}
                      </p>
                    ) : null}
                  </div>
                </div>
              )}

              {/* INTEGRATED KITCHEN TIMER */}
              <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#0D3B37] flex items-center gap-1.5 uppercase tracking-wider">
                    <TimerIcon className="w-4 h-4 text-emerald-600" />
                    {lang === 'FR' ? 'Minuteur de Cuisson' : 'Kitchen Timer'}
                  </span>

                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-1">
                    {[1, 3, 5, 10, 15, 20].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleSetTimerPreset(mins)}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] transition-all cursor-pointer"
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timer Display & Controls */}
                <div className="flex items-center justify-between gap-3 bg-[var(--md-sys-color-surface)] p-2.5 rounded-xl border border-[var(--md-sys-color-outline-variant)]">
                  {/* Countdown Digital Display */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`font-mono text-2xl sm:text-3xl font-black tracking-wider transition-colors ${
                        isTimerFinished
                          ? 'text-rose-600 animate-pulse'
                          : isTimerRunning
                          ? 'text-emerald-700'
                          : 'text-[#0D3B37]'
                      }`}
                    >
                      {formatTime(timerSeconds)}
                    </div>
                    {isTimerFinished && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black animate-bounce">
                        {lang === 'FR' ? 'TEMPS ÉCOULÉ !' : 'TIME UP!'}
                      </span>
                    )}
                  </div>

                  {/* Adjustment Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAdjustTimer(-60)}
                      className="p-1.5 rounded-lg bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-all cursor-pointer"
                      title="-1 min"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustTimer(60)}
                      className="p-1.5 rounded-lg bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-all cursor-pointer"
                      title="+1 min"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    {/* Play/Pause */}
                    <button
                      type="button"
                      onClick={() => {
                        if (timerSeconds === 0) setTimerSeconds(300);
                        setIsTimerRunning(!isTimerRunning);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 ${
                        isTimerRunning
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      }`}
                    >
                      {isTimerRunning ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>{lang === 'FR' ? 'Pause' : 'Pause'}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>{lang === 'FR' ? 'Démarrer' : 'Start'}</span>
                        </>
                      )}
                    </button>

                    {/* Reset */}
                    <button
                      type="button"
                      onClick={handleResetTimer}
                      className="p-1.5 rounded-lg bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-all cursor-pointer"
                      title={lang === 'FR' ? 'Réinitialiser' : 'Reset'}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                {initialTimerDuration > 0 && (
                  <div className="w-full h-1.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isTimerFinished ? 'bg-rose-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${timerProgress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* TAB 1: STEP-BY-STEP VIEW */}
              {viewTab === 'step_by_step' && (
                <div className="space-y-4">
                  {/* Stepper Progress Header */}
                  <div className="flex items-center justify-between text-xs font-bold text-[#556D58]">
                    <span>
                      {lang === 'FR'
                        ? `Étape ${currentStepIndex + 1} sur ${steps.length}`
                        : `Step ${currentStepIndex + 1} of ${steps.length}`}
                    </span>
                    <span className="text-[11px] text-emerald-800">
                      {completedSteps.size} / {steps.length} {lang === 'FR' ? 'complétées' : 'completed'}
                    </span>
                  </div>

                  {/* Step Pills Bar */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {steps.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentStepIndex(idx)}
                        className={`h-2 rounded-full transition-all flex-1 min-w-[20px] cursor-pointer ${
                          idx === currentStepIndex
                            ? 'bg-emerald-600 h-2.5 shadow-xs'
                            : completedSteps.has(idx)
                            ? 'bg-emerald-300'
                            : 'bg-[var(--md-sys-color-surface-container-high)]'
                        }`}
                        title={`Étape ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {/* Active Step Large Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {currentStepIndex + 1}
                        </span>
                        <span className="font-extrabold text-sm text-[#0D3B37]">
                          {lang === 'FR' ? 'Instruction :' : 'Instruction:'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleStepCompleted(currentStepIndex)}
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          completedSteps.has(currentStepIndex)
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          {completedSteps.has(currentStepIndex)
                            ? lang === 'FR' ? 'Fait' : 'Done'
                            : lang === 'FR' ? 'Marquer fait' : 'Mark done'}
                        </span>
                      </button>
                    </div>

                    {/* Step Instruction Text - Large & clear for kitchen reading */}
                    <p className="text-sm sm:text-base text-[#1E3022] font-medium leading-relaxed bg-[var(--md-sys-color-surface)] p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] shadow-2xs">
                      {currentStep}
                    </p>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        disabled={currentStepIndex === 0}
                        onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                        className={`px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          currentStepIndex === 0
                            ? 'opacity-40 cursor-not-allowed bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'
                            : 'bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>{lang === 'FR' ? 'Précédent' : 'Previous'}</span>
                      </button>

                      {isLastStep ? (
                        <button
                          type="button"
                          disabled={isDeducting}
                          onClick={handleFinishAndDeduct}
                          className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50 animate-pulse"
                        >
                          <Utensils className="w-4 h-4" />
                          <span>
                            {isDeducting
                              ? (lang === 'FR' ? 'Mise à jour des stocks...' : 'Updating...')
                              : (lang === 'FR' ? '🍳 Terminer la cuisson & Déduire les stocks' : '🍳 Finish Cooking & Deduct Kitchen Stock')}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            handleToggleStepCompleted(currentStepIndex);
                            setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
                          }}
                          className="m3-btn-filled py-2 px-4 rounded-full text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer active:scale-95"
                        >
                          <span>{lang === 'FR' ? 'Suivant' : 'Next'}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ALL STEPS OVERVIEW */}
              {viewTab === 'all_steps' && (
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-[#556D58] uppercase tracking-wider block">
                    {lang === 'FR' ? 'Toutes les étapes de préparation :' : 'All cooking instructions:'}
                  </span>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {steps.map((step, idx) => {
                      const isDone = completedSteps.has(idx);
                      return (
                        <div
                          key={idx}
                          onClick={() => handleToggleStepCompleted(idx)}
                          className={`p-3 rounded-xl border flex items-start gap-3 transition-all cursor-pointer ${
                            isDone
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 opacity-80'
                              : 'bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold ${
                              isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isDone ? '✓' : idx + 1}
                          </div>
                          <p className={`text-xs leading-relaxed flex-1 ${isDone ? 'line-through text-slate-500' : ''}`}>
                            {step}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: INGREDIENTS & INVENTORY CHECKLIST */}
              {viewTab === 'ingredients' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-[#556D58]">
                    <span className="uppercase tracking-wider">
                      {lang === 'FR' ? 'Ingrédients & Déductions :' : 'Ingredients & Inventory:'}
                    </span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 font-black">
                      {previewOutcome.deductions.length} / {recipe.ingredients.length} {lang === 'FR' ? 'en stock' : 'in stock'}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                    {recipe.ingredients.map((ing, idx) => {
                      const ingName = getItemDisplayName({ name: ing.name, nameFr: ing.nameFr, nameEn: (ing as any).nameEn }, lang) || ing.name;
                      const formattedAmt = formatRecipeIngredientAmount(ing, lang) || ing.amount || '';
                      const isMatched = previewOutcome.deductions.some(
                        (d) => d.inventoryItemName.toLowerCase().includes(ingName.toLowerCase()) || ingName.toLowerCase().includes(d.inventoryItemName.toLowerCase())
                      );
                      const isAdded = addedGroceryItems.has(ingName);

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isMatched ? 'bg-emerald-500' : 'bg-amber-400'
                              }`}
                            />
                            <span className="font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                              {ingName}
                            </span>
                            {formattedAmt && (
                              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                                ({formattedAmt})
                              </span>
                            )}
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5 ml-2">
                            {isMatched ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>{lang === 'FR' ? 'En stock (sera déduit)' : 'In kitchen'}</span>
                              </span>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-medium">
                                  {lang === 'FR' ? 'Manquant' : 'Missing'}
                                </span>
                                {onAddMissingToGrocery && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onAddMissingToGrocery({
                                        name: ingName,
                                        quantity: ing.quantity || 1,
                                        unit: ing.unit || 'unité',
                                        recipeTitle: title,
                                      });
                                      setAddedGroceryItems((prev) => new Set([...prev, ingName]));
                                    }}
                                    disabled={isAdded}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                      isAdded
                                        ? 'bg-teal-100 text-teal-800 border border-teal-300'
                                        : 'bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-primary)]'
                                    }`}
                                    title={lang === 'FR' ? 'Ajouter à la liste d’épicerie' : 'Add to grocery list'}
                                  >
                                    <ShoppingCart className="w-3 h-3" />
                                    <span>{isAdded ? '✓ Ajouté' : '+ Épicerie'}</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        </div>

        {/* MODAL FOOTER ACTIONS */}
        {!isCookingCompleted && (
          <div className="p-3 sm:p-4 bg-[var(--md-sys-color-surface-container)] border-t border-[var(--md-sys-color-outline-variant)] shrink-0">
            <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-3 flex-wrap">
              {/* Quick Helper Text */}
              <div className="flex items-center gap-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium">
                <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  {lang === 'FR'
                    ? 'Déduit automatiquement les ingrédients utilisés de votre cuisine.'
                    : 'Automatically deducts used ingredients from kitchen inventory.'}
                </span>
              </div>

              {/* Action Buttons: Finish button ONLY shown when at the last step */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMinimize}
                  className="px-3.5 py-2 rounded-full border border-teal-700/40 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 hover:bg-teal-100 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title={
                    lang === 'FR'
                      ? "Parcourir d'autres pages sans arrêter le minuteur"
                      : 'Browse other pages without stopping timer'
                  }
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>{lang === 'FR' ? "Parcourir l'app" : 'Browse App'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCloseRequest}
                  className="px-4 py-2 rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] text-xs font-semibold transition-all cursor-pointer"
                >
                  {lang === 'FR' ? 'Quitter' : 'Exit'}
                </button>

                {isLastStep ? (
                  <button
                    type="button"
                    disabled={isDeducting}
                    onClick={handleFinishAndDeduct}
                    className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50 animate-pulse"
                  >
                    <Utensils className="w-4 h-4" />
                    <span>
                      {isDeducting
                        ? (lang === 'FR' ? 'Mise à jour des stocks...' : 'Updating...')
                        : (lang === 'FR' ? '🍳 Terminer la cuisson & Déduire les stocks' : '🍳 Finish Cooking & Deduct Kitchen Stock')}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (viewTab !== 'step_by_step') {
                        setViewTab('step_by_step');
                      } else {
                        handleToggleStepCompleted(currentStepIndex);
                        setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
                      }
                    }}
                    className="m3-btn-filled py-2.5 px-5 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                  >
                    <span>
                      {viewTab !== 'step_by_step'
                        ? (lang === 'FR' ? 'Continuer la préparation' : 'Continue Cooking')
                        : (lang === 'FR'
                            ? `Étape suivante (${currentStepIndex + 2}/${steps.length})`
                            : `Next Step (${currentStepIndex + 2}/${steps.length})`)}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exit Confirmation Dialog when user quits with timer running */}
      {showExitConfirm && (
        <div
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowExitConfirm(false)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full p-5 shadow-2xl space-y-4 text-slate-800 animate-slide-up"
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
                    ? 'Le minuteur est actif. Vous pouvez minimiser la fenêtre pour naviguer dans l’application sans perdre votre progression ni votre minuteur !'
                    : 'The timer is active. You can browse other pages while keeping the timer running in the background!'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleMinimize}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs shadow-xs cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>
                  {lang === 'FR'
                    ? 'Parcourir l’app (garder le minuteur)'
                    : 'Browse app (keep timer running)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold text-xs cursor-pointer transition-colors"
              >
                {lang === 'FR' ? 'Arrêter définitivement' : 'Stop and exit completely'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

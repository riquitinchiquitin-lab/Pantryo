import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { CookingRecipeData } from '../components/GuidedCookingModal';
import { playAudioChime } from '../utils/audioAlert';

export interface CookingSessionHandlers {
  onCookRecipe?: (recipe: {
    title: string;
    ingredients: Array<{ name: string; amount?: string; nameFr?: string; quantity?: number; unit?: string }>;
  }) => Promise<any> | any;
  onRecipeCookedSuccessfully?: (recipeTitle: string, deductions: any[]) => void;
  onAddMissingToGrocery?: (item: {
    name: string;
    category?: string;
    quantity?: number;
    unit?: string;
    recipeTitle?: string;
  }) => void;
}

export interface CookingSessionContextValue {
  // Session State
  activeRecipe: CookingRecipeData | null;
  isOpen: boolean; // true = full screen cooking mode is visible
  isMinimized: boolean; // true = active recipe exists, but user left full screen to browse other pages
  currentStepIndex: number;
  completedSteps: Set<number>;
  servingsMultiplier: number;
  viewTab: 'step_by_step' | 'all_steps' | 'ingredients';
  addedGroceryItems: Set<string>;
  isCookingCompleted: boolean;
  cookingSummary: any | null;

  // Kitchen Timer State
  timerSeconds: number;
  initialTimerDuration: number;
  isTimerRunning: boolean;
  isTimerFinished: boolean;

  // Action Methods
  startCooking: (recipe: CookingRecipeData, handlers?: CookingSessionHandlers) => void;
  minimizeCooking: () => void;
  resumeCooking: () => void;
  exitCooking: () => void;

  // Step and View Methods
  setCurrentStepIndex: (index: number | ((prev: number) => number)) => void;
  toggleStepCompleted: (index: number) => void;
  setViewTab: (tab: 'step_by_step' | 'all_steps' | 'ingredients') => void;
  setServingsMultiplier: (multiplier: number) => void;
  toggleGroceryItem: (name: string) => void;
  setCookingCompleted: (completed: boolean) => void;
  setCookingSummary: (summary: any) => void;

  // Timer Controls
  toggleTimer: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  addTimerMinutes: (deltaSecs: number) => void;
  setTimerDuration: (minutes: number) => void;
  resetTimer: () => void;

  // Handlers attached to current session
  handlers: CookingSessionHandlers;
}

const CookingSessionContext = createContext<CookingSessionContextValue | null>(null);

const STORAGE_KEY = 'pantryo_active_cooking_session';

export const CookingSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved session if exists
  const initialSession = (() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.activeRecipe) {
          // If timer was running, calculate elapsed time
          let adjustedTimer = parsed.timerSeconds || 300;
          if (parsed.isTimerRunning && parsed.savedAt) {
            const elapsed = Math.floor((Date.now() - parsed.savedAt) / 1000);
            adjustedTimer = Math.max(0, adjustedTimer - elapsed);
          }
          return {
            ...parsed,
            timerSeconds: adjustedTimer,
            isTimerRunning: parsed.isTimerRunning && adjustedTimer > 0,
            isTimerFinished: adjustedTimer === 0,
            completedSteps: new Set<number>(parsed.completedSteps || []),
          };
        }
      }
    } catch (e) {
      console.warn('Failed to restore cooking session:', e);
    }
    return null;
  })();

  const [activeRecipe, setActiveRecipe] = useState<CookingRecipeData | null>(
    initialSession ? initialSession.activeRecipe : null
  );
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndexState] = useState<number>(
    initialSession ? initialSession.currentStepIndex || 0 : 0
  );
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    initialSession ? initialSession.completedSteps : new Set()
  );
  const [servingsMultiplier, setServingsMultiplier] = useState(
    initialSession ? initialSession.servingsMultiplier || 1 : 1
  );
  const [viewTab, setViewTab] = useState<'step_by_step' | 'all_steps' | 'ingredients'>('step_by_step');
  const [addedGroceryItems, setAddedGroceryItems] = useState<Set<string>>(new Set());
  const [isCookingCompleted, setIsCookingCompleted] = useState(false);
  const [cookingSummary, setCookingSummary] = useState<any | null>(null);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState<number>(
    initialSession ? Number(initialSession.timerSeconds) || 300 : 300
  );
  const [initialTimerDuration, setInitialTimerDuration] = useState<number>(
    initialSession ? Number(initialSession.initialTimerDuration) || 300 : 300
  );
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(
    initialSession ? Boolean(initialSession.isTimerRunning) : false
  );
  const [isTimerFinished, setIsTimerFinished] = useState<boolean>(
    initialSession ? Boolean(initialSession.isTimerFinished) : false
  );

  // Handlers
  const [handlers, setHandlers] = useState<CookingSessionHandlers>({});

  // Wrapper for setCurrentStepIndex to accept number or updater function
  const setCurrentStepIndex = useCallback((updater: number | ((prev: number) => number)) => {
    setCurrentStepIndexState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return next;
    });
  }, []);

  // Save active session to localStorage whenever state changes
  useEffect(() => {
    if (!activeRecipe) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      return;
    }

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          activeRecipe,
          currentStepIndex,
          completedSteps: Array.from(completedSteps),
          servingsMultiplier,
          timerSeconds,
          initialTimerDuration,
          isTimerRunning,
          savedAt: Date.now(),
        })
      );
    } catch (e) {
      console.warn('Failed to persist cooking session:', e);
    }
  }, [
    activeRecipe,
    currentStepIndex,
    completedSteps,
    servingsMultiplier,
    timerSeconds,
    initialTimerDuration,
    isTimerRunning,
  ]);

  // Background Timer countdown effect that keeps running across all pages
  useEffect(() => {
    let interval: number | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = window.setInterval(() => {
        setTimerSeconds((prev: number) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setIsTimerFinished(true);
            playAudioChime('timer');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  const startCooking = useCallback(
    (recipe: CookingRecipeData, sessionHandlers?: CookingSessionHandlers) => {
      // Check if user is already cooking this exact recipe: if so, resume without losing step or timer!
      if (
        activeRecipe &&
        ((recipe.id && activeRecipe.id && recipe.id === activeRecipe.id) ||
          recipe.title.trim().toLowerCase() === activeRecipe.title.trim().toLowerCase())
      ) {
        setIsOpen(true);
        if (sessionHandlers) {
          setHandlers((prev) => ({ ...prev, ...sessionHandlers }));
        }
        return;
      }

      // Starting a fresh recipe
      setActiveRecipe(recipe);
      setIsOpen(true);
      setCurrentStepIndexState(0);
      setCompletedSteps(new Set());
      setServingsMultiplier(1);
      setViewTab('step_by_step');
      setAddedGroceryItems(new Set());
      setIsCookingCompleted(false);
      setCookingSummary(null);

      // Default timer
      const defaultMinutes = recipe.cookTimeMinutes && recipe.cookTimeMinutes > 0 ? recipe.cookTimeMinutes : 5;
      const secs = defaultMinutes * 60;
      setTimerSeconds(secs);
      setInitialTimerDuration(secs);
      setIsTimerRunning(false);
      setIsTimerFinished(false);

      if (sessionHandlers) {
        setHandlers(sessionHandlers);
      }
    },
    [activeRecipe]
  );

  const minimizeCooking = useCallback(() => {
    // Leaves full-screen cooking mode so user can look at other pages while step index and timer remain active!
    setIsOpen(false);
  }, []);

  const resumeCooking = useCallback(() => {
    // Re-opens full-screen cooking mode immediately at the EXACT step the user was at!
    setIsOpen(true);
  }, []);

  const exitCooking = useCallback(() => {
    // Complete stop and clear
    setActiveRecipe(null);
    setIsOpen(false);
    setCurrentStepIndexState(0);
    setCompletedSteps(new Set());
    setIsTimerRunning(false);
    setIsTimerFinished(false);
    setIsCookingCompleted(false);
    setCookingSummary(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const toggleStepCompleted = useCallback((index: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const toggleGroceryItem = useCallback((name: string) => {
    setAddedGroceryItems((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  const toggleTimer = useCallback(() => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
    } else {
      if (timerSeconds <= 0) {
        setTimerSeconds(initialTimerDuration > 0 ? initialTimerDuration : 300);
        setIsTimerFinished(false);
      }
      setIsTimerRunning(true);
    }
  }, [isTimerRunning, timerSeconds, initialTimerDuration]);

  const startTimer = useCallback(() => {
    if (timerSeconds <= 0) {
      setTimerSeconds(initialTimerDuration > 0 ? initialTimerDuration : 300);
      setIsTimerFinished(false);
    }
    setIsTimerRunning(true);
  }, [timerSeconds, initialTimerDuration]);

  const pauseTimer = useCallback(() => {
    setIsTimerRunning(false);
  }, []);

  const addTimerMinutes = useCallback((deltaSecs: number) => {
    setTimerSeconds((prev: number) => {
      const next = Math.max(0, prev + deltaSecs);
      if (next > 0) setIsTimerFinished(false);
      return next;
    });
  }, []);

  const setTimerDuration = useCallback((minutes: number) => {
    setIsTimerRunning(false);
    setIsTimerFinished(false);
    const secs = Math.max(10, minutes * 60);
    setTimerSeconds(secs);
    setInitialTimerDuration(secs);
  }, []);

  const resetTimer = useCallback(() => {
    setIsTimerRunning(false);
    setIsTimerFinished(false);
    setTimerSeconds(initialTimerDuration > 0 ? initialTimerDuration : 300);
  }, [initialTimerDuration]);

  const isMinimized = activeRecipe !== null && !isOpen;

  return (
    <CookingSessionContext.Provider
      value={{
        activeRecipe,
        isOpen,
        isMinimized,
        currentStepIndex,
        completedSteps,
        servingsMultiplier,
        viewTab,
        addedGroceryItems,
        isCookingCompleted,
        cookingSummary,
        timerSeconds,
        initialTimerDuration,
        isTimerRunning,
        isTimerFinished,
        startCooking,
        minimizeCooking,
        resumeCooking,
        exitCooking,
        setCurrentStepIndex,
        toggleStepCompleted,
        setViewTab,
        setServingsMultiplier,
        toggleGroceryItem,
        setCookingCompleted: setIsCookingCompleted,
        setCookingSummary,
        toggleTimer,
        startTimer,
        pauseTimer,
        addTimerMinutes,
        setTimerDuration,
        resetTimer,
        handlers,
      }}
    >
      {children}
    </CookingSessionContext.Provider>
  );
};

export const useCookingSession = (): CookingSessionContextValue => {
  const context = useContext(CookingSessionContext);
  if (!context) {
    throw new Error('useCookingSession must be used within a CookingSessionProvider');
  }
  return context;
};

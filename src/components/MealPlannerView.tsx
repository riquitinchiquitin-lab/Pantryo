import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  CheckCircle2,
  Clock,
  Utensils,
  ChefHat,
  Play,
  Trash2,
  Edit2,
  Sparkles,
  ShoppingBag,
  AlertCircle,
  X,
  Flame,
  ArrowRight,
  CheckSquare,
  Square,
  Refrigerator,
  BookmarkPlus,
  CalendarRange,
  Lock,
  Unlock,
  SlidersHorizontal,
  BarChart3,
  Zap,
} from 'lucide-react';
import { PlannedMeal, MealType, InventoryItem, PlannedMealIngredient, DailyNutritionGoals, NutritionCalculationMethod, Macros } from '../types';
import { getFoodVisual } from '../utils/foodVisuals';
import { useLanguage } from '../utils/i18n';
import { useCookingSession } from '../contexts/CookingSessionContext';
import { getItemDisplayName, getRecipeDisplayTitle } from '../utils/foodTranslator';
import { SmartMealSuggestionsModal } from './SmartMealSuggestionsModal';
import { MealPlanShoppingListModal } from './MealPlanShoppingListModal';
import { ScrollableRow } from './ScrollableRow';
import {
  computeDailyNutritionProgress,
  DEFAULT_DAILY_NUTRITION_GOALS,
  estimateRecipeNutrition,
  recalculateDynamicNutrition,
  estimateIngredientNutrition,
} from '../services/nutritionEngine';
import { getCuratedMealPhoto, getFoodSvgFallback, CURATED_FOOD_PHOTOS, isDocumentScan } from '../utils/curatedFoodImages';
import { GuidedCookingModal } from './GuidedCookingModal';
import { AddRecipeModal } from './AddRecipeModal';
import { RicardoRecipe } from '../data/ricardoRecipes';

function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface MealPlannerViewProps {
  householdId: string;
  items: InventoryItem[];
  plannedMeals: PlannedMeal[];
  onAddMeal: (meal: Omit<PlannedMeal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  onUpdateMeal: (mealId: string, updates: Partial<PlannedMeal>) => Promise<boolean>;
  onDeleteMeal: (mealId: string) => Promise<boolean>;
  onAddIngredientsToGrocery?: (ingredients: Array<{ name: string; quantity: number; unit: string; category?: string }>) => void;
  onOpenRecipes?: () => void;
  onNavigateToGrocery?: () => void;
  onCookMeal?: (meal: PlannedMeal) => Promise<void> | void;
}

export const MealPlannerView: React.FC<MealPlannerViewProps> = ({
  householdId,
  items,
  plannedMeals,
  onAddMeal,
  onUpdateMeal,
  onDeleteMeal,
  onAddIngredientsToGrocery,
  onOpenRecipes,
  onNavigateToGrocery,
  onCookMeal,
}) => {
  const { t, lang } = useLanguage();

  const MEAL_TYPES: { type: MealType; label: string; color: string; bg: string; border: string }[] = useMemo(() => [
    { type: 'BREAKFAST', label: lang === 'FR' ? 'Petit-déjeuner' : 'Breakfast', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    { type: 'LUNCH', label: lang === 'FR' ? 'Déjeuner' : 'Lunch', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { type: 'DINNER', label: lang === 'FR' ? 'Dîner' : 'Dinner', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    { type: 'SNACK', label: lang === 'FR' ? 'Collation' : 'Snack', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  ], [lang]);

  const todayStr = useMemo(() => formatLocalDate(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const { startCooking, activeRecipe, currentStepIndex, resumeCooking } = useCookingSession();
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  const handleLaunchMealCooking = (meal: PlannedMeal) => {
    startCooking(
      {
        id: meal.id,
        title: meal.title,
        titleFr: meal.titleFr,
        titleEn: meal.titleEn,
        ingredients: meal.ingredients.map((ing) => ({
          name: ing.name,
          nameFr: ing.nameFr,
          nameEn: (ing as any).nameEn,
          quantity: ing.quantity,
          unit: ing.unit,
        })),
        instructions: (meal as any).instructions || (meal.notes ? [meal.notes] : undefined),
        instructionsFr: (meal as any).instructionsFr,
        instructionsEn: (meal as any).instructionsEn,
        servings: meal.servings,
        prepTimeMinutes: meal.prepTimeMinutes,
        cookTimeMinutes: (meal as any).cookTimeMinutes || 15,
        imageUrl: meal.imageUrl,
        caloriesPerServing: meal.calories,
        macrosPerServing: meal.macrosPerServing,
      },
      {
        onCookRecipe: async () => {
          await handleToggleCooked(meal);
        },
        onAddMissingToGrocery: (missing) => {
          if (onAddIngredientsToGrocery) {
            onAddIngredientsToGrocery([
              {
                name: missing.name,
                quantity: missing.quantity || 1,
                unit: missing.unit || 'portion',
              },
            ]);
          }
        },
      }
    );
  };

  // Month navigation state
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<PlannedMeal | null>(null);
  const [selectedSlotType, setSelectedSlotType] = useState<MealType>('DINNER');

  // Smart Suggestions Modal State
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [suggestionsInitialSlot, setSuggestionsInitialSlot] = useState<MealType>('DINNER');
  const [recipeToReview, setRecipeToReview] = useState<RicardoRecipe | null>(null);

  // Meal Plan Shopping List Modal State
  const [isShoppingListModalOpen, setIsShoppingListModalOpen] = useState(false);

  // Form State
  const [mealTitle, setMealTitle] = useState('');
  const [mealType, setMealType] = useState<MealType>('DINNER');
  const [prepTime, setPrepTime] = useState(30);
  const [servings, setServings] = useState(2);
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Daily Nutrition Goals & Settings State
  const [dailyGoals, setDailyGoals] = useState<DailyNutritionGoals>(() => {
    try {
      const saved = localStorage.getItem('pantryo_daily_nutrition_goals');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return DEFAULT_DAILY_NUTRITION_GOALS;
  });
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [customGoalKcal, setCustomGoalKcal] = useState(dailyGoals.calorieTarget);
  const [customGoalProtein, setCustomGoalProtein] = useState(dailyGoals.proteinGramsTarget);
  const [customGoalCarbs, setCustomGoalCarbs] = useState(dailyGoals.carbsGramsTarget);
  const [customGoalFat, setCustomGoalFat] = useState(dailyGoals.fatGramsTarget);

  // Form Nutrition Engine State (Methods A, B, C)
  const [formCaloriesPerServing, setFormCaloriesPerServing] = useState<number>(440);
  const [formTotalCalories, setFormTotalCalories] = useState<number>(880);
  const [formProteinGrams, setFormProteinGrams] = useState<number>(32);
  const [formCarbsGrams, setFormCarbsGrams] = useState<number>(45);
  const [formFatGrams, setFormFatGrams] = useState<number>(18);
  const [formCalculationMethod, setFormCalculationMethod] = useState<NutritionCalculationMethod>('AI_ESTIMATED');
  const [isManualOverrideLocked, setIsManualOverrideLocked] = useState<boolean>(false);

  // Dynamic Aggregation: Recalculate daily progress for selected date
  const dailyNutrition = useMemo(() => {
    return computeDailyNutritionProgress(plannedMeals, selectedDate, dailyGoals);
  }, [plannedMeals, selectedDate, dailyGoals]);

  // Method A: AI Auto-Estimation
  const handleAutoEstimateNutrition = () => {
    const lines = ingredientsText.split('\n').map((l) => l.trim()).filter(Boolean);
    const rawIngs = lines.map((l) => ({ name: l }));
    const est = estimateRecipeNutrition(mealTitle || 'Planned Dish', rawIngs, servings);
    setFormCaloriesPerServing(est.caloriesPerServing);
    setFormTotalCalories(est.totalCalories);
    setFormProteinGrams(est.macrosPerServing.proteinGrams);
    setFormCarbsGrams(est.macrosPerServing.carbsGrams);
    setFormFatGrams(est.macrosPerServing.fatGrams);
    setFormCalculationMethod('AI_ESTIMATED');
    setIsManualOverrideLocked(false);
  };

  // Method B: Dynamic Aggregation (Ingredient & Portion Scaling)
  const handleRecalculateDynamicNutrition = (updatedServings: number = servings) => {
    const s = Math.max(1, updatedServings);
    const lines = ingredientsText.split('\n').map((l) => l.trim()).filter(Boolean);
    const rawIngs = lines.map((l) => ({ name: l }));
    const dyn = recalculateDynamicNutrition(rawIngs, s, {
      title: mealTitle,
      servings: s,
      caloriesPerServing: formCaloriesPerServing,
      totalCalories: formCaloriesPerServing * s,
      macrosPerServing: { proteinGrams: formProteinGrams, carbsGrams: formCarbsGrams, fatGrams: formFatGrams },
      calculationMethod: 'DYNAMIC_AGGREGATED',
    });
    setFormCaloriesPerServing(dyn.caloriesPerServing);
    setFormTotalCalories(dyn.totalCalories);
    setFormProteinGrams(dyn.macrosPerServing.proteinGrams);
    setFormCarbsGrams(dyn.macrosPerServing.carbsGrams);
    setFormFatGrams(dyn.macrosPerServing.fatGrams);
    setFormCalculationMethod('DYNAMIC_AGGREGATED');
    setIsManualOverrideLocked(false);
  };

  // Method C: Manual Override Toggle
  const handleToggleManualOverride = () => {
    const nextLocked = !isManualOverrideLocked;
    setIsManualOverrideLocked(nextLocked);
    setFormCalculationMethod(nextLocked ? 'MANUAL_OVERRIDE' : 'DYNAMIC_AGGREGATED');
  };

  // Save Daily Goal
  const handleSaveDailyGoals = (e: React.FormEvent) => {
    e.preventDefault();
    const newGoals: DailyNutritionGoals = {
      calorieTarget: Number(customGoalKcal) || 2000,
      proteinGramsTarget: Number(customGoalProtein) || 130,
      carbsGramsTarget: Number(customGoalCarbs) || 220,
      fatGramsTarget: Number(customGoalFat) || 65,
    };
    setDailyGoals(newGoals);
    try {
      localStorage.setItem('pantryo_daily_nutrition_goals', JSON.stringify(newGoals));
    } catch (_) {}
    setIsGoalModalOpen(false);
    setSuccessToast(lang === 'FR' ? 'Objectif calorique quotidien enregistré !' : 'Daily nutrition budget updated!');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Helper: Get days of the week for weekly strip
  const weekDays = useMemo(() => {
    const curr = parseLocalDate(selectedDate);
    const day = curr.getDay(); // 0 is Sunday
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    const monday = new Date(curr.getFullYear(), curr.getMonth(), diff);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const iso = formatLocalDate(d);
      return {
        date: d,
        isoString: iso,
        dayName: d.toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        isToday: iso === todayStr,
        isSelected: iso === selectedDate,
      };
    });
  }, [selectedDate, todayStr, lang]);

  // Day navigation helpers
  const handlePrevDay = () => {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(formatLocalDate(d));
  };

  const handleNextDay = () => {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(formatLocalDate(d));
  };

  // Week navigation helpers
  const handlePrevWeek = () => {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() - 7);
    setSelectedDate(formatLocalDate(d));
  };

  const handleNextWeek = () => {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() + 7);
    setSelectedDate(formatLocalDate(d));
  };

  // Helper: Month calendar matrix
  const monthDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Mon = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Previous month filler
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      const iso = formatLocalDate(d);
      days.push({
        date: d,
        isoString: iso,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: iso === todayStr,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const iso = formatLocalDate(d);
      days.push({
        date: d,
        isoString: iso,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: iso === todayStr,
      });
    }

    // Trailing next month days to complete 35 or 42 grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const iso = formatLocalDate(d);
      days.push({
        date: d,
        isoString: iso,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: iso === todayStr,
      });
    }

    return days;
  }, [currentMonthDate, todayStr]);

  // Meals for currently selected date
  const mealsForSelectedDate = useMemo(() => {
    return plannedMeals.filter((m) => m.date === selectedDate);
  }, [plannedMeals, selectedDate]);

  // Map of meals per date for calendar dots
  const mealsByDateMap = useMemo(() => {
    const map = new Map<string, PlannedMeal[]>();
    for (const m of plannedMeals) {
      const list = map.get(m.date) || [];
      list.push(m);
      map.set(m.date, list);
    }
    return map;
  }, [plannedMeals]);

  // Items expiring soon to give suggestions
  const expiringItems = useMemo(() => {
    return items.filter(
      (i) => i.isExpiringSoon || (i.daysUntilExpiration !== null && i.daysUntilExpiration <= 4)
    );
  }, [items]);

  const handleOpenAddModal = (type: MealType = 'DINNER') => {
    setEditingMeal(null);
    setMealTitle('');
    setMealType(type);
    setPrepTime(30);
    setServings(2);
    setNotes('');
    setImageUrl('');
    setIngredientsText('');
    setFormCaloriesPerServing(440);
    setFormTotalCalories(880);
    setFormProteinGrams(32);
    setFormCarbsGrams(45);
    setFormFatGrams(18);
    setFormCalculationMethod('AI_ESTIMATED');
    setIsManualOverrideLocked(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (meal: PlannedMeal) => {
    setEditingMeal(meal);
    setMealTitle(meal.title);
    setMealType(meal.mealType);
    setPrepTime(meal.prepTimeMinutes || 30);
    const s = meal.servings || 2;
    setServings(s);
    setNotes(meal.notes || '');
    setImageUrl(meal.imageUrl || '');
    setIngredientsText(meal.ingredients.map((i) => `${i.name}${i.quantity ? ` (${i.quantity} ${i.unit || ''})` : ''}`).join('\n'));
    
    const kcal = meal.caloriesPerServing ?? meal.calories ?? (meal.nutrition?.caloriesPerServing ?? 440);
    setFormCaloriesPerServing(kcal);
    setFormTotalCalories(meal.totalCalories ?? (kcal * s));
    setFormProteinGrams(meal.macrosPerServing?.proteinGrams ?? meal.nutrition?.macrosPerServing?.proteinGrams ?? 32);
    setFormCarbsGrams(meal.macrosPerServing?.carbsGrams ?? meal.nutrition?.macrosPerServing?.carbsGrams ?? 45);
    setFormFatGrams(meal.macrosPerServing?.fatGrams ?? meal.nutrition?.macrosPerServing?.fatGrams ?? 18);
    setFormCalculationMethod(meal.calculationMethod || 'AI_ESTIMATED');
    setIsManualOverrideLocked(meal.calculationMethod === 'MANUAL_OVERRIDE');
    setIsModalOpen(true);
  };

  const handleSaveMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const parsedIngredients: PlannedMealIngredient[] = ingredientsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const cleanName = line.replace(/\(.*\)/, '').trim();
          const found = items.some(
            (it) => it.name.toLowerCase().includes(cleanName.toLowerCase()) || cleanName.toLowerCase().includes(it.name.toLowerCase())
          );
          const nut = estimateIngredientNutrition(cleanName, 1, 'unit');
          return {
            name: line,
            inStock: found,
            estimatedKcal: nut.estimatedKcal,
            proteinGrams: nut.proteinGrams,
            carbsGrams: nut.carbsGrams,
            fatGrams: nut.fatGrams,
          };
        });

      // Ensure real delicious photo is always available: user custom photo or curated recipe visual
      const resolvedImage = imageUrl.trim()
        ? imageUrl.trim()
        : getCuratedMealPhoto(mealTitle.trim(), mealType);

      const nutritionPayload = {
        calories: formCaloriesPerServing,
        caloriesPerServing: formCaloriesPerServing,
        totalCalories: formTotalCalories,
        macrosPerServing: {
          proteinGrams: formProteinGrams,
          carbsGrams: formCarbsGrams,
          fatGrams: formFatGrams,
        },
        totalMacros: {
          proteinGrams: formProteinGrams * servings,
          carbsGrams: formCarbsGrams * servings,
          fatGrams: formFatGrams * servings,
        },
        calculationMethod: formCalculationMethod,
      };

      if (editingMeal) {
        await onUpdateMeal(editingMeal.id, {
          title: mealTitle.trim(),
          mealType,
          date: selectedDate,
          prepTimeMinutes: Number(prepTime) || 30,
          servings: Number(servings) || 2,
          notes: notes.trim(),
          imageUrl: resolvedImage,
          ingredients: parsedIngredients,
          ...nutritionPayload,
        });
        setSuccessToast(lang === 'FR' ? 'Repas mis à jour avec nutrition !' : 'Meal plan and nutrition updated!');
      } else {
        await onAddMeal({
          householdId,
          title: mealTitle.trim(),
          date: selectedDate,
          mealType,
          servings: Number(servings) || 2,
          prepTimeMinutes: Number(prepTime) || 30,
          notes: notes.trim(),
          imageUrl: resolvedImage,
          isCooked: false,
          ingredients: parsedIngredients,
          ...nutritionPayload,
        });
        setSuccessToast(lang === 'FR' ? 'Nouveau repas planifié avec nutrition !' : 'New meal planned with nutrition!');
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error('Failed to save meal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlanSuggestedMeal = async (params: {
    title: string;
    titleFr?: string;
    titleEn?: string;
    mealType: MealType;
    date: string;
    prepTimeMinutes: number;
    servings: number;
    imageUrl?: string;
    notes?: string;
    recipeUrl?: string;
    ingredients: PlannedMealIngredient[];
    addMissingToGrocery: boolean;
  }) => {
    const resolvedImage = params.imageUrl?.trim()
      ? params.imageUrl.trim()
      : getCuratedMealPhoto(params.title, params.mealType);

    await onAddMeal({
      householdId,
      title: params.title,
      titleFr: params.titleFr,
      titleEn: params.titleEn,
      date: params.date,
      mealType: params.mealType,
      servings: params.servings,
      prepTimeMinutes: params.prepTimeMinutes,
      notes: params.notes || '',
      imageUrl: resolvedImage,
      recipeUrl: params.recipeUrl,
      isCooked: false,
      ingredients: params.ingredients,
    });

    if (params.addMissingToGrocery && onAddIngredientsToGrocery) {
      const missing = params.ingredients.filter((i) => !i.inStock);
      if (missing.length > 0) {
        onAddIngredientsToGrocery(
          missing.map((m) => ({
            name: m.name.replace(/\(.*\)/, '').trim(),
            quantity: m.quantity || 1,
            unit: m.unit || 'pcs',
            category: 'Pantry Staples',
          }))
        );
      }
    }

    setSuccessToast(
      lang === 'FR'
        ? `✨ Repas "${params.title}" planifié avec succès !`
        : `✨ Meal "${params.title}" planned successfully!`
    );
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleToggleCooked = async (meal: PlannedMeal) => {
    if (onCookMeal) {
      await onCookMeal(meal);
      setSuccessToast(
        !meal.isCooked
          ? (lang === 'FR' ? `🎉 Repas "${meal.title}" cuisiné ! Ingrédients déduits.` : `🎉 Meal "${meal.title}" cooked & deducted!`)
          : (lang === 'FR' ? 'Marqué comme prévu' : 'Marked as planned')
      );
      setTimeout(() => setSuccessToast(null), 3500);
    } else {
      await onUpdateMeal(meal.id, { isCooked: !meal.isCooked });
      setSuccessToast(
        meal.isCooked
          ? (lang === 'FR' ? 'Marqué comme prévu' : 'Marked as planned')
          : (lang === 'FR' ? '🎉 Repas marqué cuisiné !' : '🎉 Meal marked cooked!')
      );
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  const handlePushMissingToGrocery = (meal: PlannedMeal) => {
    if (!onAddIngredientsToGrocery) return;
    const missing = meal.ingredients.filter((ing) => !ing.inStock);
    if (missing.length === 0) {
      setSuccessToast(
        lang === 'FR'
          ? 'Tous les ingrédients sont en stock dans votre cuisine !'
          : 'All ingredients are in stock in your kitchen!'
      );
      setTimeout(() => setSuccessToast(null), 2500);
      return;
    }

    onAddIngredientsToGrocery(
      missing.map((m) => ({
        name: m.name.replace(/\(.*\)/, '').trim(),
        quantity: m.quantity || 1,
        unit: m.unit || 'pcs',
        category: 'Pantry Staples',
      }))
    );
    setSuccessToast(
      lang === 'FR'
        ? `${missing.length} ingrédients manquants ajoutés à la liste de courses !`
        : `Added ${missing.length} missing items to Grocery List!`
    );
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <div className="space-y-4 pb-32 animate-fade-in">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-3.5 rounded-2xl bg-teal-800 text-white text-xs shadow-lg flex items-center justify-between animate-fade-in sticky top-2 z-30">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-teal-200 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner - M3 Surface Container */}
      <div className="p-4 rounded-[24px] bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] space-y-3 shadow-none">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--md-sys-color-secondary)]">
                {lang === 'FR' ? 'Planificateur' : 'Planner'}
              </span>
              <span className="text-[11px] font-medium text-[var(--md-sys-color-on-surface-variant)]">
                • {lang === 'FR' ? 'Planning des Repas du Foyer' : 'Household Meal Schedule'}
              </span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-[var(--md-sys-color-on-surface)] mt-0.5">
              {lang === 'FR' ? 'Planificateur & Calendrier des Repas' : 'Meal Planner & Calendar'}
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              {lang === 'FR'
                ? 'Planifiez vos repas en utilisant les ingrédients disponibles dans votre frigo et garde-manger.'
                : 'Plan breakfasts, lunches & dinners using ingredients in your fridge & pantry.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-header-generate-shopping-list"
              onClick={() => setIsShoppingListModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-[var(--md-sys-color-secondary-container)] hover:brightness-95 text-[var(--md-sys-color-on-secondary-container)] text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title={
                lang === 'FR'
                  ? "Générer la liste d'épicerie selon vos repas planifiés et l'inventaire en stock"
                  : 'Generate shopping list based on planned meals and current kitchen inventory'
              }
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{lang === 'FR' ? "Générer liste d'épicerie" : 'Generate Shopping List'}</span>
            </button>
            <button
              id="btn-header-smart-suggestions"
              onClick={() => {
                setSuggestionsInitialSlot('DINNER');
                setIsSuggestionsModalOpen(true);
              }}
              className="m3-btn-filled text-xs py-1.5 px-4 rounded-full font-medium flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === 'FR' ? 'Auto-Suggest (Anti-Gaspillage)' : 'Auto-Suggest (Zero-Waste)'}</span>
              {expiringItems.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[var(--md-sys-color-error)] text-white text-[10px] font-bold">
                  {expiringItems.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="px-3 py-1.5 rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] text-xs font-medium text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              {lang === 'FR' ? "Aujourd'hui" : 'Today'}
            </button>
            <div className="inline-flex rounded-full p-0.5 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'week' ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold shadow-xs' : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                {lang === 'FR' ? 'Semaine' : 'Week'}
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'month' ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold shadow-xs' : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                {lang === 'FR' ? 'Mois' : 'Month'}
              </button>
            </div>
          </div>
        </div>

        {/* View Mode: WEEK STRIP */}
        {viewMode === 'week' ? (
          <div className="space-y-2.5 pt-1">
            {/* Week navigation label & controls */}
            <div className="flex items-center justify-between px-1 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-[#0D3B37] capitalize tracking-tight">
                  {(() => {
                    if (weekDays.length === 0) return '';
                    const start = weekDays[0].date;
                    const end = weekDays[6].date;
                    const startStr = start.toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' });
                    const endStr = end.toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                    return `${startStr} – ${endStr}`;
                  })()}
                </span>
                {weekDays.some((d) => d.isToday) ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black uppercase tracking-wider">
                    {lang === 'FR' ? 'Cette semaine' : 'This week'}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(todayStr)}
                    className="px-2 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    {lang === 'FR' ? 'Revenir à aujourd’hui' : 'Jump to Today'}
                  </button>
                )}
              </div>

              {/* Prev / Today / Next Week Arrows */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="btn-prev-week-nav"
                  onClick={handlePrevWeek}
                  className="px-2.5 py-1.5 rounded-xl border border-[#E0D9C8] bg-white hover:bg-[#FAF7EE] text-[#0D3B37] transition-all cursor-pointer shadow-2xs flex items-center gap-1 text-xs font-bold active:scale-95"
                  title={lang === 'FR' ? 'Semaine précédente (-7j)' : 'Previous week (-7d)'}
                >
                  <ChevronLeft className="w-4 h-4 text-teal-700" />
                  <span className="hidden sm:inline">{lang === 'FR' ? 'Sem. précéd.' : 'Prev week'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className="px-2.5 py-1.5 rounded-xl border border-[#E0D9C8] bg-white hover:bg-[#FAF7EE] text-xs font-bold text-[#0D3B37] transition-all cursor-pointer shadow-2xs active:scale-95"
                  title={lang === 'FR' ? "Aujourd'hui" : 'Today'}
                >
                  {lang === 'FR' ? 'Aujourd’hui' : 'Today'}
                </button>
                <button
                  type="button"
                  id="btn-next-week-nav"
                  onClick={handleNextWeek}
                  className="px-2.5 py-1.5 rounded-xl border border-[#E0D9C8] bg-white hover:bg-[#FAF7EE] text-[#0D3B37] transition-all cursor-pointer shadow-2xs flex items-center gap-1 text-xs font-bold active:scale-95"
                  title={lang === 'FR' ? 'Semaine suivante (+7j)' : 'Next week (+7d)'}
                >
                  <span className="hidden sm:inline">{lang === 'FR' ? 'Sem. suiv.' : 'Next week'}</span>
                  <ChevronRight className="w-4 h-4 text-teal-700" />
                </button>
              </div>
            </div>

            {/* 7-Day Strip with prominent side chevron arrows */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                id="btn-prev-week-side-chevron"
                onClick={handlePrevWeek}
                className="h-14 sm:h-16 w-8 sm:w-10 rounded-2xl border border-[#E5DFD0] bg-white hover:bg-teal-50 hover:border-teal-400 text-teal-800 flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0 active:scale-90"
                title={lang === 'FR' ? 'Semaine précédente (-7 jours)' : 'Previous week (-7 days)'}
                aria-label={lang === 'FR' ? 'Semaine précédente' : 'Previous week'}
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </button>

              <div className="grid grid-cols-7 gap-1 sm:gap-1.5 flex-1 min-w-0">
                {weekDays.map((d) => {
                  const count = mealsByDateMap.get(d.isoString)?.length || 0;
                  const hasCooked = mealsByDateMap.get(d.isoString)?.some((m) => m.isCooked);
                  return (
                    <button
                      key={d.isoString}
                      onClick={() => setSelectedDate(d.isoString)}
                      className={`p-1.5 sm:p-2.5 rounded-[16px] flex flex-col items-center justify-between transition-all text-center border relative cursor-pointer select-none ${
                        d.isSelected
                          ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-[var(--md-sys-color-primary)] shadow-xs ring-2 ring-[var(--md-sys-color-primary-container)]'
                          : d.isToday
                          ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-outline)]'
                          : 'bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container)]'
                      }`}
                    >
                      <span className={`text-[10px] font-bold uppercase ${d.isSelected ? 'text-[var(--md-sys-color-on-primary)]' : 'text-[var(--md-sys-color-on-surface-variant)]'}`}>
                        {d.dayName}
                      </span>
                      <span className={`text-sm sm:text-base font-bold my-0.5 ${d.isSelected ? 'text-[var(--md-sys-color-on-primary)]' : 'text-[var(--md-sys-color-on-surface)]'}`}>
                        {d.dayNumber}
                      </span>
                      {/* Meal Indicator Dots */}
                      <div className="flex items-center gap-0.5 h-2">
                        {count > 0 ? (
                          <span className={`text-[8px] font-bold px-1.5 rounded-full leading-tight ${
                            d.isSelected ? 'bg-white/20 text-white' : hasCooked ? 'bg-emerald-100 text-emerald-800' : 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
                          }`}>
                            {count}m
                          </span>
                        ) : (
                          <span className="w-1.5 h-1.5 opacity-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                id="btn-next-week-side-chevron"
                onClick={handleNextWeek}
                className="h-14 sm:h-16 w-8 sm:w-10 rounded-2xl border border-[#E5DFD0] bg-white hover:bg-teal-50 hover:border-teal-400 text-teal-800 flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0 active:scale-90"
                title={lang === 'FR' ? 'Semaine suivante (+7 jours)' : 'Next week (+7 days)'}
                aria-label={lang === 'FR' ? 'Semaine suivante' : 'Next week'}
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        ) : (
          /* View Mode: MONTH CALENDAR MATRIX */
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black text-[#0D3B37] capitalize">
                {currentMonthDate.toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const prev = new Date(currentMonthDate);
                    prev.setMonth(prev.getMonth() - 1);
                    setCurrentMonthDate(prev);
                  }}
                  className="p-1.5 rounded-lg border border-[#E0D9C8] hover:bg-[#F3EFE6] text-slate-600"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    const next = new Date(currentMonthDate);
                    next.setMonth(next.getMonth() + 1);
                    setCurrentMonthDate(next);
                  }}
                  className="p-1.5 rounded-lg border border-[#E0D9C8] hover:bg-[#F3EFE6] text-slate-600"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#627C65]">
              {lang === 'FR' ? (
                <>
                  <div>Lun</div>
                  <div>Mar</div>
                  <div>Mer</div>
                  <div>Jeu</div>
                  <div>Ven</div>
                  <div>Sam</div>
                  <div>Dim</div>
                </>
              ) : (
                <>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                  <div>Sun</div>
                </>
              )}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((d, index) => {
                const isSelected = d.isoString === selectedDate;
                const meals = mealsByDateMap.get(d.isoString) || [];
                return (
                  <button
                    key={`${d.isoString}_${index}`}
                    onClick={() => setSelectedDate(d.isoString)}
                    className={`h-11 rounded-xl p-1 flex flex-col items-center justify-between border transition-all text-left relative ${
                      isSelected
                        ? 'bg-teal-700 text-white border-teal-800 shadow-2xs font-bold'
                        : d.isToday
                        ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold'
                        : d.isCurrentMonth
                        ? 'bg-white border-[#E8E2D5] text-[#133E3B] hover:bg-[#F8F5EC]'
                        : 'bg-[#F9F7F1]/60 border-transparent text-[#97A7A0]'
                    }`}
                  >
                    <span className="text-[11px] leading-none self-start">{d.dayNumber}</span>
                    {meals.length > 0 && (
                      <div className="flex items-center gap-0.5 self-end">
                        <span
                          className={`text-[9px] px-1 rounded-sm leading-tight font-black ${
                            isSelected ? 'bg-amber-300 text-teal-950' : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {meals.length}m
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selected Day Header & Add Button */}
      <div className="flex items-center justify-between px-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-teal-700 shrink-0" />
          <h3 className="text-sm sm:text-base font-black text-[#0D3B37] capitalize">
            {parseLocalDate(selectedDate).toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </h3>
          {selectedDate === todayStr && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider shrink-0">
              {lang === 'FR' ? "Aujourd'hui" : 'Today'}
            </span>
          )}

          {/* Quick day hopper arrows */}
          <div className="inline-flex items-center gap-0.5 bg-white border border-[#E5DFD0] rounded-xl p-0.5 shadow-2xs ml-1">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1 rounded-lg text-[#0D3B37] hover:bg-[#FAF7EE] transition-colors cursor-pointer"
              title={lang === 'FR' ? 'Jour précédent' : 'Previous day'}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextDay}
              className="p-1 rounded-lg text-[#0D3B37] hover:bg-[#FAF7EE] transition-colors cursor-pointer"
              title={lang === 'FR' ? 'Jour suivant' : 'Next day'}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-day-smart-suggestions"
            onClick={() => {
              setSuggestionsInitialSlot('DINNER');
              setIsSuggestionsModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{lang === 'FR' ? 'Suggérer Repas' : 'Suggest Meal'}</span>
          </button>
          <button
            onClick={() => handleOpenAddModal('DINNER')}
            className="px-3 py-1.5 rounded-xl bg-[#004D36] hover:bg-[#003827] text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'FR' ? '+ Planifier un repas' : '+ Plan Meal'}</span>
          </button>
        </div>
      </div>

      {/* Smart Kitchen Suggestions: Expiring Items */}
      {expiringItems.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-black text-amber-950">
                {lang === 'FR'
                  ? `Ingrédients à utiliser en priorité (${expiringItems.length})`
                  : `Ingredients to use up (${expiringItems.length})`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSuggestionsInitialSlot('DINNER');
                  setIsSuggestionsModalOpen(true);
                }}
                className="text-[11px] font-bold text-amber-950 bg-amber-200/80 hover:bg-amber-200 px-2.5 py-1 rounded-xl flex items-center gap-1 transition-colors shadow-2xs"
              >
                <Sparkles className="w-3 h-3 text-amber-700" />
                <span>{lang === 'FR' ? 'Sauver avec une recette' : 'Rescue with Recipe'}</span>
              </button>
              {onOpenRecipes && (
                <button
                  onClick={onOpenRecipes}
                  className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
                >
                  {lang === 'FR' ? 'Idées Recettes' : 'Find Recipes'} <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          <ScrollableRow className="pb-1 text-xs" showChevrons={true}>
            {expiringItems.slice(0, 5).map((item) => {
              const localizedName = getItemDisplayName(item, lang);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setMealTitle(lang === 'FR' ? `Cuisiner avec ${localizedName}` : `Cook with ${localizedName}`);
                    setMealType('DINNER');
                    setIngredientsText(localizedName);
                    setImageUrl(item.imageUrl || '');
                    setIsModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-white border border-amber-200 text-[11px] font-semibold text-amber-900 shrink-0 hover:bg-amber-100/50 flex items-center gap-1 shadow-2xs"
                >
                  <span>{localizedName}</span>
                  <span className="text-[10px] font-bold text-amber-600">
                    ({item.daysUntilExpiration !== null && item.daysUntilExpiration <= 0 ? (lang === 'FR' ? 'Expiré' : 'Expiring') : `${item.daysUntilExpiration}j`})
                  </span>
                </button>
              );
            })}
          </ScrollableRow>
        </div>
      )}

      {/* Daily Nutritional Intake Tracking inside Meal Planner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5DFD0] shadow-2xs space-y-3.5 select-none">
        {/* Top Header Row */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-2xs shrink-0">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-[#0D3B37] tracking-tight">
                  {lang === 'FR' ? 'Apport Nutritionnel du Jour' : 'Daily Nutritional Intake'}
                </h4>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs ${
                  dailyNutrition.status === 'OVER_BUDGET'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : dailyNutrition.status === 'APPROACHING'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {dailyNutrition.status === 'OVER_BUDGET'
                    ? (lang === 'FR' ? 'Budget Dépassé' : 'Over Budget')
                    : dailyNutrition.status === 'APPROACHING'
                    ? (lang === 'FR' ? 'Limite Proche' : 'Near Limit')
                    : (lang === 'FR' ? 'Objectif Respecté' : 'On Track')}
                </span>
              </div>
              <p className="text-xs text-[#527470]">
                {lang === 'FR'
                  ? `Suivi aggloméré pour le ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}`
                  : `Aggregated intake tracking for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCustomGoalKcal(dailyGoals.calorieTarget);
                setCustomGoalProtein(dailyGoals.proteinGramsTarget);
                setCustomGoalCarbs(dailyGoals.carbsGramsTarget);
                setCustomGoalFat(dailyGoals.fatGramsTarget);
                setIsGoalModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl border border-[#E5DFD0] bg-white text-xs font-bold text-[#0D3B37] hover:bg-[#FAF7EE] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Edit Daily Goals"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-teal-700" />
              <span>{lang === 'FR' ? 'Objectif' : 'Goal'}: <strong className="font-mono text-teal-900">{dailyGoals.calorieTarget} kcal</strong></span>
            </button>
          </div>
        </div>

        {/* Aggregated Numbers & Budget Status */}
        <div className="flex items-end justify-between flex-wrap gap-2 pt-0.5">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#7C9A92] block">
              {lang === 'FR' ? 'Consommation Prévue / Budget' : 'Planned Intake / Daily Budget'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black font-mono text-[#0D3B37] tracking-tight">
                {dailyNutrition.totalPlannedCalories.toLocaleString()}
              </span>
              <span className="text-sm font-semibold font-mono text-[#7C9A92]">
                / {dailyNutrition.dailyCalorieBudget.toLocaleString()} kcal
              </span>
              <span className="text-xs font-bold font-mono text-teal-700 ml-1">
                ({dailyNutrition.caloriePercent}%)
              </span>
            </div>
          </div>

          <div>
            {dailyNutrition.isOverBudget ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 shadow-2xs">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>
                  {lang === 'FR'
                    ? `Dépassement de +${dailyNutrition.overBudgetAmount} kcal`
                    : `Over budget by +${dailyNutrition.overBudgetAmount} kcal`}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 shadow-2xs">
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                <span>
                  {lang === 'FR'
                    ? `${dailyNutrition.remainingCalories} kcal restantes`
                    : `${dailyNutrition.remainingCalories} kcal remaining`}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Clean Rounded Calorie Progress Meter Bar */}
        <div className="space-y-1">
          <div className="w-full h-2.5 rounded-full bg-[#FAF7EE] border border-[#E5DFD0] overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                dailyNutrition.status === 'OVER_BUDGET'
                  ? 'bg-rose-500'
                  : dailyNutrition.status === 'APPROACHING'
                  ? 'bg-amber-500'
                  : 'bg-teal-600'
              }`}
              style={{ width: `${Math.min(100, (dailyNutrition.totalPlannedCalories / dailyNutrition.dailyCalorieBudget) * 100)}%` }}
            />
          </div>
        </div>

        {/* Macro Distribution Cards (Protein, Carbs, Fat) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
          {/* Protein */}
          <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-100 text-[#0D3B37] space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="uppercase text-sky-900 tracking-wider text-[11px]">
                {lang === 'FR' ? 'Protéines' : 'Protein'}
              </span>
              <span className="font-mono text-xs text-sky-950 font-bold">
                {dailyNutrition.totalProteinGrams}g <span className="text-sky-600 font-normal">/ {dailyNutrition.proteinBudgetGrams}g</span>
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-sky-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-300"
                style={{ width: `${dailyNutrition.proteinPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-sky-800 font-medium">
              <span>{dailyNutrition.proteinPercent}% {lang === 'FR' ? 'atteint' : 'met'}</span>
              <span className="text-sky-600 font-semibold">{dailyNutrition.macroSplit.proteinPct}% {lang === 'FR' ? 'énergie' : 'energy'}</span>
            </div>
          </div>

          {/* Carbs */}
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100 text-[#0D3B37] space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="uppercase text-amber-900 tracking-wider text-[11px]">
                {lang === 'FR' ? 'Glucides' : 'Carbs'}
              </span>
              <span className="font-mono text-xs text-amber-950 font-bold">
                {dailyNutrition.totalCarbsGrams}g <span className="text-amber-600 font-normal">/ {dailyNutrition.carbsBudgetGrams}g</span>
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-amber-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-300"
                style={{ width: `${dailyNutrition.carbsPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-amber-800 font-medium">
              <span>{dailyNutrition.carbsPercent}% {lang === 'FR' ? 'atteint' : 'met'}</span>
              <span className="text-amber-600 font-semibold">{dailyNutrition.macroSplit.carbsPct}% {lang === 'FR' ? 'énergie' : 'energy'}</span>
            </div>
          </div>

          {/* Fat */}
          <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100 text-[#0D3B37] space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="uppercase text-rose-900 tracking-wider text-[11px]">
                {lang === 'FR' ? 'Lipides' : 'Fat'}
              </span>
              <span className="font-mono text-xs text-rose-950 font-bold">
                {dailyNutrition.totalFatGrams}g <span className="text-rose-600 font-normal">/ {dailyNutrition.fatBudgetGrams}g</span>
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-rose-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-rose-500 transition-all duration-300"
                style={{ width: `${dailyNutrition.fatPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-rose-800 font-medium">
              <span>{dailyNutrition.fatPercent}% {lang === 'FR' ? 'atteint' : 'met'}</span>
              <span className="text-rose-600 font-semibold">{dailyNutrition.macroSplit.fatPct}% {lang === 'FR' ? 'énergie' : 'energy'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Meal Slots (Breakfast, Lunch, Dinner, Snack) */}
      <div className="space-y-3">
        {MEAL_TYPES.map(({ type, label, bg, border, color }) => {
          const meals = mealsForSelectedDate.filter((m) => m.mealType === type);
          const slotData = dailyNutrition.slots[type];

          return (
            <div key={type} className="rounded-3xl bg-white border border-[#E5DFD0] p-3.5 sm:p-4 shadow-2xs space-y-3 select-none">
              <div className="flex items-center justify-between pb-2 border-b border-[#FAF7EE] flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${bg} ${border} ${color} border`}>
                    {label}
                  </span>
                  {slotData && slotData.calories > 0 && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#E5DFD0] bg-[#FAF7EE] text-[10px] text-[#0D3B37] shadow-2xs select-none"
                      title={
                        lang === 'FR'
                          ? `Total créneau : ${slotData.calories} kcal (${slotData.proteinGrams}g Protéines, ${slotData.carbsGrams}g Glucides, ${slotData.fatGrams}g Lipides)`
                          : `Slot total: ${slotData.calories} kcal (${slotData.proteinGrams}g Protein, ${slotData.carbsGrams}g Carbs, ${slotData.fatGrams}g Fat)`
                      }
                    >
                      <span className="flex items-center gap-1 font-bold text-amber-900">
                        <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
                        <span>{slotData.calories} kcal</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-0.5 text-sky-800 font-semibold" title={lang === 'FR' ? 'Protéines' : 'Protein'}>
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block" />
                        <span>{slotData.proteinGrams}g</span>
                        <span className="text-[9px] text-sky-600 font-normal">{lang === 'FR' ? 'Prot' : 'Pro'}</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-0.5 text-amber-800 font-semibold" title={lang === 'FR' ? 'Glucides' : 'Carbs'}>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                        <span>{slotData.carbsGrams}g</span>
                        <span className="text-[9px] text-amber-600 font-normal">{lang === 'FR' ? 'Gluc' : 'Carb'}</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-0.5 text-rose-800 font-semibold" title={lang === 'FR' ? 'Lipides' : 'Fat'}>
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                        <span>{slotData.fatGrams}g</span>
                        <span className="text-[9px] text-rose-600 font-normal">{lang === 'FR' ? 'Lip' : 'Fat'}</span>
                      </span>
                    </span>
                  )}
                  <span className="text-xs font-medium text-[#7C9A92]">
                    {meals.length === 0
                      ? (lang === 'FR' ? '0 repas planifié' : '0 planned')
                      : (lang === 'FR' ? `${meals.length} planifié${meals.length > 1 ? 's' : ''}` : `${meals.length} planned`)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    id={`btn-suggest-slot-${type.toLowerCase()}`}
                    onClick={() => {
                      setSuggestionsInitialSlot(type);
                      setIsSuggestionsModalOpen(true);
                    }}
                    className="p-1.5 rounded-xl text-teal-700 hover:bg-teal-50 transition-colors flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 border border-teal-200 bg-teal-50/50 cursor-pointer"
                    title={`${lang === 'FR' ? 'Suggérer pour' : 'Suggest for'} ${label}`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    <span className="hidden sm:inline">{lang === 'FR' ? 'Auto-Suggest' : 'Auto-Suggest'}</span>
                  </button>
                  <button
                    onClick={() => handleOpenAddModal(type)}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-[#0D3B37] hover:bg-slate-100 transition-colors cursor-pointer"
                    title={`${lang === 'FR' ? 'Ajouter' : 'Add'} ${label}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {meals.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSuggestionsInitialSlot(type);
                      setIsSuggestionsModalOpen(true);
                    }}
                    className="py-2.5 px-3 rounded-2xl bg-teal-50/70 hover:bg-teal-100/70 border border-teal-200/80 text-center text-xs font-bold text-teal-900 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                    <span>{lang === 'FR' ? `Auto-Suggest (Anti-Gaspillage)` : `Auto-Suggest (Zero-Waste)`}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenAddModal(type)}
                    className="py-2.5 px-3 rounded-2xl bg-[#FAF7F2] hover:bg-[#EFE9DF] border border-[var(--md-sys-color-outline-variant)] text-center text-xs font-bold text-[#111A15] transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#004D36]" />
                    <span>{lang === 'FR' ? '+ Planifier un repas' : '+ Plan Meal'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {meals.map((meal) => {
                    const hasMissingIngredients = meal.ingredients.some((ing) => !ing.inStock);

                    return (
                      <div
                        key={meal.id}
                        className={`p-3 rounded-2xl border transition-all select-none ${
                          meal.isCooked
                            ? 'bg-slate-50/80 border-slate-200 text-slate-400'
                            : 'bg-white border-[#E5DFD0] shadow-2xs hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Meal Photo Thumbnail */}
                          <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-[#E5DFD0] bg-[#FAF8F5] shadow-2xs">
                            {(() => {
                              const hasRealFoodPhoto = meal.imageUrl?.trim() && !isDocumentScan(meal.imageUrl);
                              const photoSrc = hasRealFoodPhoto
                                ? meal.imageUrl!
                                : getCuratedMealPhoto(meal.title, meal.mealType);
                              return (
                                <img
                                  src={photoSrc}
                                  alt={meal.title}
                                  referrerPolicy="no-referrer"
                                  className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${
                                    meal.isCooked ? 'grayscale-25 opacity-70' : ''
                                  }`}
                                  onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement;
                                    const fallbackPhoto = getCuratedMealPhoto(meal.title, meal.mealType);
                                    if (target.src !== fallbackPhoto) {
                                      target.src = fallbackPhoto;
                                    } else {
                                      target.src = getFoodSvgFallback(meal.title);
                                    }
                                  }}
                                />
                              );
                            })()}
                            {meal.isCooked && (
                              <div className="absolute inset-0 bg-emerald-900/60 flex items-center justify-center text-white">
                                <Check className="w-5 h-5 stroke-[3]" />
                              </div>
                            )}
                          </div>

                          {/* Meal Details */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-1">
                              <h4
                                className={`text-sm font-extrabold tracking-tight leading-snug ${
                                  meal.isCooked ? 'line-through opacity-60 text-slate-500' : 'text-[#0D3B37]'
                                }`}
                              >
                                {getRecipeDisplayTitle(meal, lang)}
                              </h4>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleOpenEditModal(meal)}
                                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white"
                                  title={lang === 'FR' ? 'Modifier le repas' : 'Edit meal'}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onDeleteMeal(meal.id)}
                                  className="p-1 rounded-md text-rose-400 hover:text-rose-700 hover:bg-white"
                                  title={lang === 'FR' ? 'Supprimer le repas' : 'Remove meal'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Servings & Prep Time */}
                            <div className="flex items-center gap-2.5 text-[11px] text-[#527470]">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {meal.prepTimeMinutes || 30} {lang === 'FR' ? 'min' : 'mins'}
                              </span>
                              <span>•</span>
                              <span>
                                {meal.servings || 2} {lang === 'FR' ? 'portions' : 'servings'}
                              </span>
                            </div>

                            {/* Nutritional Badges */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              {/* Calorie Flame Badge */}
                              <span
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full shadow-2xs select-none"
                                title={lang === 'FR' ? 'Calories par portion' : 'Calories per serving'}
                              >
                                <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
                                <span>{meal.caloriesPerServing ?? meal.calories ?? (meal.nutrition?.caloriesPerServing ?? 440)} kcal</span>
                              </span>

                              {/* Macros Badge */}
                              {(meal.macrosPerServing || meal.nutrition?.macrosPerServing) && (() => {
                                const mac = meal.macrosPerServing || meal.nutrition?.macrosPerServing!;
                                return (
                                  <span
                                    className="inline-flex items-center gap-1.5 text-[10.5px] font-medium bg-[#FAF7EE] border border-[#E5DFD0] text-[#0D3B37] px-2.5 py-0.5 rounded-full shadow-2xs select-none"
                                    title={
                                      lang === 'FR'
                                        ? `Macronutriments par portion : ${mac.proteinGrams}g Protéines, ${mac.carbsGrams}g Glucides, ${mac.fatGrams}g Lipides`
                                        : `Macronutrients per serving: ${mac.proteinGrams}g Protein, ${mac.carbsGrams}g Carbs, ${mac.fatGrams}g Fat`
                                    }
                                  >
                                    <span className="flex items-center gap-0.5 text-sky-800 font-semibold" title={lang === 'FR' ? 'Protéines' : 'Protein'}>
                                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block" />
                                      <span>{mac.proteinGrams}g</span>
                                      <span className="text-[9.5px] text-sky-600 font-normal">{lang === 'FR' ? 'Prot' : 'Pro'}</span>
                                    </span>
                                    <span className="text-slate-300 text-[10px]">•</span>
                                    <span className="flex items-center gap-0.5 text-amber-800 font-semibold" title={lang === 'FR' ? 'Glucides' : 'Carbs'}>
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                                      <span>{mac.carbsGrams}g</span>
                                      <span className="text-[9.5px] text-amber-600 font-normal">{lang === 'FR' ? 'Gluc' : 'Carb'}</span>
                                    </span>
                                    <span className="text-slate-300 text-[10px]">•</span>
                                    <span className="flex items-center gap-0.5 text-rose-800 font-semibold" title={lang === 'FR' ? 'Lipides' : 'Fat'}>
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                                      <span>{mac.fatGrams}g</span>
                                      <span className="text-[9.5px] text-rose-600 font-normal">{lang === 'FR' ? 'Lip' : 'Fat'}</span>
                                    </span>
                                  </span>
                                );
                              })()}

                              {/* Calculation Tier Badge */}
                              <span
                                className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 shadow-2xs select-none ${
                                  meal.calculationMethod === 'MANUAL_OVERRIDE'
                                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                                    : meal.calculationMethod === 'DYNAMIC_AGGREGATED'
                                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                                    : 'bg-purple-50 text-purple-800 border-purple-200'
                                }`}
                                title={
                                  meal.calculationMethod === 'MANUAL_OVERRIDE'
                                    ? (lang === 'FR' ? 'Valeurs personnalisées saisies manuellement' : 'Custom values locked manually')
                                    : meal.calculationMethod === 'DYNAMIC_AGGREGATED'
                                    ? (lang === 'FR' ? 'Calculé dynamiquement selon les ingrédients et portions' : 'Dynamically aggregated from ingredients & portions')
                                    : (lang === 'FR' ? 'Estimé automatiquement par l’intelligence artificielle' : 'AI estimated from recipe ingredients')
                                }
                              >
                                {meal.calculationMethod === 'MANUAL_OVERRIDE' ? (
                                  <>🔒 {lang === 'FR' ? 'Manuel' : 'Manual'}</>
                                ) : meal.calculationMethod === 'DYNAMIC_AGGREGATED' ? (
                                  <>⚙️ {lang === 'FR' ? 'Dynamique' : 'Dynamic'}</>
                                ) : (
                                  <>✨ {lang === 'FR' ? 'Estimé IA' : 'AI Estimated'}</>
                                )}
                              </span>
                            </div>

                            {/* Notes if available */}
                            {meal.notes && (
                              <p className="text-xs text-[#627C65] line-clamp-1 italic">
                                "{meal.notes}"
                              </p>
                            )}

                            {/* Ingredients Badge Checklist */}
                            {meal.ingredients.length > 0 && (
                              <div className="pt-1.5 flex flex-wrap items-center gap-1">
                                {meal.ingredients.map((ing, idx) => (
                                  <span
                                    key={idx}
                                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border flex items-center gap-1 ${
                                      ing.inStock
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                        : 'bg-amber-50 border-amber-200 text-amber-900'
                                    }`}
                                  >
                                    {ing.inStock ? (
                                      <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                    ) : (
                                      <AlertCircle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                    )}
                                    <span className="truncate max-w-[120px]">{getItemDisplayName(ing, lang)}</span>
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Action Buttons: Mark Cooked & Missing to Grocery */}
                            <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleToggleCooked(meal)}
                                  className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
                                    meal.isCooked
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-white border border-[#D5CDBC] text-[#133E3B] hover:bg-[#F0EDE4]'
                                  }`}
                                >
                                  {meal.isCooked ? (
                                    <>
                                      <CheckSquare className="w-3.5 h-3.5" />
                                      <span>{lang === 'FR' ? 'Cuisiné' : 'Cooked'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Square className="w-3.5 h-3.5" />
                                      <span>{lang === 'FR' ? 'Marquer cuisiné' : 'Mark as Cooked'}</span>
                                    </>
                                  )}
                                </button>

                                {activeRecipe && (activeRecipe.id === meal.id || activeRecipe.title.trim().toLowerCase() === meal.title.trim().toLowerCase()) ? (
                                  <button
                                    type="button"
                                    onClick={() => resumeCooking()}
                                    className="px-2 py-1 rounded-xl text-xs font-black text-[#002115] bg-[#9DF4C7] hover:bg-[#86E4B3] border border-[#004D36]/40 transition-all cursor-pointer shadow-xs flex items-center gap-1"
                                    title={lang === 'FR' ? 'Reprendre la cuisine (étape exacte)' : 'Resume cooking at exact step'}
                                  >
                                    <Play className="w-3 h-3 fill-current text-[#004D36]" />
                                    <span>{lang === 'FR' ? `Reprendre (${currentStepIndex + 1})` : `Resume (${currentStepIndex + 1})`}</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleLaunchMealCooking(meal)}
                                    className="px-2 py-1 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                                    title={lang === 'FR' ? 'Mode cuisine guidé avec minuteur' : 'Guided cooking mode with timer'}
                                  >
                                    <ChefHat className="w-3 h-3 text-emerald-600" />
                                    <span className="hidden sm:inline">{lang === 'FR' ? 'Cuisiner' : 'Cook'}</span>
                                  </button>
                                )}
                              </div>

                              {hasMissingIngredients && onAddIngredientsToGrocery && (
                                <button
                                  onClick={() => handlePushMissingToGrocery(meal)}
                                  className="px-2 py-1 rounded-xl bg-amber-100/70 hover:bg-amber-100 text-amber-900 text-[11px] font-bold flex items-center gap-1 transition-all border border-amber-200/80 shadow-2xs"
                                >
                                  <ShoppingBag className="w-3 h-3 text-amber-700" />
                                  <span>{lang === 'FR' ? 'Manquants aux courses' : 'Add Missing to Grocery'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Meal Modal (Full Screen with Exit Button) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#FAF7EE] flex flex-col w-full h-full overflow-hidden text-[#133E3B] animate-fade-in">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-[#E8E2D5] flex items-center justify-between bg-white/90 backdrop-blur-xs shrink-0">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-teal-700" />
              <h3 className="text-sm sm:text-base font-black text-[#0D3B37]">
                {editingMeal
                  ? (lang === 'FR' ? 'Modifier le Repas Planifié' : 'Edit Planned Meal')
                  : (lang === 'FR' ? `Planifier un Repas pour le ${selectedDate}` : `Plan a Meal for ${selectedDate}`)}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
              title={lang === 'FR' ? 'Quitter' : 'Exit'}
            >
              <X className="w-4 h-4" />
              <span>{lang === 'FR' ? 'Quitter' : 'Exit'}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-2xl mx-auto w-full">
            {/* Quick Inspiration Banner */}
            {!editingMeal && (
              <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-teal-800" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-teal-950">
                      {lang === 'FR' ? 'Besoin d’inspiration anti-gaspillage ?' : 'Need zero-waste inspiration?'}
                    </h4>
                    <p className="text-[11px] text-[#527470]">
                      {lang === 'FR'
                        ? 'Laissez l’IA explorer votre inventaire et le web pour vous.'
                        : 'Let AI explore your inventory and the web for you.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSuggestionsInitialSlot(mealType);
                    setIsSuggestionsModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shrink-0 flex items-center gap-1 shadow-2xs active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{lang === 'FR' ? 'Suggestions' : 'Suggestions'}</span>
                </button>
              </div>
            )}

            <form onSubmit={handleSaveMeal} className="space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0D3B37]">
                  {lang === 'FR' ? 'Nom du plat ou repas *' : 'Meal or Dish Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    lang === 'FR'
                      ? 'ex. Saumon aux herbes citronné avec asperges, Spaghetti Bolognese...'
                      : 'e.g. Lemon Herb Salmon with Asparagus, Beef Bolognese...'
                  }
                  value={mealTitle}
                  onChange={(e) => setMealTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5CDBC] text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
                />
              </div>

              {/* Meal Slot Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0D3B37]">
                  {lang === 'FR' ? 'Type de Repas' : 'Meal Type'}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {MEAL_TYPES.map(({ type, label }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMealType(type)}
                      className={`py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        mealType === type
                          ? 'bg-teal-700 text-white border-teal-800 shadow-2xs'
                          : 'bg-white text-[#133E3B] border-[#D5CDBC] hover:bg-[#F0EDE4]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Servings & Prep Time Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0D3B37]">
                    {lang === 'FR' ? 'Portions' : 'Servings'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={servings}
                    onChange={(e) => {
                      const val = Math.max(1, Number(e.target.value) || 1);
                      setServings(val);
                      if (!isManualOverrideLocked) {
                        setFormTotalCalories(formCaloriesPerServing * val);
                        setFormCalculationMethod('DYNAMIC_AGGREGATED');
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#D5CDBC] text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#0D3B37]">
                    {lang === 'FR' ? 'Temps préparation & cuisson (min)' : 'Prep & Cook Time (mins)'}
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={prepTime}
                    onChange={(e) => setPrepTime(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#D5CDBC] text-sm"
                  />
                </div>
              </div>

              {/* Nutritional Engine Control Section (Methods A, B, C) */}
              <div className="p-3.5 rounded-2xl bg-[#FAF7EE]/60 border border-[#E5DFD0] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0D3B37]">
                      {lang === 'FR' ? 'Calculateur Nutritionnel (Calories & Macros)' : 'Nutritional Engine (Calories & Macros)'}
                    </span>
                  </div>

                  {/* 3 Calculation Tiers Switcher */}
                  <div className="inline-flex rounded-xl border border-[#E5DFD0] bg-white p-0.5 text-[11px] font-bold shadow-2xs">
                    <button
                      type="button"
                      onClick={handleAutoEstimateNutrition}
                      className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                        formCalculationMethod === 'AI_ESTIMATED'
                          ? 'bg-purple-50 text-purple-900 border border-purple-200 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-black'
                      }`}
                      title="Method A: AI Auto-Estimation based on ingredients"
                    >
                      ✨ {lang === 'FR' ? 'Méthode A (IA)' : 'Method A (AI)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRecalculateDynamicNutrition(servings)}
                      className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                        formCalculationMethod === 'DYNAMIC_AGGREGATED'
                          ? 'bg-teal-50 text-teal-900 border border-teal-200 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-black'
                      }`}
                      title="Method B: Dynamic Aggregation scaling"
                    >
                      ⚙️ {lang === 'FR' ? 'Méthode B (Dynamique)' : 'Method B (Dynamic)'}
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleManualOverride}
                      className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        formCalculationMethod === 'MANUAL_OVERRIDE' || isManualOverrideLocked
                          ? 'bg-amber-50 text-amber-900 border border-amber-200 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-black'
                      }`}
                      title="Method C: Manual Override Lock"
                    >
                      {isManualOverrideLocked ? <Lock className="w-2.5 h-2.5 text-amber-700" /> : <Unlock className="w-2.5 h-2.5" />}
                      <span>{lang === 'FR' ? 'Méthode C (Manuel)' : 'Method C (Manual)'}</span>
                    </button>
                  </div>
                </div>

                {/* Calorie Inputs Row */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#0D3B37] flex items-center justify-between">
                      <span>{lang === 'FR' ? 'Calories / portion :' : 'Calories / serving:'}</span>
                      {isManualOverrideLocked && <span className="text-[9px] text-amber-800 font-mono font-bold">🔒 Locked</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={formCaloriesPerServing}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setFormCaloriesPerServing(val);
                          setFormTotalCalories(val * servings);
                          setFormCalculationMethod('MANUAL_OVERRIDE');
                          setIsManualOverrideLocked(true);
                        }}
                        className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#D5CDBC] font-mono text-sm font-bold text-[#0D3B37] focus:outline-hidden focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                      />
                      <span className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-400">kcal</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#0D3B37]">
                      {lang === 'FR' ? 'Total plat (x portions) :' : 'Total dish calories:'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={formTotalCalories}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setFormTotalCalories(val);
                          setFormCaloriesPerServing(Math.round(val / Math.max(1, servings)));
                          setFormCalculationMethod('MANUAL_OVERRIDE');
                          setIsManualOverrideLocked(true);
                        }}
                        className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#D5CDBC] font-mono text-sm font-bold text-[#0D3B37] focus:outline-hidden focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                      />
                      <span className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-400">kcal</span>
                    </div>
                  </div>
                </div>

                {/* Macro Inputs Row (Protein, Carbs, Fat) */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#0D3B37] block">
                    {lang === 'FR' ? 'Macronutriments par portion :' : 'Macronutrients per serving:'}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Protein */}
                    <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100 space-y-1 shadow-2xs">
                      <label className="text-[10px] font-bold uppercase text-sky-900 block">
                        {lang === 'FR' ? 'Protéines' : 'Protein'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formProteinGrams}
                          onChange={(e) => {
                            setFormProteinGrams(Number(e.target.value) || 0);
                            setFormCalculationMethod('MANUAL_OVERRIDE');
                            setIsManualOverrideLocked(true);
                          }}
                          className="w-full px-2 py-1 rounded-lg bg-white border border-sky-200 text-xs font-mono font-bold text-sky-950 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                        />
                        <span className="absolute right-2 top-1 text-[10px] font-bold text-slate-400">g</span>
                      </div>
                    </div>

                    {/* Carbs */}
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 space-y-1 shadow-2xs">
                      <label className="text-[10px] font-bold uppercase text-amber-900 block">
                        {lang === 'FR' ? 'Glucides' : 'Carbs'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formCarbsGrams}
                          onChange={(e) => {
                            setFormCarbsGrams(Number(e.target.value) || 0);
                            setFormCalculationMethod('MANUAL_OVERRIDE');
                            setIsManualOverrideLocked(true);
                          }}
                          className="w-full px-2 py-1 rounded-lg bg-white border border-amber-200 text-xs font-mono font-bold text-amber-950 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                        />
                        <span className="absolute right-2 top-1 text-[10px] font-bold text-slate-400">g</span>
                      </div>
                    </div>

                    {/* Fat */}
                    <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 space-y-1 shadow-2xs">
                      <label className="text-[10px] font-bold uppercase text-rose-900 block">
                        {lang === 'FR' ? 'Lipides' : 'Fat'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formFatGrams}
                          onChange={(e) => {
                            setFormFatGrams(Number(e.target.value) || 0);
                            setFormCalculationMethod('MANUAL_OVERRIDE');
                            setIsManualOverrideLocked(true);
                          }}
                          className="w-full px-2 py-1 rounded-lg bg-white border border-rose-200 text-xs font-mono font-bold text-rose-950 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                        />
                        <span className="absolute right-2 top-1 text-[10px] font-bold text-slate-400">g</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calculation Tier Status & Helper Message */}
                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  <div className="flex items-center gap-1.5 text-[#556D58]">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      {formCalculationMethod === 'MANUAL_OVERRIDE'
                        ? (lang === 'FR' ? 'Valeurs personnalisées verrouillées' : 'Custom values locked manually')
                        : formCalculationMethod === 'DYNAMIC_AGGREGATED'
                        ? (lang === 'FR' ? 'Calcul dynamique selon les portions' : 'Dynamically aggregated from portions')
                        : (lang === 'FR' ? 'Estimation auto IA d’après les ingrédients' : 'AI estimated from ingredients')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoEstimateNutrition}
                    className="text-[10px] font-black text-teal-800 hover:underline cursor-pointer"
                  >
                    {lang === 'FR' ? '↻ Recalculer auto' : '↻ Recalculate'}
                  </button>
                </div>
              </div>

              {/* Ingredients List (One per line) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0D3B37]">
                    {lang === 'FR' ? 'Ingrédients nécessaires (un par ligne)' : 'Ingredients Needed (one per line)'}
                  </label>
                  <span className="text-[10px] text-[#527470]">
                    {lang === 'FR' ? 'Vérifie auto le stock du frigo' : 'Auto-checks fridge stock'}
                  </span>
                </div>
                <textarea
                  rows={3}
                  placeholder={
                    lang === 'FR'
                      ? `Pavés de saumon\nÉpinards frais bio\nAil & Huile d'olive`
                      : `Wild Salmon Fillets\nOrganic Baby Spinach\nGarlic & Olive Oil`
                  }
                  value={ingredientsText}
                  onChange={(e) => setIngredientsText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5CDBC] text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0D3B37]">
                  {lang === 'FR' ? 'Notes ou lien de la recette' : 'Notes or Recipe Link'}
                </label>
                <input
                  type="text"
                  placeholder={
                    lang === 'FR'
                      ? 'ex. Doubler la sauce citron, mariner 15 min...'
                      : 'e.g. Double the lemon sauce, marinate 15 mins...'
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#D5CDBC] text-xs"
                />
              </div>

              {/* Photo & Visual Representation (Live Preview & Presets) */}
              <div className="space-y-2 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E5DFD0]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0D3B37]">
                    {lang === 'FR' ? 'Photo du Repas (Aperçu & Suggérés)' : 'Meal Photo (Preview & Presets)'}
                  </label>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      {lang === 'FR' ? 'Réinitialiser' : 'Reset'}
                    </button>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  {/* Live Photo Preview */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#E0D9C8] bg-white shadow-2xs relative">
                    <img
                      src={(imageUrl.trim() && !isDocumentScan(imageUrl)) ? imageUrl.trim() : getCuratedMealPhoto(mealTitle || 'Repas', mealType)}
                      alt="Aperçu repas"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <input
                      type="url"
                      placeholder={lang === 'FR' ? 'Lien image https://... (optionnel)' : 'Image URL https://... (optional)'}
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#D5CDBC] text-xs font-sans placeholder:text-slate-400"
                    />
                    <p className="text-[10px] text-[#527470]">
                      {lang === 'FR'
                        ? 'Une photo haute résolution est automatiquement assignée si le champ est vide.'
                        : 'A curated high-definition photo is automatically assigned if left empty.'}
                    </p>
                  </div>
                </div>

                {/* Popular Photo Presets */}
                <div className="pt-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7C9A92] block mb-1">
                    {lang === 'FR' ? 'Photos populaires suggérées :' : 'Suggested Photo Presets:'}
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {CURATED_FOOD_PHOTOS.slice(0, 8).map((preset) => {
                      const isSelected = imageUrl === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setImageUrl(preset.url)}
                          className={`px-2 py-1 rounded-xl text-[10px] font-bold border shrink-0 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                            isSelected
                              ? 'bg-teal-700 text-white border-teal-800'
                              : 'bg-white hover:bg-teal-50 border-[#E5DFD0] text-[#0D3B37]'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.labelFr}
                            className="w-4 h-4 rounded-full object-cover shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <span>{lang === 'FR' ? preset.labelFr.split(' ')[0] : preset.labelEn.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#D5CDBC] bg-white text-xs font-bold text-slate-600 hover:bg-[#F0EDE4]"
                >
                  {lang === 'FR' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-60"
                >
                  {isSubmitting
                    ? (lang === 'FR' ? 'Enregistrement...' : 'Saving...')
                    : editingMeal
                    ? (lang === 'FR' ? 'Mettre à jour' : 'Update Meal')
                    : (lang === 'FR' ? 'Ajouter au Calendrier' : 'Add to Calendar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smart Meal Suggestions Modal (Anti-Waste, User Recipes & Web Search) */}
      <SmartMealSuggestionsModal
        isOpen={isSuggestionsModalOpen}
        onClose={() => setIsSuggestionsModalOpen(false)}
        inventory={items}
        currentDate={selectedDate}
        initialMealType={suggestionsInitialSlot}
        onPlanMeal={handlePlanSuggestedMeal}
        onImportRecipe={(recipe) => {
          setIsSuggestionsModalOpen(false);
          setRecipeToReview(recipe);
        }}
      />

      {/* Recipe Review & Edit Modal for Suggested Recipe Imports */}
      {recipeToReview && (
        <AddRecipeModal
          isOpen={Boolean(recipeToReview)}
          onClose={() => setRecipeToReview(null)}
          recipeToEdit={recipeToReview}
          onRecipeSaved={(saved) => {
            setRecipeToReview(null);
            setSuccessToast(
              lang === 'FR'
                ? `✨ Recette "${saved.title}" enregistrée dans vos recettes !`
                : `✨ Recipe "${saved.title}" saved to your cookbook!`
            );
            setTimeout(() => setSuccessToast(null), 3500);
          }}
        />
      )}

      {/* Meal Plan Shopping List Modal with Kitchen Cross-Check */}
      <MealPlanShoppingListModal
        isOpen={isShoppingListModalOpen}
        onClose={() => setIsShoppingListModalOpen(false)}
        plannedMeals={plannedMeals}
        inventoryItems={items}
        onAddIngredientsToGrocery={onAddIngredientsToGrocery}
        onNavigateToGrocery={onNavigateToGrocery}
      />

      {/* Daily Nutrition Goal Settings Modal (2D Flat Design Aesthetic) */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white border border-[#E5DFD0] rounded-3xl w-full max-w-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#FAF7EE] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#0D3B37]">
                  {lang === 'FR' ? 'Objectifs Nutritionnels Quotidiens' : 'Daily Nutritional Budget Goals'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="p-1.5 rounded-xl border border-[#E5DFD0] bg-white text-slate-500 hover:text-[#0D3B37] hover:bg-[#FAF7EE] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDailyGoals} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0D3B37] block">
                  {lang === 'FR' ? 'Budget Calorique Journalier (kcal) :' : 'Daily Calorie Target (kcal):'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="800"
                    max="6000"
                    step="50"
                    value={customGoalKcal}
                    onChange={(e) => setCustomGoalKcal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#D5CDBC] font-mono text-base font-bold text-[#0D3B37] focus:outline-hidden focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">kcal/day</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0D3B37] block">
                  {lang === 'FR' ? 'Objectifs Macronutriments (g) :' : 'Daily Macro Targets (grams):'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-sky-900 block">
                      {lang === 'FR' ? 'Protéines' : 'Protein'}
                    </label>
                    <input
                      type="number"
                      min="20"
                      max="400"
                      value={customGoalProtein}
                      onChange={(e) => setCustomGoalProtein(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-sky-50/70 border border-sky-200 font-mono text-xs font-bold text-sky-950 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-amber-900 block">
                      {lang === 'FR' ? 'Glucides' : 'Carbs'}
                    </label>
                    <input
                      type="number"
                      min="20"
                      max="600"
                      value={customGoalCarbs}
                      onChange={(e) => setCustomGoalCarbs(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-amber-50/70 border border-amber-200 font-mono text-xs font-bold text-amber-950 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-rose-900 block">
                      {lang === 'FR' ? 'Lipides' : 'Fat'}
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="250"
                      value={customGoalFat}
                      onChange={(e) => setCustomGoalFat(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-rose-50/70 border border-rose-200 font-mono text-xs font-bold text-rose-950 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-[#E5DFD0] bg-white text-xs font-bold text-[#0D3B37] hover:bg-[#FAF7EE] transition-colors cursor-pointer shadow-2xs"
                >
                  {lang === 'FR' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  {lang === 'FR' ? 'Enregistrer le budget' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

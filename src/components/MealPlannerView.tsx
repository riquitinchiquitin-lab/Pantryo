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
} from 'lucide-react';
import { PlannedMeal, MealType, InventoryItem, PlannedMealIngredient } from '../types';
import { getFoodVisual } from '../utils/foodVisuals';
import { useLanguage } from '../utils/i18n';

interface MealPlannerViewProps {
  householdId: string;
  items: InventoryItem[];
  plannedMeals: PlannedMeal[];
  onAddMeal: (meal: Omit<PlannedMeal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  onUpdateMeal: (mealId: string, updates: Partial<PlannedMeal>) => Promise<boolean>;
  onDeleteMeal: (mealId: string) => Promise<boolean>;
  onAddIngredientsToGrocery?: (ingredients: Array<{ name: string; quantity: number; unit: string; category?: string }>) => void;
  onOpenRecipes?: () => void;
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
}) => {
  const { t, lang } = useLanguage();

  const MEAL_TYPES: { type: MealType; label: string; color: string; bg: string; border: string }[] = useMemo(() => [
    { type: 'BREAKFAST', label: lang === 'FR' ? 'Petit-déjeuner' : 'Breakfast', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    { type: 'LUNCH', label: lang === 'FR' ? 'Déjeuner' : 'Lunch', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { type: 'DINNER', label: lang === 'FR' ? 'Dîner' : 'Dinner', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    { type: 'SNACK', label: lang === 'FR' ? 'Collation' : 'Snack', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  ], [lang]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  // Month navigation state
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<PlannedMeal | null>(null);
  const [selectedSlotType, setSelectedSlotType] = useState<MealType>('DINNER');

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

  // Helper: Get days of the week for weekly strip
  const weekDays = useMemo(() => {
    const curr = new Date(selectedDate);
    const day = curr.getDay(); // 0 is Sunday
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday to monday start
    const monday = new Date(curr.setDate(diff));

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
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
      days.push({
        date: d,
        isoString: d.toISOString().split('T')[0],
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: d.toISOString().split('T')[0] === todayStr,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const iso = d.toISOString().split('T')[0];
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
      days.push({
        date: d,
        isoString: d.toISOString().split('T')[0],
        dayNumber: i,
        isCurrentMonth: false,
        isToday: d.toISOString().split('T')[0] === todayStr,
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
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (meal: PlannedMeal) => {
    setEditingMeal(meal);
    setMealTitle(meal.title);
    setMealType(meal.mealType);
    setPrepTime(meal.prepTimeMinutes || 30);
    setServings(meal.servings || 2);
    setNotes(meal.notes || '');
    setImageUrl(meal.imageUrl || '');
    setIngredientsText(meal.ingredients.map((i) => `${i.name}${i.quantity ? ` (${i.quantity} ${i.unit || ''})` : ''}`).join('\n'));
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
          // Check if item exists in kitchen items
          const cleanName = line.replace(/\(.*\)/, '').trim();
          const found = items.some(
            (it) => it.name.toLowerCase().includes(cleanName.toLowerCase()) || cleanName.toLowerCase().includes(it.name.toLowerCase())
          );
          return {
            name: line,
            inStock: found,
          };
        });

      // Auto-resolve image from food visual if none provided
      const resolvedImage = imageUrl.trim() || getFoodVisual(mealTitle).defaultImage;

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
        });
        setSuccessToast(lang === 'FR' ? 'Repas mis à jour !' : 'Meal plan updated!');
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
        });
        setSuccessToast(lang === 'FR' ? 'Nouveau repas planifié !' : 'New meal planned!');
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error('Failed to save meal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCooked = async (meal: PlannedMeal) => {
    await onUpdateMeal(meal.id, { isCooked: !meal.isCooked });
    setSuccessToast(
      meal.isCooked
        ? (lang === 'FR' ? 'Marqué comme prévu' : 'Marked as planned')
        : (lang === 'FR' ? '🎉 Repas marqué cuisiné !' : '🎉 Meal marked cooked!')
    );
    setTimeout(() => setSuccessToast(null), 3000);
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
    <div className="space-y-4 pb-28 animate-fade-in">
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

      {/* Header Banner */}
      <div className="p-4 rounded-3xl bg-white border border-[#E5DFD0] shadow-2xs space-y-3">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-black tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                {lang === 'FR' ? 'Calendrier Cuisine' : 'Kitchen Calendar'}
              </span>
              <span className="text-[11px] text-[#527470]">
                {lang === 'FR' ? 'Planning des Repas du Foyer' : 'Household Meal Schedule'}
              </span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-[#0D3B37] mt-0.5">
              {lang === 'FR' ? 'Planificateur & Calendrier des Repas' : 'Meal Planner & Calendar'}
            </h2>
            <p className="text-xs text-[#527470]">
              {lang === 'FR'
                ? 'Planifiez vos repas en utilisant les ingrédients disponibles dans votre frigo et garde-manger.'
                : 'Plan breakfasts, lunches & dinners using ingredients in your fridge & pantry.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="px-3 py-1.5 rounded-xl border border-[#D5CDBC] bg-[#F8F5EC] text-xs font-bold text-[#133E3B] hover:bg-[#EFEAE0] transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-teal-700" />
              {lang === 'FR' ? "Aujourd'hui" : 'Today'}
            </button>
            <div className="inline-flex rounded-xl p-1 bg-[#F0EDE4] border border-[#E0D9C8]">
              <button
                onClick={() => setViewMode('week')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'week' ? 'bg-white text-teal-900 shadow-2xs' : 'text-[#627C65] hover:text-[#133E3B]'
                }`}
              >
                {lang === 'FR' ? 'Semaine' : 'Week'}
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'month' ? 'bg-white text-teal-900 shadow-2xs' : 'text-[#627C65] hover:text-[#133E3B]'
                }`}
              >
                {lang === 'FR' ? 'Mois' : 'Month'}
              </button>
            </div>
          </div>
        </div>

        {/* View Mode: WEEK STRIP */}
        {viewMode === 'week' ? (
          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {weekDays.map((d) => {
              const count = mealsByDateMap.get(d.isoString)?.length || 0;
              const hasCooked = mealsByDateMap.get(d.isoString)?.some((m) => m.isCooked);
              return (
                <button
                  key={d.isoString}
                  onClick={() => setSelectedDate(d.isoString)}
                  className={`p-2 rounded-2xl flex flex-col items-center justify-between transition-all text-center border relative ${
                    d.isSelected
                      ? 'bg-teal-700 text-white border-teal-800 shadow-sm scale-102'
                      : d.isToday
                      ? 'bg-teal-50/80 text-teal-900 border-teal-300'
                      : 'bg-[#F9F7F1] text-[#133E3B] border-[#EAE3D4] hover:bg-white hover:border-[#D5CDBC]'
                  }`}
                >
                  <span className={`text-[10px] font-bold ${d.isSelected ? 'text-teal-100' : 'text-[#658578]'}`}>
                    {d.dayName}
                  </span>
                  <span className={`text-base font-black my-0.5 ${d.isSelected ? 'text-white' : 'text-[#0D3B37]'}`}>
                    {d.dayNumber}
                  </span>
                  {/* Meal Indicator Dots */}
                  <div className="flex items-center gap-0.5 h-2">
                    {count > 0 ? (
                      Array.from({ length: Math.min(count, 3) }).map((_, idx) => (
                        <span
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full ${
                            d.isSelected ? 'bg-amber-300' : hasCooked ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                        />
                      ))
                    ) : (
                      <span className="w-1.5 h-1.5 opacity-0" />
                    )}
                  </div>
                </button>
              );
            })}
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
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-teal-700" />
          <h3 className="text-sm font-black text-[#0D3B37] capitalize">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString(lang === 'FR' ? 'fr-FR' : 'en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </h3>
          {selectedDate === todayStr && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
              {lang === 'FR' ? "Aujourd'hui" : 'Today'}
            </span>
          )}
        </div>

        <button
          onClick={() => handleOpenAddModal('DINNER')}
          className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          {lang === 'FR' ? 'Planifier un Repas' : 'Plan Meal'}
        </button>
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
            {onOpenRecipes && (
              <button
                onClick={onOpenRecipes}
                className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
              >
                {lang === 'FR' ? 'Idées Recettes' : 'Find Recipes'} <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {expiringItems.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setMealTitle(lang === 'FR' ? `Cuisiner avec ${item.name}` : `Cook with ${item.name}`);
                  setMealType('DINNER');
                  setIngredientsText(item.name);
                  setImageUrl(item.imageUrl || '');
                  setIsModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-xl bg-white border border-amber-200 text-[11px] font-semibold text-amber-900 shrink-0 hover:bg-amber-100/50 flex items-center gap-1 shadow-2xs"
              >
                <span>{item.name}</span>
                <span className="text-[10px] font-bold text-amber-600">
                  ({item.daysUntilExpiration !== null && item.daysUntilExpiration <= 0 ? (lang === 'FR' ? 'Expiré' : 'Expiring') : `${item.daysUntilExpiration}j`})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Meal Slots (Breakfast, Lunch, Dinner, Snack) */}
      <div className="space-y-3">
        {MEAL_TYPES.map(({ type, label, color, bg, border }) => {
          const meals = mealsForSelectedDate.filter((m) => m.mealType === type);

          return (
            <div key={type} className="rounded-3xl bg-white border border-[#E5DFD0] shadow-2xs p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black tracking-wide ${bg} ${color} border ${border}`}>
                    {label}
                  </span>
                  <span className="text-xs text-[#627C65]">
                    {meals.length === 0
                      ? (lang === 'FR' ? 'Aucun repas prévu' : 'No meals planned')
                      : (lang === 'FR' ? `${meals.length} planifié${meals.length > 1 ? 's' : ''}` : `${meals.length} planned`)}
                  </span>
                </div>
                <button
                  onClick={() => handleOpenAddModal(type)}
                  className="p-1 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-[#F3EFE6] transition-colors"
                  title={`${lang === 'FR' ? 'Ajouter' : 'Add'} ${label}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {meals.length === 0 ? (
                <button
                  onClick={() => handleOpenAddModal(type)}
                  className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-[#E5DFD0] text-center text-xs font-semibold text-[#82998C] hover:text-teal-800 hover:border-teal-300 hover:bg-teal-50/20 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-600" />
                  {lang === 'FR' ? `Planifier ${label} pour ce jour` : `Plan ${label} for this day`}
                </button>
              ) : (
                <div className="space-y-2.5">
                  {meals.map((meal) => {
                    const hasMissingIngredients = meal.ingredients.some((ing) => !ing.inStock);

                    return (
                      <div
                        key={meal.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          meal.isCooked
                            ? 'bg-emerald-50/50 border-emerald-200 text-[#133E3B]'
                            : 'bg-[#FCFAF4] border-[#E8E2D5] hover:border-[#D0C7B5]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Meal Photo Thumbnail */}
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#E5DFD0] bg-slate-100">
                            <img
                              src={meal.imageUrl || getFoodVisual(meal.title).defaultImage}
                              alt={meal.title}
                              referrerPolicy="no-referrer"
                              className={`w-full h-full object-cover transition-transform duration-300 ${
                                meal.isCooked ? 'grayscale-25' : ''
                              }`}
                            />
                            {meal.isCooked && (
                              <div className="absolute inset-0 bg-emerald-900/40 flex items-center justify-center text-white">
                                <Check className="w-5 h-5 stroke-[3]" />
                              </div>
                            )}
                          </div>

                          {/* Meal Details */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-1">
                              <h4
                                className={`text-sm font-bold tracking-tight leading-snug ${
                                  meal.isCooked ? 'line-through text-slate-500' : 'text-[#0D3B37]'
                                }`}
                              >
                                {meal.title}
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
                                    <span className="truncate max-w-[120px]">{ing.name}</span>
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Action Buttons: Mark Cooked & Missing to Grocery */}
                            <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
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

      {/* Add / Edit Meal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#FAF7EE] border border-[#E0D9C8] rounded-3xl shadow-2xl p-6 text-[#133E3B] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D5]">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-teal-700" />
                <h3 className="text-base font-black text-[#0D3B37]">
                  {editingMeal
                    ? (lang === 'FR' ? 'Modifier le Repas Planifié' : 'Edit Planned Meal')
                    : (lang === 'FR' ? `Planifier un Repas pour le ${selectedDate}` : `Plan a Meal for ${selectedDate}`)}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-[#E0D9C8] text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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
                    onChange={(e) => setServings(Number(e.target.value))}
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

              {/* Photo URL (Optional) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0D3B37]">
                  {lang === 'FR' ? 'URL Photo Web (Optionnel - auto-généré si vide)' : 'Web Photo URL (Optional - auto-generated if empty)'}
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#D5CDBC] text-xs"
                />
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
    </div>
  );
};

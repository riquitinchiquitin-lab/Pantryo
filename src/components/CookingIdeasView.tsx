import React, { useState, useMemo, useEffect } from 'react';
import {
  ChefHat,
  Sparkles,
  Clock,
  Flame,
  ArrowUpRight,
  ExternalLink,
  Search,
  Check,
  Plus,
  Utensils,
  ChevronDown,
  ChevronUp,
  Globe,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Refrigerator,
  Snowflake,
  Boxes,
  Bookmark,
  Youtube,
  FileText,
  Camera,
  Play,
  Trash2,
  Share2,
  Calendar,
  Coffee,
  Sun,
  Moon,
  Apple,
  ShoppingBag,
  X,
  Layers,
  Thermometer,
  ShieldCheck,
} from 'lucide-react';
import { InventoryItem, PlannedMeal, MealType } from '../types';
import { RICARDO_RECIPES, RicardoRecipe } from '../data/ricardoRecipes';
import { AddRecipeModal } from './AddRecipeModal';
import { useLanguage } from '../utils/i18n';
import { ScrollableRow } from './ScrollableRow';
import { detectSafeCookingRule, SAFE_COOKING_GUIDELINES, SafeCookingRule } from '../utils/safeCookingInstructions';

const LOCAL_STORAGE_CUSTOM_RECIPES = 'kitchen_komrade_custom_recipes';

interface CookingIdeasViewProps {
  items: InventoryItem[];
  onAddMissingToGrocery?: (item: {
    name: string;
    category?: string;
    quantity?: number;
    unit?: string;
    locationType?: 'FRIDGE' | 'FREEZER' | 'PANTRY';
    recipeTitle?: string;
  }) => void;
  onPlanMeal?: (meal: Omit<PlannedMeal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  onNavigateToMealPlanner?: () => void;
}

export const CookingIdeasView: React.FC<CookingIdeasViewProps> = ({
  items,
  onAddMissingToGrocery,
  onPlanMeal,
  onNavigateToMealPlanner,
}) => {
  const { lang, setLang } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<
    'ALL' | 'CHEFS' | 'RICARDO' | 'TROISFOISPARJOUR' | 'JAMIE' | 'CUSTOM' | 'EXPIRING' | 'FAST'
  >('ALL');
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [expandedStepsRecipeId, setExpandedStepsRecipeId] = useState<string | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [addedItemsNotice, setAddedItemsNotice] = useState<string | null>(null);

  // Quick Meal Plan Modal state
  const [planningRecipe, setPlanningRecipe] = useState<RicardoRecipe | null>(null);
  const [targetDate, setTargetDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [targetMealSlot, setTargetMealSlot] = useState<MealType>('DINNER');
  const [planAddMissingToGrocery, setPlanAddMissingToGrocery] = useState(true);
  const [isPlanningLoading, setIsPlanningLoading] = useState(false);

  // Add Recipe Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Custom user-added recipes (persisted in localStorage + synced with backend)
  const [customRecipes, setCustomRecipes] = useState<RicardoRecipe[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOM_RECIPES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse custom recipes from localStorage', e);
    }
    return [];
  });

  // Fetch initial custom recipes from backend API
  useEffect(() => {
    let isMounted = true;
    fetch('/api/v1/recipes/custom', {
      headers: { Accept: 'application/json' },
    })
      .then((res) => {
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          return res.json();
        }
        return null;
      })
      .then((data) => {
        if (isMounted && data && data.success && Array.isArray(data.recipes)) {
          setCustomRecipes((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const newFromBackend = data.recipes.filter(
              (r: RicardoRecipe) => !existingIds.has(r.id)
            );
            const combined = [...newFromBackend, ...prev];
            try {
              localStorage.setItem(
                LOCAL_STORAGE_CUSTOM_RECIPES,
                JSON.stringify(combined)
              );
            } catch (err) {
              console.warn('LocalStorage save failed', err);
            }
            return combined;
          });
        }
      })
      .catch((err) => console.log('Could not fetch custom recipes from server:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Save custom recipes to localStorage when updated
  const handleSaveRecipe = (newRecipe: RicardoRecipe) => {
    setCustomRecipes((prev) => {
      const updated = [newRecipe, ...prev.filter((r) => r.id !== newRecipe.id)];
      try {
        localStorage.setItem(
          LOCAL_STORAGE_CUSTOM_RECIPES,
          JSON.stringify(updated)
        );
      } catch (err) {
        console.warn('LocalStorage save failed', err);
      }
      return updated;
    });

    setAddedItemsNotice(
      lang === 'FR'
        ? `✨ Recette "${newRecipe.titleFr || newRecipe.title}" enregistrée avec succès !`
        : `✨ Recipe "${newRecipe.title}" saved to your kitchen!`
    );
    setTimeout(() => setAddedItemsNotice(null), 4000);
    setActiveFilter('CUSTOM');
  };

  const handleDeleteCustomRecipe = async (recipeId: string, title: string) => {
    if (
      !window.confirm(
        lang === 'FR'
          ? `Supprimer la recette "${title}" ?`
          : `Delete recipe "${title}"?`
      )
    ) {
      return;
    }

    setCustomRecipes((prev) => {
      const updated = prev.filter((r) => r.id !== recipeId);
      try {
        localStorage.setItem(
          LOCAL_STORAGE_CUSTOM_RECIPES,
          JSON.stringify(updated)
        );
      } catch (err) {
        console.warn('LocalStorage save failed', err);
      }
      return updated;
    });

    try {
      await fetch(`/api/v1/recipes/custom/${recipeId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Backend delete recipe failed', e);
    }
  };

  // Combine static Ricardo recipes + custom user-added recipes
  const allRecipes = useMemo(() => {
    return [...customRecipes, ...RICARDO_RECIPES];
  }, [customRecipes]);

  // Items expiring in 3 days or less
  const expiringItems = useMemo(
    () =>
      items.filter(
        (i) =>
          i.isExpiringSoon ||
          (i.daysUntilExpiration !== null && i.daysUntilExpiration <= 3)
      ),
    [items]
  );

  // Check which ingredients in recipes match the household inventory
  const itemNamesNormalized = useMemo(
    () => items.map((i) => i.name.toLowerCase().trim()),
    [items]
  );

  const isIngredientInKitchen = (ingredientName: string, mappedName?: string): boolean => {
    const target = (mappedName || ingredientName).toLowerCase().trim();
    return itemNamesNormalized.some(
      (invName) =>
        invName.includes(target) ||
        target.includes(invName) ||
        (target.includes('salmon') && invName.includes('salmon')) ||
        (target.includes('beef') && invName.includes('beef')) ||
        (target.includes('chicken') && invName.includes('chicken')) ||
        (target.includes('potato') && invName.includes('potato')) ||
        (target.includes('butter') && invName.includes('butter')) ||
        (target.includes('garlic') && invName.includes('garlic')) ||
        (target.includes('spinach') && invName.includes('spinach')) ||
        (target.includes('strawberry') && invName.includes('strawberries')) ||
        (target.includes('strawberries') && invName.includes('strawberries')) ||
        (target.includes('bread') && invName.includes('sourdough')) ||
        (target.includes('avocado') && invName.includes('avocado')) ||
        (target.includes('yogurt') && invName.includes('yogurt')) ||
        (target.includes('egg') && invName.includes('egg')) ||
        (target.includes('milk') && invName.includes('milk')) ||
        (target.includes('tomato') && invName.includes('tomato'))
    );
  };

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    return allRecipes.filter((recipe) => {
      const title = lang === 'FR' ? recipe.titleFr : recipe.title;
      const desc = lang === 'FR' ? recipe.descriptionFr : recipe.descriptionEn;
      const matchesSearch =
        !searchQuery ||
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.ingredients.some((ing) =>
          (lang === 'FR' && ing.nameFr ? ing.nameFr : ing.name)
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        );

      if (!matchesSearch) return false;

      if (activeFilter === 'CHEFS' && !(recipe.isRicardoOfficial || recipe.authorName || recipe.source === 'Chef Recipe')) return false;
      if (activeFilter === 'RICARDO' && !(recipe.isRicardoOfficial || recipe.source === 'Ricardo Cuisine')) return false;
      if (activeFilter === 'TROISFOISPARJOUR' && !(recipe.source === 'Trois Fois Par Jour' || recipe.authorName?.toLowerCase().includes('marilou'))) return false;
      if (activeFilter === 'JAMIE' && !(recipe.source === 'Jamie Oliver' || recipe.authorName?.toLowerCase().includes('jamie'))) return false;
      if (activeFilter === 'CUSTOM' && !recipe.isCustom) return false;
      if (activeFilter === 'FAST') {
        const timeMins = parseInt(recipe.time, 10);
        if (isNaN(timeMins) || timeMins > 20) return false;
      }
      if (activeFilter === 'EXPIRING') {
        const usesExpiring = recipe.ingredients.some((ing) =>
          expiringItems.some(
            (exp) =>
              ing.name.toLowerCase().includes(exp.name.toLowerCase()) ||
              exp.name.toLowerCase().includes(ing.name.toLowerCase())
          )
        );
        if (!usesExpiring) return false;
      }

      return true;
    });
  }, [allRecipes, searchQuery, activeFilter, lang, expiringItems]);

  const handleAddMissing = (
    ingName: string,
    category?: string,
    locType?: 'FRIDGE' | 'FREEZER' | 'PANTRY',
    recipeTitle?: string
  ) => {
    if (onAddMissingToGrocery) {
      onAddMissingToGrocery({
        name: ingName,
        category: category || 'Pantry',
        quantity: 1,
        unit: 'item',
        locationType: locType || 'FRIDGE',
        recipeTitle,
      });
      setAddedItemsNotice(
        lang === 'FR'
          ? `✓ "${ingName}" ajouté à votre liste d'épicerie !`
          : `✓ Added "${ingName}" to your grocery list!`
      );
      setTimeout(() => setAddedItemsNotice(null), 3000);
    }
  };

  // Check if a recipe is saved in My Recipes (customRecipes)
  const isRecipeSaved = (recipe: RicardoRecipe): boolean => {
    return (
      Boolean(recipe.isCustom) ||
      customRecipes.some(
        (r) =>
          r.id === recipe.id ||
          r.id === `saved_${recipe.id}` ||
          r.title.toLowerCase().trim() === recipe.title.toLowerCase().trim()
      )
    );
  };

  // Toggle Save / Unsave recipe to customRecipes for meal planning
  const handleToggleSaveRecipe = async (recipe: RicardoRecipe, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const saved = isRecipeSaved(recipe);

    if (saved) {
      // If it's a user's own created recipe, ask for confirmation
      if (recipe.isCustom && !recipe.id.startsWith('saved_')) {
        handleDeleteCustomRecipe(recipe.id, recipe.titleFr || recipe.title);
        return;
      }
      // Remove saved recipe
      const updated = customRecipes.filter(
        (r) =>
          r.id !== recipe.id &&
          r.id !== `saved_${recipe.id}` &&
          r.title.toLowerCase().trim() !== recipe.title.toLowerCase().trim()
      );
      setCustomRecipes(updated);
      try {
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_RECIPES, JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage save failed', err);
      }
      setAddedItemsNotice(
        lang === 'FR'
          ? `Recette retirée de Mes Recettes.`
          : `Recipe removed from My Recipes.`
      );
      setTimeout(() => setAddedItemsNotice(null), 3000);
    } else {
      // Save recipe
      const savedRecipe: RicardoRecipe = {
        ...recipe,
        id: `saved_${recipe.id}`,
        isCustom: true,
        source: recipe.isRicardoOfficial ? 'Ricardo Cuisine' : (recipe.source || 'Personal'),
      };
      const updated = [savedRecipe, ...customRecipes.filter((r) => r.id !== savedRecipe.id)];
      setCustomRecipes(updated);
      try {
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_RECIPES, JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage save failed', err);
      }

      // Sync to backend if possible
      try {
        await fetch('/api/v1/recipes/custom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedRecipe),
        });
      } catch (err) {
        console.warn('Sync to backend failed', err);
      }

      setAddedItemsNotice(
        lang === 'FR'
          ? `⭐ "${recipe.titleFr || recipe.title}" sauvegardée dans Mes Recettes ! Prête pour le planificateur.`
          : `⭐ "${recipe.title}" saved to My Recipes! Ready for meal planning.`
      );
      setTimeout(() => setAddedItemsNotice(null), 4000);
    }
  };

  // Open Quick Meal Plan modal
  const handleOpenPlanMeal = (recipe: RicardoRecipe, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPlanningRecipe(recipe);

    // Auto-save recipe if not already in customRecipes
    if (!isRecipeSaved(recipe)) {
      const savedRecipe: RicardoRecipe = {
        ...recipe,
        id: `saved_${recipe.id}`,
        isCustom: true,
        source: recipe.isRicardoOfficial ? 'Ricardo Cuisine' : (recipe.source || 'Personal'),
      };
      const updated = [savedRecipe, ...customRecipes.filter((r) => r.id !== savedRecipe.id)];
      setCustomRecipes(updated);
      try {
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_RECIPES, JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage save failed', err);
      }
      fetch('/api/v1/recipes/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedRecipe),
      }).catch(() => {});
    }
  };

  // Confirm Quick Meal Plan schedule
  const handleConfirmMealPlan = async () => {
    if (!planningRecipe) return;
    setIsPlanningLoading(true);

    const recipeTitle =
      lang === 'FR' ? planningRecipe.titleFr || planningRecipe.title : planningRecipe.title;
    const ricardoLink =
      lang === 'FR' ? planningRecipe.ricardoUrlFr : planningRecipe.ricardoUrlEn;

    const plannedMealPayload: Omit<PlannedMeal, 'id' | 'createdAt' | 'updatedAt'> = {
      householdId: 'hh_yan_kriz_01',
      title: recipeTitle,
      date: targetDate,
      mealType: targetMealSlot,
      recipeName: recipeTitle,
      recipeUrl: planningRecipe.youtubeUrl || ricardoLink || undefined,
      imageUrl: planningRecipe.imageUrl,
      servings: planningRecipe.servings
        ? parseInt(planningRecipe.servings.replace(/\D/g, ''), 10) || 2
        : 2,
      prepTimeMinutes: planningRecipe.time
        ? parseInt(planningRecipe.time.replace(/\D/g, ''), 10) || 20
        : 20,
      notes: lang === 'FR' ? planningRecipe.descriptionFr : planningRecipe.descriptionEn,
      isCooked: false,
      ingredients: planningRecipe.ingredients.map((ing) => ({
        name: lang === 'FR' && ing.nameFr ? ing.nameFr : ing.name,
        inStock: isIngredientInKitchen(ing.name, ing.inKitchenItemName),
      })),
    };

    let success = false;
    if (onPlanMeal) {
      success = await onPlanMeal(plannedMealPayload);
    } else {
      try {
        const res = await fetch('/api/v1/inventory/household/hh_yan_kriz_01/meals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(plannedMealPayload),
        });
        const data = await res.json();
        success = Boolean(data.success);
      } catch (err) {
        console.error('Plan meal request failed:', err);
      }
    }

    // Add missing ingredients to grocery if checked
    if (planAddMissingToGrocery && onAddMissingToGrocery) {
      const missing = planningRecipe.ingredients.filter(
        (ing) => !isIngredientInKitchen(ing.name, ing.inKitchenItemName)
      );
      missing.forEach((ing) => {
        onAddMissingToGrocery({
          name: lang === 'FR' && ing.nameFr ? ing.nameFr : ing.name,
          category: ing.category,
          locationType: ing.locationType,
          recipeTitle: recipeTitle,
        });
      });
    }

    setIsPlanningLoading(false);
    setPlanningRecipe(null);

    const slotLabelMap: Record<MealType, { en: string; fr: string }> = {
      BREAKFAST: { en: 'breakfast', fr: 'déjeuner' },
      LUNCH: { en: 'lunch', fr: 'dîner' },
      DINNER: { en: 'dinner', fr: 'souper' },
      SNACK: { en: 'snack', fr: 'collation' },
    };
    const slotLabel = slotLabelMap[targetMealSlot]?.[lang === 'FR' ? 'fr' : 'en'] || targetMealSlot;

    setAddedItemsNotice(
      lang === 'FR'
        ? `📅 "${recipeTitle}" a été planifié pour le ${targetDate} (${slotLabel}) !`
        : `📅 "${recipeTitle}" was scheduled for ${targetDate} (${slotLabel})!`
    );
    setTimeout(() => setAddedItemsNotice(null), 5000);
  };

  // Recipe Search URL generator supporting Ricardo and diverse culinary sources
  const getSearchUrl = (query: string, sourceDomain: string = 'ricardo') => {
    const encoded = encodeURIComponent(query);
    if (sourceDomain === 'troisfoisparjour') {
      return `https://www.troisfoisparjour.com/fr/recettes/?recherche=${encoded}`;
    }
    if (sourceDomain === 'marmiton') {
      return `https://www.marmiton.org/recettes/recherche.aspx?aqt=${encoded}`;
    }
    if (sourceDomain === 'jamieoliver') {
      return `https://www.jamieoliver.com/search/?s=${encoded}`;
    }
    if (sourceDomain === 'seriouseats') {
      return `https://www.seriouseats.com/search?q=${encoded}`;
    }
    const base =
      lang === 'FR'
        ? 'https://www.ricardocuisine.com/fr/recherche?term='
        : 'https://www.ricardocuisine.com/en/search?term=';
    return `${base}${encoded}`;
  };

  const getRicardoSearchUrl = (query: string) => getSearchUrl(query, 'ricardo');

  return (
    <div className="space-y-4 pb-24 animate-fade-in text-slate-800">
      {/* Top Header with Title, Language Switch & Action Button */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h2 className="text-xl font-black tracking-tight text-[#1E3022]">
              {lang === 'FR' ? 'Idées Culinaires & Recettes' : 'Cooking Ideas & Recipes'}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-[10px] font-black tracking-wider uppercase">
              {lang === 'FR' ? 'Chefs & IA' : 'Chefs & AI'}
            </span>
          </div>
          <p className="text-xs text-[#59725C]">
            {lang === 'FR'
              ? 'Ricardo, Marilou, Jamie Oliver, Marmiton, YouTube et vos recettes perso'
              : 'Ricardo, Marilou, Jamie Oliver, Marmiton, YouTube & your custom recipes'}
          </p>
        </div>

        {/* Language switch */}
        <div className="flex items-center rounded-xl bg-white border border-[#D5E1D2] p-0.5 shadow-2xs shrink-0">
          <button
            onClick={() => setLang('EN')}
            className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
              lang === 'EN'
                ? 'bg-[#233527] text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLang('FR')}
            className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
              lang === 'FR'
                ? 'bg-[#233527] text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            FR
          </button>
        </div>
      </div>

      {/* Hero Action Bar: Add Recipe with AI Button */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#18281B] via-[#233827] to-[#162719] text-white shadow-lg flex items-center justify-between gap-3 border border-emerald-500/20">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-[10px] tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'FR' ? 'Assistant Culinaire IA' : 'AI Recipe Importer'}</span>
          </div>
          <h3 className="text-xs font-black text-white truncate">
            {lang === 'FR'
              ? 'Collez un lien YouTube, texte ou photo'
              : 'Paste YouTube link, text, or snap photo'}
          </h3>
          <p className="text-[10px] text-slate-300 truncate">
            {lang === 'FR'
              ? 'L’IA extrait les ingrédients et les compare avec votre frigo'
              : 'AI extracts ingredients & matches with your kitchen inventory'}
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{lang === 'FR' ? '+ Recette' : '+ Add Recipe'}</span>
        </button>
      </div>

      {/* Notice Alert */}
      {addedItemsNotice && (
        <div className="p-3 rounded-2xl bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{addedItemsNotice}</span>
        </div>
      )}

      {/* Culinary Partners & Featured Chefs Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E1B4B] text-white shadow-md space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 backdrop-blur-xs flex items-center justify-center font-black text-sm tracking-wider shadow-inner">
              ⭐
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block">
                {lang === 'FR' ? 'Partenaires Culinaires & Chefs Recommandés' : 'Culinary Partners & Recommended Chefs'}
              </span>
              <h3 className="text-xs font-black tracking-tight leading-tight text-white">
                {lang === 'FR' ? 'Ricardo, Marilou, Jamie Oliver, Marmiton & plus' : 'Ricardo, Marilou, Jamie Oliver, Marmiton & more'}
              </h3>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
            {lang === 'FR' ? 'Cuisine équilibrée & anti-gaspillage' : 'Zero-waste & balanced meals'}
          </span>
        </div>

        {/* Quick direct chef portal badges */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <a
            href={lang === 'FR' ? 'https://www.ricardocuisine.com/fr' : 'https://www.ricardocuisine.com/en'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 rounded-lg bg-red-600/90 hover:bg-red-600 text-white text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
          >
            <span>Ricardo Cuisine</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <a
            href="https://www.troisfoisparjour.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 rounded-lg bg-emerald-700/90 hover:bg-emerald-700 text-white text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
          >
            <span>Trois Fois Par Jour (Marilou)</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <a
            href="https://www.jamieoliver.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 rounded-lg bg-sky-700/90 hover:bg-sky-700 text-white text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
          >
            <span>Jamie Oliver</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <a
            href="https://www.marmiton.org"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 rounded-lg bg-orange-600/90 hover:bg-orange-600 text-white text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
          >
            <span>Marmiton</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* Search Bar with Multi-Chef & Recipe Web Links */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'FR'
                ? 'Rechercher une recette (ex: saumon, pâtes, Jamie Oliver, Marilou)...'
                : 'Search recipes (e.g. salmon, pasta, Jamie Oliver, Marilou)...'
            }
            className="w-full pl-9 pr-36 py-2 bg-white border border-[#D5E1D2] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
          />
          {searchQuery && (
            <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
              <a
                href={getSearchUrl(searchQuery, 'ricardo')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
                title="Search on Ricardo Cuisine"
              >
                <span>Ricardo</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <a
                href={getSearchUrl(searchQuery, 'troisfoisparjour')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold flex items-center gap-1 transition-colors hidden sm:flex"
                title="Search on Trois Fois Par Jour"
              >
                <span>Marilou</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          )}
        </div>

        {/* Expiring Soon Rescue Bar */}
        {expiringItems.length > 0 && (
          <div className="p-3 rounded-2xl bg-[#EAF2E8] border border-[#CADBC7] text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-900 font-black">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{lang === 'FR' ? 'Anti-Gaspillage Prioritaire' : 'Priority Kitchen Rescue'}</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                {expiringItems.length} {lang === 'FR' ? 'à utiliser bientôt' : 'expiring soon'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {expiringItems.map((item) => (
                <a
                  key={item.id}
                  href={getSearchUrl(item.name, 'ricardo')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 rounded-lg bg-white border border-[#CADBC7] text-[10px] font-bold text-[#273D2B] hover:bg-emerald-50 flex items-center gap-1 transition-all"
                  title={`Find recipes using ${item.name}`}
                >
                  <span>{item.name}</span>
                  <ExternalLink className="w-2.5 h-2.5 text-emerald-700" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs with Left/Right Scroll Arrows & Drag Support */}
      <ScrollableRow className="pb-1 text-xs" showChevrons={true}>
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeFilter === 'ALL'
              ? 'bg-[#233527] text-white shadow-xs'
              : 'bg-white border border-[#D5E1D2] text-[#4E6751] hover:bg-slate-50'
          }`}
        >
          {lang === 'FR' ? 'Toutes les Recettes' : 'All Ideas'} ({allRecipes.length})
        </button>

        <button
          onClick={() => setActiveFilter('CUSTOM')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeFilter === 'CUSTOM'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
          }`}
        >
          <Youtube className="w-3.5 h-3.5 text-rose-500" />
          <span>
            {lang === 'FR' ? 'Mes Recettes & YouTube' : 'My Recipes & YouTube'} ({customRecipes.length})
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('CHEFS')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeFilter === 'CHEFS'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100'
          }`}
        >
          <span>👨‍🍳 {lang === 'FR' ? 'Tous les Chefs' : 'All Chefs'}</span>
        </button>

        <button
          onClick={() => setActiveFilter('RICARDO')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeFilter === 'RICARDO'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100'
          }`}
        >
          <span>Ricardo</span>
        </button>

        <button
          onClick={() => setActiveFilter('TROISFOISPARJOUR')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeFilter === 'TROISFOISPARJOUR'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
          }`}
        >
          <span>Marilou (3FPJ)</span>
        </button>

        <button
          onClick={() => setActiveFilter('JAMIE')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeFilter === 'JAMIE'
              ? 'bg-sky-700 text-white shadow-xs'
              : 'bg-sky-50 border border-sky-200 text-sky-800 hover:bg-sky-100'
          }`}
        >
          <span>Jamie Oliver</span>
        </button>

        <button
          onClick={() => setActiveFilter('FAST')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeFilter === 'FAST'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-[#D5E1D2] text-[#4E6751] hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>{lang === 'FR' ? 'Moins de 20 min' : 'Under 20 Mins'}</span>
        </button>

        {expiringItems.length > 0 && (
          <button
            onClick={() => setActiveFilter('EXPIRING')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              activeFilter === 'EXPIRING'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-[#D5E1D2] text-[#4E6751] hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>{lang === 'FR' ? 'Anti-Gaspillage' : 'Zero-Waste'}</span>
          </button>
        )}
      </ScrollableRow>

      {/* Notice Banner if any recipe saved or scheduled */}
      {addedItemsNotice && (
        <div className="p-3 bg-emerald-800 text-white rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg animate-fade-in border border-emerald-600/50">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="truncate">{addedItemsNotice}</span>
          </div>
          {onNavigateToMealPlanner && addedItemsNotice.includes('📅') && (
            <button
              onClick={onNavigateToMealPlanner}
              className="ml-2 px-2.5 py-1 bg-white text-emerald-900 rounded-xl text-[11px] font-black hover:bg-emerald-50 shrink-0 cursor-pointer shadow-xs transition-all active:scale-95"
            >
              {lang === 'FR' ? "Voir l'horaire" : 'View Schedule'}
            </button>
          )}
        </div>
      )}

      {/* Subheader with Count, Expand/Collapse Toggle & Context Hint */}
      <div className="flex items-center justify-between text-xs text-[#556D58] px-1">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-[#1E3022]">
            {filteredRecipes.length} {lang === 'FR' ? 'recettes' : 'recipes'}
          </span>
          <span className="text-[10px] text-[#69826C]">
            • {lang === 'FR' ? 'cliquez pour afficher' : 'click to expand'}
          </span>
        </div>

        {expandedRecipeId !== null && (
          <button
            onClick={() => setExpandedRecipeId(null)}
            className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 hover:underline cursor-pointer bg-white px-2 py-0.5 rounded-lg border border-[#D5E1D2]"
          >
            <ChevronUp className="w-3 h-3" />
            <span>{lang === 'FR' ? 'Tout réduire' : 'Minimise all'}</span>
          </button>
        )}
      </div>

      {/* Recipe Cards List */}
      <div className="space-y-3">
        {filteredRecipes.length === 0 ? (
          <div className="p-8 text-center text-[#69826C] bg-white rounded-3xl border border-[#D5E1D2] space-y-3">
            <ChefHat className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
            <p className="text-xs font-bold text-[#233527]">
              {lang === 'FR' ? 'Aucune recette trouvée' : 'No matching recipes found'}
            </p>
            <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'FR' ? 'Ajouter une recette' : 'Add a Recipe'}</span>
              </button>
              <a
                href={getSearchUrl(searchQuery || 'dinner', 'ricardo')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-700 text-white rounded-xl text-xs font-bold hover:bg-rose-800 transition-all shadow-xs"
              >
                <span>Ricardo</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={getSearchUrl(searchQuery || 'recettes', 'troisfoisparjour')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 transition-all shadow-xs"
              >
                <span>Marilou</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={getSearchUrl(searchQuery || 'recipes', 'jamieoliver')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-700 text-white rounded-xl text-xs font-bold hover:bg-sky-800 transition-all shadow-xs"
              >
                <span>Jamie</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ) : (
          filteredRecipes.map((recipe) => {
            const isExpanded = expandedRecipeId === recipe.id;
            const areStepsExpanded = expandedStepsRecipeId === recipe.id;
            const isVideoPlaying = playingVideoId === recipe.id;
            const ricardoLink = lang === 'FR' ? recipe.ricardoUrlFr : recipe.ricardoUrlEn;
            const title = lang === 'FR' ? recipe.titleFr : recipe.title;
            const desc = lang === 'FR' ? recipe.descriptionFr : recipe.descriptionEn;
            const instructions = lang === 'FR' ? recipe.instructionsFr : recipe.instructionsEn;
            const difficultyLabel = lang === 'FR' ? recipe.difficultyFr : recipe.difficulty;
            const isYoutube = Boolean(recipe.youtubeUrl || recipe.youtubeVideoId || recipe.source === 'YouTube');
            const isUserCustom = Boolean(recipe.isCustom);
            const isSaved = isRecipeSaved(recipe);

            // Compute available ingredients count
            const matchedIngredientsCount = recipe.ingredients.filter((ing) =>
              isIngredientInKitchen(ing.name, ing.inKitchenItemName)
            ).length;
            const totalIngredientsCount = recipe.ingredients.length;
            const matchPercentage = Math.round(
              (matchedIngredientsCount / totalIngredientsCount) * 100
            );

            // Detect or retrieve safe cooking rules (CFIA / MAPAQ & EFSA standards)
            const safeRule = recipe.safeCooking
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
                  color: 'amber',
                }
              : detectSafeCookingRule(recipe);

            // MINIMIZED / COMPACT RECIPE VIEW
            if (!isExpanded) {
              return (
                <div
                  key={recipe.id}
                  onClick={() => setExpandedRecipeId(recipe.id)}
                  className="p-2.5 sm:p-3 rounded-2xl bg-white border border-[#D5E1D2] hover:border-emerald-500 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  {/* Left: Thumbnail & Main Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Recipe Thumbnail */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative shadow-2xs">
                      <img
                        src={recipe.imageUrl}
                        alt={title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {recipe.authorBadge ? (
                        <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-black/75 text-[8px] font-black text-white leading-none shadow-2xs backdrop-blur-xs">
                          {recipe.authorBadge}
                        </span>
                      ) : recipe.isRicardoOfficial ? (
                        <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-rose-600/90 text-[8px] font-black text-white leading-none shadow-2xs">
                          RICARDO
                        </span>
                      ) : isYoutube ? (
                        <span className="absolute bottom-1 left-1 p-0.5 rounded bg-red-600 text-white shadow-2xs">
                          <Youtube className="w-2.5 h-2.5" />
                        </span>
                      ) : null}
                    </div>

                    {/* Text Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        {recipe.authorName ? (
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black border ${
                            recipe.source === 'Trois Fois Par Jour'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200/70'
                              : recipe.source === 'Jamie Oliver'
                              ? 'bg-sky-50 text-sky-800 border-sky-200/70'
                              : recipe.source === 'Marmiton'
                              ? 'bg-orange-50 text-orange-800 border-orange-200/70'
                              : recipe.isRicardoOfficial
                              ? 'bg-rose-50 text-rose-700 border-rose-200/70'
                              : 'bg-amber-50 text-amber-800 border-amber-200/70'
                          }`}>
                            {recipe.authorName.toUpperCase()}
                          </span>
                        ) : recipe.isRicardoOfficial ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/70 text-[9px] font-black">
                            RICARDO
                          </span>
                        ) : isYoutube ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200/70 text-[9px] font-black flex items-center gap-0.5">
                            <Youtube className="w-2.5 h-2.5" />
                            <span>YOUTUBE</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-[9px] font-black">
                            {lang === 'FR' ? 'MES RECETTES' : 'MY RECIPE'}
                          </span>
                        )}

                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          <span>
                            {matchPercentage}% {lang === 'FR' ? 'en stock' : 'in stock'}
                          </span>
                        </span>
                      </div>

                      <h3 className="font-extrabold text-xs sm:text-sm text-[#1F3323] truncate group-hover:text-emerald-900 transition-colors">
                        {title}
                      </h3>

                      <div className="flex items-center gap-2 text-[10px] text-[#556D58] mt-0.5 flex-wrap">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5 text-emerald-600" />
                          <span>{recipe.time}</span>
                        </span>
                        <span>•</span>
                        <span>{recipe.servings}</span>
                        {recipe.calories && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 text-amber-700">
                              <Flame className="w-2.5 h-2.5 text-amber-500" />
                              <span>{recipe.calories}</span>
                            </span>
                          </>
                        )}
                        {safeRule && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-0.5 font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              <Thermometer className="w-2.5 h-2.5 text-amber-600" />
                              <span>{safeRule.minTempC}°C ({safeRule.minTempF}°F)</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Save to My Recipes Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleSaveRecipe(recipe, e)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        isSaved
                          ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 shadow-2xs'
                          : 'bg-white border-[#D5E1D2] text-slate-400 hover:text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50'
                      }`}
                      title={
                        isSaved
                          ? lang === 'FR'
                            ? 'Dans Mes Recettes (Cliquer pour retirer)'
                            : 'In My Recipes (Click to remove)'
                          : lang === 'FR'
                          ? 'Sauvegarder dans Mes Recettes pour planifier'
                          : 'Save to My Recipes for meal planning'
                      }
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-500 text-amber-600' : ''}`} />
                    </button>

                    {/* Plan Meal Quick Button */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenPlanMeal(recipe, e)}
                      className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200/70 text-teal-800 text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 shadow-2xs cursor-pointer"
                      title={lang === 'FR' ? 'Planifier ce repas' : 'Meal plan this recipe'}
                    >
                      <Calendar className="w-3 h-3 text-teal-700" />
                      <span className="hidden sm:inline">{lang === 'FR' ? 'Planifier' : 'Plan'}</span>
                    </button>

                    {/* Expand chevron */}
                    <button
                      type="button"
                      onClick={() => setExpandedRecipeId(recipe.id)}
                      className="p-1 text-[#69826C] hover:text-[#1F3323] hover:bg-[#EEF4EC] rounded-lg transition-colors ml-0.5 cursor-pointer"
                      title={lang === 'FR' ? 'Afficher les détails de la recette' : 'Show recipe details'}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            }

            // EXPANDED DETAILED RECIPE VIEW (Matches screenshot)
            return (
              <div
                key={recipe.id}
                className="rounded-3xl bg-white border-2 border-emerald-600/80 shadow-md transition-all overflow-hidden animate-fade-in group"
              >
                {/* Embedded Video Player if active */}
                {isVideoPlaying && recipe.youtubeVideoId ? (
                  <div className="relative aspect-video w-full bg-black">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${recipe.youtubeVideoId}?autoplay=1`}
                      title={title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                    <button
                      onClick={() => setPlayingVideoId(null)}
                      className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/80 hover:bg-black text-white text-[10px] font-bold backdrop-blur-xs cursor-pointer"
                    >
                      ✕ Close Video
                    </button>
                  </div>
                ) : (
                  /* Recipe Image Banner (Hero) */
                  <div className="h-36 w-full relative overflow-hidden bg-slate-100">
                    <img
                      src={recipe.imageUrl}
                      alt={title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                    {/* Badges on image */}
                    <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {recipe.authorBadge ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-black/80 text-white text-[10px] font-black backdrop-blur-xs flex items-center gap-1 shadow-xs border border-white/20">
                            <span>{recipe.authorBadge}</span>
                          </span>
                        ) : recipe.authorName ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-700/90 text-white text-[10px] font-black backdrop-blur-xs flex items-center gap-1 shadow-xs">
                            <span>{recipe.authorName.toUpperCase()}</span>
                          </span>
                        ) : recipe.isRicardoOfficial ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-600/95 text-white text-[10px] font-black backdrop-blur-xs flex items-center gap-1 shadow-xs">
                            <span>RICARDO</span>
                          </span>
                        ) : isYoutube ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black backdrop-blur-xs flex items-center gap-1 shadow-xs">
                            <Youtube className="w-3 h-3" />
                            <span>YOUTUBE</span>
                          </span>
                        ) : recipe.source === 'Photo Import' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-black backdrop-blur-xs flex items-center gap-1 shadow-xs">
                            <Camera className="w-3 h-3" />
                            <span>PHOTO SCAN</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#18281B]/90 text-white text-[10px] font-black backdrop-blur-xs flex items-center gap-1 shadow-xs">
                            <FileText className="w-3 h-3" />
                            <span>MY RECIPE</span>
                          </span>
                        )}

                        {isUserCustom && (
                          <button
                            onClick={() => handleDeleteCustomRecipe(recipe.id, title)}
                            className="p-1 rounded-full bg-black/50 hover:bg-red-600 text-white transition-colors cursor-pointer"
                            title="Delete custom recipe"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600/95 text-white text-[10px] font-black backdrop-blur-xs flex items-center gap-1 shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          <span>
                            {matchPercentage}% {lang === 'FR' ? 'en stock' : 'in stock'}
                          </span>
                        </span>

                        {/* Quick minimize chevron button */}
                        <button
                          onClick={() => setExpandedRecipeId(null)}
                          className="p-1 rounded-full bg-black/60 hover:bg-black text-white transition-colors cursor-pointer"
                          title={lang === 'FR' ? 'Réduire la vue' : 'Minimise view'}
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Actions */}
                    <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-end justify-between text-white">
                      <div className="pr-2">
                        <h3 className="font-extrabold text-sm sm:text-base tracking-tight drop-shadow-md leading-snug">
                          {title}
                        </h3>
                        <span className="text-[10px] text-slate-200 font-medium">
                          {recipe.servings} • {recipe.time}
                        </span>
                      </div>

                      {/* Video Play or External Link */}
                      {isYoutube && recipe.youtubeVideoId ? (
                        <button
                          onClick={() => setPlayingVideoId(recipe.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[10px] font-black flex items-center gap-1 shadow-lg transition-all active:scale-95 shrink-0 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Play</span>
                        </button>
                      ) : ricardoLink ? (
                        <a
                          href={ricardoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-white/20 hover:bg-white text-white hover:text-red-900 backdrop-blur-xs transition-all shrink-0 active:scale-95 shadow-md flex items-center gap-1 text-[10px] font-extrabold"
                          title="Open recipe link"
                        >
                          <span>{recipe.isRicardoOfficial ? 'Ricardo' : 'Source'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Primary Action Bar: Save to My Recipes & Meal Plan */}
                <div className="p-3 bg-[#F4F8F3] border-b border-[#D5E1D2] flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Save to My Recipes button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleSaveRecipe(recipe, e)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 ${
                        isSaved
                          ? 'bg-amber-100/80 border-amber-300 text-amber-900 hover:bg-amber-200'
                          : 'bg-white border-[#D5E1D2] text-[#233527] hover:bg-emerald-50 hover:border-emerald-400'
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-600 text-amber-600' : 'text-slate-500'}`} />
                      <span>
                        {isSaved
                          ? lang === 'FR' ? '✓ Dans Mes Recettes' : '✓ In My Recipes'
                          : lang === 'FR' ? 'Sauvegarder dans Mes Recettes' : 'Save to My Recipes'}
                      </span>
                    </button>

                    {/* Plan Meal button */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenPlanMeal(recipe, e)}
                      className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white border border-teal-800 text-xs font-black flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-teal-200" />
                      <span>{lang === 'FR' ? '📅 Planifier ce repas' : '📅 Plan this Meal'}</span>
                    </button>
                  </div>

                  {/* Minimise button */}
                  <button
                    type="button"
                    onClick={() => setExpandedRecipeId(null)}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-[#D5E1D2] text-[#4E6751] text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>{lang === 'FR' ? 'Réduire' : 'Minimise'}</span>
                  </button>
                </div>

                {/* Content Area */}
                <div className="p-4 space-y-3">
                  <p className="text-xs text-[#5D7060] leading-relaxed">{desc}</p>

                  {/* Ingredients Checklist with In-Kitchen indicators */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#556D58]">
                      <span className="uppercase tracking-wider">
                        {lang === 'FR' ? 'INGRÉDIENTS REQUIS :' : 'INGREDIENTS NEEDED:'}
                      </span>
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 font-black">
                        {matchedIngredientsCount}/{totalIngredientsCount}{' '}
                        {lang === 'FR' ? 'dans votre cuisine' : 'in kitchen'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {recipe.ingredients.map((ing, i) => {
                        const inStock = isIngredientInKitchen(ing.name, ing.inKitchenItemName);
                        const ingDisplayName = lang === 'FR' && ing.nameFr ? ing.nameFr : ing.name;

                        return (
                          <div
                            key={i}
                            className={`p-2 rounded-xl border text-xs flex items-center justify-between transition-all ${
                              inStock
                                ? 'bg-[#F4F9F3] border-[#CDE1CB] text-[#1E3022]'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                                  inStock
                                    ? 'bg-emerald-600 text-white'
                                    : 'border border-slate-300 bg-slate-50'
                                }`}
                              >
                                {inStock ? (
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                ) : (
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                )}
                              </div>
                              <span className="font-bold truncate">{ingDisplayName}</span>
                              <span className="text-[10px] text-slate-400 font-normal shrink-0">
                                ({ing.amount})
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {inStock ? (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                                  {ing.locationType === 'FRIDGE' && <Refrigerator className="w-2.5 h-2.5" />}
                                  {ing.locationType === 'FREEZER' && <Snowflake className="w-2.5 h-2.5" />}
                                  {ing.locationType === 'PANTRY' && <Boxes className="w-2.5 h-2.5" />}
                                  {lang === 'FR' ? 'En stock' : 'Have it'}
                                </span>
                              ) : (
                                onAddMissingToGrocery && (
                                  <button
                                    onClick={() =>
                                      handleAddMissing(
                                        ing.name,
                                        ing.category,
                                        ing.locationType,
                                        title
                                      )
                                    }
                                    className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/70 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                                    title="Add missing ingredient to grocery shopping list"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>{lang === 'FR' ? '+ Épicerie' : '+ Grocery'}</span>
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recipe Telemetry (Prep time, Cook time, Calories, Difficulty) */}
                  <div className="pt-2 border-t border-[#EDF3EC] flex items-center justify-between text-xs text-[#6C826E]">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" /> {recipe.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-500" /> {recipe.calories}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#4D6750]">
                        {difficultyLabel}
                      </span>
                      <button
                        onClick={() =>
                          setExpandedStepsRecipeId(areStepsExpanded ? null : recipe.id)
                        }
                        className="p-1 text-[#556D58] hover:bg-[#EEF4EC] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span className="text-[10px] font-bold">
                          {areStepsExpanded
                            ? lang === 'FR'
                              ? 'Fermer'
                              : 'Close'
                            : lang === 'FR'
                            ? 'Étapes'
                            : 'Steps'}
                        </span>
                        {areStepsExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Step-by-Step Instructions */}
                  {areStepsExpanded && (
                    <div className="pt-3 border-t border-[#E1EDE0] space-y-3.5 bg-[#F9FCF8] -mx-4 -mb-4 p-4 animate-fade-in">
                      {/* SAFE COOKING INSTRUCTIONS BANNER (Health Canada / CFIA / MAPAQ & EFSA) */}
                      {safeRule && (
                        <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/60 to-amber-50 border-2 border-amber-300 shadow-2xs space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Thermometer className="w-4 h-4 stroke-[2.5]" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-black text-amber-950">
                                    {lang === 'FR' ? 'Consignes de cuisson sécuritaire' : 'Safe Cooking Instructions'}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded-md bg-amber-200/90 text-amber-900 text-[9px] font-black tracking-wide uppercase flex items-center gap-1">
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                    <span>{safeRule.standardOrg}</span>
                                  </span>
                                </div>
                                <p className="text-[11px] font-bold text-amber-900 mt-0.5">
                                  {lang === 'FR' ? safeRule.categoryFr : safeRule.category}
                                </p>
                              </div>
                            </div>

                            {/* Core Target Temperature Pill */}
                            <div className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 shadow-xs text-right shrink-0">
                              <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-800 block">
                                {lang === 'FR' ? 'Temp. Interne Min.' : 'Min. Core Temp'}
                              </span>
                              <span className="text-sm sm:text-base font-black text-amber-950">
                                {safeRule.minTempC}°C{' '}
                                <span className="text-xs font-semibold text-amber-700">({safeRule.minTempF}°F)</span>
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-amber-200/80">
                            {/* Key Safety Rule */}
                            <div className="flex items-start gap-1.5 text-amber-950">
                              <span className="font-black text-amber-700 shrink-0">✓</span>
                              <p className="leading-snug">
                                {lang === 'FR' ? safeRule.keySafetyNotesFr : safeRule.keySafetyNotesEn}
                              </p>
                            </div>

                            {/* Resting Time / Thermometer Guidance */}
                            <div className="flex items-start gap-1.5 text-amber-950">
                              <span className="font-black text-amber-700 shrink-0">⏳</span>
                              <p className="leading-snug">
                                <strong className="font-extrabold text-amber-900">
                                  {lang === 'FR' ? `Repos : ${safeRule.restTimeMinutes || 3} min. ` : `Rest: ${safeRule.restTimeMinutes || 3} min. `}
                                </strong>
                                {lang === 'FR' ? safeRule.restingTipFr : safeRule.restingTipEn}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#1E3022] flex items-center gap-1.5">
                          <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                          {lang === 'FR' ? 'Étapes de préparation :' : 'Cooking Instructions:'}
                        </span>
                        {recipe.youtubeUrl ? (
                          <a
                            href={recipe.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                          >
                            <Youtube className="w-3.5 h-3.5" />
                            <span>YouTube</span>
                          </a>
                        ) : ricardoLink ? (
                          <a
                            href={ricardoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-red-700 hover:text-red-800 hover:underline flex items-center gap-1"
                          >
                            <span>{lang === 'FR' ? 'Voir sur Ricardo' : 'View on Ricardo'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        {instructions.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs text-[#354C38]">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <p className="leading-relaxed flex-1">{step}</p>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        {recipe.youtubeUrl ? (
                          <a
                            href={recipe.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
                          >
                            <Youtube className="w-4 h-4" />
                            <span>
                              {lang === 'FR'
                                ? 'Regarder sur YouTube'
                                : 'Watch Original on YouTube'}
                            </span>
                          </a>
                        ) : ricardoLink ? (
                          <a
                            href={ricardoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-full py-2 px-3 rounded-xl text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 ${
                              recipe.source === 'Trois Fois Par Jour'
                                ? 'bg-emerald-700 hover:bg-emerald-800'
                                : recipe.source === 'Jamie Oliver'
                                ? 'bg-sky-700 hover:bg-sky-800'
                                : recipe.source === 'Marmiton'
                                ? 'bg-orange-600 hover:bg-orange-700'
                                : 'bg-red-700 hover:bg-red-800'
                            }`}
                          >
                            <span>
                              {lang === 'FR'
                                ? `Consulter sur ${recipe.authorName || recipe.source || 'le site officiel'}`
                                : `View on ${recipe.authorName || recipe.source || 'official website'}`}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Meal Plan Schedule Modal */}
      {planningRecipe && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#D5E1D2] max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[#192A1B] to-[#253D28] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">
                    {lang === 'FR' ? 'Planifier ce repas' : 'Schedule Meal'}
                  </h3>
                  <p className="text-[10px] text-emerald-200">
                    {lang === 'FR' ? 'Ajouter à votre horaire de repas' : 'Add to your meal planning calendar'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPlanningRecipe(null)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Recipe Summary Card */}
              <div className="p-2.5 rounded-2xl bg-[#F6F9F5] border border-[#D5E1D2] flex items-center gap-3">
                <img
                  src={planningRecipe.imageUrl}
                  alt={planningRecipe.title}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-2xs"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-xs text-[#1F3323] truncate">
                    {lang === 'FR' ? planningRecipe.titleFr || planningRecipe.title : planningRecipe.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-[#556D58] mt-0.5">
                    <span>{planningRecipe.servings}</span>
                    <span>•</span>
                    <span>{planningRecipe.time}</span>
                    {planningRecipe.calories && (
                      <>
                        <span>•</span>
                        <span>{planningRecipe.calories}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-1 text-[9px] font-bold text-emerald-800 flex items-center gap-1">
                    <Bookmark className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
                    <span>{lang === 'FR' ? 'Automatiquement enregistré dans vos recettes' : 'Automatically saved to your recipes'}</span>
                  </div>
                </div>
              </div>

              {/* Date Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-[#1F3323] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{lang === 'FR' ? 'Date du repas :' : 'Meal Date:'}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-[#D5E1D2] bg-slate-50 text-xs font-bold text-[#1F3323] focus:bg-white focus:outline-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setTargetDate(new Date().toISOString().split('T')[0])}
                    className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#233527] text-[10px] font-extrabold transition-all shrink-0 cursor-pointer"
                  >
                    {lang === 'FR' ? "Aujourd'hui" : 'Today'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setTargetDate(tomorrow.toISOString().split('T')[0]);
                    }}
                    className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#233527] text-[10px] font-extrabold transition-all shrink-0 cursor-pointer"
                  >
                    {lang === 'FR' ? 'Demain' : 'Tomorrow'}
                  </button>
                </div>
              </div>

              {/* Meal Slot Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-[#1F3323]">
                  {lang === 'FR' ? 'Moment du repas :' : 'Meal Slot:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(
                    [
                      { id: 'BREAKFAST' as MealType, en: 'Breakfast', fr: 'Déjeuner', icon: Coffee },
                      { id: 'LUNCH' as MealType, en: 'Lunch', fr: 'Dîner', icon: Sun },
                      { id: 'DINNER' as MealType, en: 'Dinner', fr: 'Souper', icon: Moon },
                      { id: 'SNACK' as MealType, en: 'Snack', fr: 'Collation', icon: Apple },
                    ] as const
                  ).map((slot) => {
                    const Icon = slot.icon;
                    const isSelected = targetMealSlot === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setTargetMealSlot(slot.id)}
                        className={`p-2 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs scale-102'
                            : 'bg-white border-[#D5E1D2] text-[#556D58] hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{lang === 'FR' ? slot.fr : slot.en}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Missing Ingredients Checkbox */}
              {onAddMissingToGrocery && (
                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="plan-auto-grocery"
                    checked={planAddMissingToGrocery}
                    onChange={(e) => setPlanAddMissingToGrocery(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-amber-700 focus:ring-amber-500 accent-amber-700 cursor-pointer"
                  />
                  <label htmlFor="plan-auto-grocery" className="text-xs text-amber-900 cursor-pointer leading-tight">
                    <span className="font-extrabold block">
                      {lang === 'FR' ? "Ajouter les ingrédients manquants à l'épicerie" : 'Add missing ingredients to grocery list'}
                    </span>
                    <span className="text-[10px] text-amber-800">
                      {lang === 'FR'
                        ? "Les items qui ne sont pas dans votre frigo/garde-manger seront placés dans votre panier d'achat."
                        : 'Any ingredients not currently in your kitchen will be added to your shopping cart.'}
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-[#D5E1D2] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPlanningRecipe(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                {lang === 'FR' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isPlanningLoading}
                onClick={handleConfirmMealPlan}
                className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {isPlanningLoading
                    ? lang === 'FR' ? 'Enregistrement...' : 'Scheduling...'
                    : lang === 'FR' ? 'Confirmer la planification' : 'Schedule Meal'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ricardo Cuisine Quick Search Callout */}
      <div className="p-4 rounded-3xl bg-white border border-[#D5E1D2] shadow-sm text-center space-y-2">
        <h4 className="text-xs font-black text-[#1E3022]">
          {lang === 'FR' ? 'Besoin de plus d\'inspiration culinaire ?' : 'Looking for even more inspiration?'}
        </h4>
        <p className="text-[11px] text-[#556D58] max-w-sm mx-auto">
          {lang === 'FR'
            ? 'Accédez à plus de 7 000 recettes testées en cuisine sur le site officiel de Ricardo.'
            : 'Access over 7,000 triple-tested recipes on the official Ricardo Cuisine website.'}
        </p>
        <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
          <a
            href={lang === 'FR' ? 'https://www.ricardocuisine.com/fr/recettes' : 'https://www.ricardocuisine.com/en/recipes'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#233527] hover:bg-black text-white rounded-xl text-xs font-black transition-all shadow-xs active:scale-95"
          >
            <span>{lang === 'FR' ? 'Explorer ricardocuisine.com' : 'Explore ricardocuisine.com'}</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
          </a>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all shadow-xs active:scale-95"
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>{lang === 'FR' ? '+ Recette YouTube / Perso' : '+ YouTube / Custom Recipe'}</span>
          </button>
        </div>
      </div>

      {/* Add Recipe Modal */}
      <AddRecipeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onRecipeSaved={handleSaveRecipe}
        lang={lang}
      />
    </div>
  );
};

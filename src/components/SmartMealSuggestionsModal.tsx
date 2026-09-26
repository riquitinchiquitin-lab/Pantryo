import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  X,
  ChefHat,
  Search,
  ExternalLink,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  ShoppingBag,
  Flame,
  Globe,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowRight,
  Languages,
  SlidersHorizontal,
  Compass,
  Trash2,
  Eye,
  Coffee,
  Sun,
  Moon,
  Apple,
  Layers,
} from 'lucide-react';
import { InventoryItem, MealType, SmartMealSuggestion, PlannedMealIngredient } from '../types';
import { RicardoRecipe, RICARDO_RECIPES, inferRecipeMealTypes } from '../data/ricardoRecipes';
import { useLanguage } from '../utils/i18n';
import {
  RecipeWebsiteSource,
  getStoredRecipeWebsites,
  saveStoredRecipeWebsites,
} from '../data/recipeWebsites';

interface SmartMealSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  currentDate: string;
  initialMealType?: MealType;
  onPlanMeal: (params: {
    title: string;
    mealType: MealType;
    date: string;
    prepTimeMinutes: number;
    servings: number;
    imageUrl?: string;
    notes?: string;
    recipeUrl?: string;
    ingredients: PlannedMealIngredient[];
    addMissingToGrocery: boolean;
  }) => Promise<void> | void;
}

const LOCAL_STORAGE_CUSTOM_RECIPES = 'kitchen_komrade_custom_recipes';

export const SmartMealSuggestionsModal: React.FC<SmartMealSuggestionsModalProps> = ({
  isOpen,
  onClose,
  inventory,
  currentDate,
  initialMealType = 'DINNER',
  onPlanMeal,
}) => {
  const { lang } = useLanguage();

  const [selectedMealType, setSelectedMealType] = useState<MealType>(initialMealType);
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'WEB' | 'MY_RECIPES' | 'HIGH_MATCH'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  // Stored Recipe Websites (for grounded web search recommendations)
  const [storedWebsites, setStoredWebsites] = useState<RecipeWebsiteSource[]>([]);
  const [showWebsitesPanel, setShowWebsitesPanel] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteUrl, setNewSiteUrl] = useState('');
  const [isInspectingWebsite, setIsInspectingWebsite] = useState(false);
  const [inspectedWebsite, setInspectedWebsite] = useState<RecipeWebsiteSource | null>(null);
  const [inspectionStatusMessage, setInspectionStatusMessage] = useState<string | null>(null);

  // Suggestions state
  const [webSuggestions, setWebSuggestions] = useState<SmartMealSuggestion[]>([]);
  const [userRecipeMatches, setUserRecipeMatches] = useState<SmartMealSuggestion[]>([]);
  const [allSuggestions, setAllSuggestions] = useState<SmartMealSuggestion[]>([]);

  // Compact UI view states for search & expiring details
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showExpiringDetails, setShowExpiringDetails] = useState(false);

  // Translating state per card
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  // Track which recipe is being added
  const [planningRecipeId, setPlanningRecipeId] = useState<string | null>(null);
  // Track missing items to add to grocery
  const [addMissingToCart, setAddMissingToCart] = useState(true);

  // Load recipe websites on open
  useEffect(() => {
    if (isOpen) {
      setStoredWebsites(getStoredRecipeWebsites());
    }
  }, [isOpen]);

  // Expiring items from inventory
  const expiringItems = useMemo(() => {
    return inventory.filter(
      (i) => i.isExpiringSoon || (i.daysUntilExpiration !== null && i.daysUntilExpiration !== undefined && i.daysUntilExpiration <= 4)
    );
  }, [inventory]);

  // Load custom user recipes from localStorage & built-in recipes
  const localRecipes = useMemo(() => {
    let saved: RicardoRecipe[] = [];
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_CUSTOM_RECIPES);
      if (raw) saved = JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse localStorage custom recipes', e);
    }
    return [...saved, ...RICARDO_RECIPES];
  }, []);

  // Fetch suggestions from backend API
  const fetchSmartSuggestions = async (
    customQuery?: string,
    overrideMealType?: MealType,
    overrideDate?: string
  ) => {
    const activeMealType = overrideMealType || selectedMealType;
    const activeDate = overrideDate || selectedDate;
    const activeQuery = customQuery !== undefined ? customQuery : searchQuery;

    setIsLoading(true);
    setErrorMessage(null);

    const activeSites = storedWebsites.filter((s) => s.enabled).map((s) => s.domain || s.url);

    try {
      const response = await fetch('/api/v1/recipes/smart-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventory: inventory.map((i) => ({
            name: i.name,
            category: i.category || i.categoryName,
            daysUntilExpiration: i.daysUntilExpiration,
            isExpiringSoon: i.isExpiringSoon,
            quantity: i.quantity,
            unit: i.unit,
            location: i.locationType,
          })),
          userRecipes: localRecipes.map((r) => ({
            id: r.id,
            title: r.title,
            titleFr: r.titleFr,
            source: r.source,
            imageUrl: r.imageUrl,
            prepTime: r.prepTime,
            cookTime: r.cookTime,
            time: r.time,
            servings: r.servings,
            difficulty: r.difficulty,
            difficultyFr: r.difficultyFr,
            ingredients: r.ingredients,
            instructionsEn: r.instructionsEn,
            instructionsFr: r.instructionsFr,
            ricardoUrlEn: r.ricardoUrlEn,
            tags: r.tags,
            mealTypes: r.mealTypes,
          })),
          targetDate: activeDate,
          targetMealType: activeMealType,
          language: lang,
          preferredWebsites: activeSites,
          query: activeQuery,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setWebSuggestions(data.webSuggestions || []);
        setUserRecipeMatches(data.userRecipeMatches || []);
        setAllSuggestions(data.allSuggestions || []);
      } else {
        throw new Error(data.error || 'Failed to load suggestions');
      }
    } catch (err: any) {
      console.warn('Failed to fetch from API, falling back to local zero-waste calculations:', err);
      // Fallback local calculations
      generateLocalZeroWasteSuggestions(activeMealType);
    } finally {
      setIsLoading(false);
    }
  };

  // Local calculation fallback with meal slot awareness
  const generateLocalZeroWasteSuggestions = (targetSlot: MealType = selectedMealType) => {
    // Filter recipes suited for targetSlot first
    const suitableLocal = localRecipes.filter((r) => {
      const types = r.mealTypes || inferRecipeMealTypes(r);
      return types.includes(targetSlot);
    });

    const candidates = suitableLocal.length > 0 ? suitableLocal : localRecipes;

    const scoredUserRecipes: SmartMealSuggestion[] = candidates.map((recipe) => {
      let matchCount = 0;
      const rescued: string[] = [];
      const detailedIngredients = (recipe.ingredients || []).map((ri) => {
        const matchingInvItem = inventory.find((inv) =>
          inv.name.toLowerCase().includes(ri.name.toLowerCase()) ||
          ri.name.toLowerCase().includes(inv.name.toLowerCase()) ||
          (ri.nameFr && inv.name.toLowerCase().includes(ri.nameFr.toLowerCase()))
        );

        const inStock = !!matchingInvItem;
        if (inStock) {
          matchCount++;
          if (
            matchingInvItem.isExpiringSoon ||
            (matchingInvItem.daysUntilExpiration !== null &&
              matchingInvItem.daysUntilExpiration !== undefined &&
              matchingInvItem.daysUntilExpiration <= 4)
          ) {
            rescued.push(matchingInvItem.name);
          }
        }

        return {
          name: ri.name,
          nameFr: ri.nameFr,
          amount: ri.amount,
          inStock,
        };
      });

      const totalIngredients = detailedIngredients.length || 1;
      const matchPercentage = Math.round((matchCount / totalIngredients) * 100);
      const inStockCount = detailedIngredients.filter((i) => i.inStock).length;

      const zeroWasteReason =
        rescued.length > 0
          ? lang === 'FR'
            ? `Sauve ${rescued.slice(0, 2).join(' et ')} qui expirent bientôt !`
            : `Rescues ${rescued.slice(0, 2).join(' and ')} before expiration!`
          : lang === 'FR'
          ? `Utilise ${inStockCount} ingrédient(s) déjà dans votre cuisine.`
          : `Uses ${inStockCount} ingredient(s) already in your kitchen.`;

      const mealTypes = recipe.mealTypes || inferRecipeMealTypes(recipe);

      return {
        id: recipe.id,
        title: recipe.title,
        titleFr: recipe.titleFr,
        source: recipe.source || 'My Recipe',
        sourceUrl: recipe.ricardoUrlEn || recipe.youtubeUrl || '',
        imageUrl: recipe.imageUrl,
        prepTime: recipe.prepTime || '15 mins',
        cookTime: recipe.cookTime || '20 mins',
        totalTime: recipe.time || '35 mins',
        servings: recipe.servings || '4 servings',
        difficulty: recipe.difficulty || 'Easy',
        difficultyFr: recipe.difficultyFr || 'Facile',
        zeroWasteReason,
        rescuedIngredients: rescued,
        matchPercentage,
        ingredients: detailedIngredients,
        instructionsEn: recipe.instructionsEn || [],
        instructionsFr: recipe.instructionsFr || [],
        tags: recipe.tags || ['Anti-Gaspillage'],
        mealType: targetSlot,
        suitableMealTypes: mealTypes,
        isFromMyRecipes: true,
      };
    });

    scoredUserRecipes.sort((a, b) => {
      if (b.rescuedIngredients.length !== a.rescuedIngredients.length) {
        return b.rescuedIngredients.length - a.rescuedIngredients.length;
      }
      return b.matchPercentage - a.matchPercentage;
    });

    setUserRecipeMatches(scoredUserRecipes);
    setAllSuggestions(scoredUserRecipes);
  };

  // Trigger suggestions on initial open
  useEffect(() => {
    if (isOpen) {
      const initialSlot = (initialMealType || 'DINNER') as MealType;
      setSelectedMealType(initialSlot);
      setSelectedDate(currentDate);
      fetchSmartSuggestions(undefined, initialSlot, currentDate);
    }
  }, [isOpen, initialMealType, currentDate]);

  // Website management handlers
  const handleToggleWebsite = (id: string) => {
    const updated = storedWebsites.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    setStoredWebsites(updated);
    saveStoredRecipeWebsites(updated);
  };

  const handleDeleteCustomWebsite = (id: string) => {
    const updated = storedWebsites.filter((s) => s.id !== id);
    setStoredWebsites(updated);
    saveStoredRecipeWebsites(updated);
  };

  // Inspect and extract recipes directly from a specific culinary website
  const lookIntoWebsite = async (site: RecipeWebsiteSource) => {
    setIsInspectingWebsite(true);
    setInspectedWebsite(site);
    setInspectionStatusMessage(
      lang === 'FR'
        ? `Exploration en direct du contenu de ${site.name}...`
        : `Looking through content on ${site.name}...`
    );
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/recipes/look-into-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: site.url,
          domain: site.domain,
          query: searchQuery || '',
          targetMealType: selectedMealType,
          inventory: inventory.map((i) => ({
            name: i.name,
            category: i.category || i.categoryName,
            daysUntilExpiration: i.daysUntilExpiration,
            isExpiringSoon: i.isExpiringSoon,
          })),
          language: lang,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.recipes) && data.recipes.length > 0) {
        setWebSuggestions(data.recipes);
        setAllSuggestions([...data.recipes, ...userRecipeMatches]);
        setActiveTab('WEB');
        setInspectionStatusMessage(
          lang === 'FR'
            ? `✅ ${data.recipes.length} recettes extraites directement du contenu de ${site.name} !`
            : `✅ ${data.recipes.length} recipes extracted directly from ${site.name}!`
        );
      } else {
        setInspectionStatusMessage(
          lang === 'FR'
            ? `Aucune recette directe trouvée sur ${site.name}. Recherche générale activée.`
            : `No direct recipes found on ${site.name}. Standard search enabled.`
        );
      }
    } catch (err: any) {
      console.error('Failed to look into website:', err);
      setInspectionStatusMessage(
        lang === 'FR'
          ? `Erreur lors de l’analyse du site ${site.name}.`
          : `Error inspecting ${site.name}.`
      );
    } finally {
      setIsInspectingWebsite(false);
    }
  };

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName.trim() || !newSiteUrl.trim()) return;

    let cleanUrl = newSiteUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    let domain = cleanUrl;
    try {
      domain = new URL(cleanUrl).hostname.replace(/^www\./, '');
    } catch {
      // keep fallback
    }

    const newSite: RecipeWebsiteSource = {
      id: `custom_${Date.now()}`,
      name: newSiteName.trim(),
      url: cleanUrl,
      domain,
      language: lang === 'FR' ? 'FR' : 'BOTH',
      enabled: true,
      description: 'Custom recipe website added by user.',
      descriptionFr: 'Site de recettes personnalisé ajouté par l’utilisateur.',
    };

    const updated = [newSite, ...storedWebsites];
    setStoredWebsites(updated);
    saveStoredRecipeWebsites(updated);
    setNewSiteName('');
    setNewSiteUrl('');

    // Immediately look through the newly added website's content!
    await lookIntoWebsite(newSite);
  };

  // Instant Translate card handler
  const handleTranslateCard = async (recipe: SmartMealSuggestion) => {
    setTranslatingId(recipe.id);
    const targetLang = lang === 'FR' ? 'FR' : 'EN';

    try {
      const res = await fetch('/api/v1/recipes/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe: {
            id: recipe.id,
            title: recipe.title,
            titleFr: recipe.titleFr,
            descriptionEn: recipe.zeroWasteReason,
            descriptionFr: recipe.zeroWasteReason,
            ingredients: recipe.ingredients.map((i) => ({
              name: i.name,
              nameFr: i.nameFr,
              amount: i.amount || '1',
            })),
            instructionsEn: recipe.instructionsEn || [],
            instructionsFr: recipe.instructionsFr || [],
          },
          targetLanguage: targetLang,
        }),
      });

      const data = await res.json();
      if (data.success && data.recipe) {
        const updated = (list: SmartMealSuggestion[]) =>
          list.map((item) => {
            if (item.id === recipe.id) {
              return {
                ...item,
                title: targetLang === 'EN' ? data.recipe.title : item.title,
                titleFr: targetLang === 'FR' ? data.recipe.titleFr || data.recipe.title : item.titleFr,
                zeroWasteReason:
                  targetLang === 'FR'
                    ? data.recipe.descriptionFr || item.zeroWasteReason
                    : data.recipe.descriptionEn || item.zeroWasteReason,
                instructionsEn: data.recipe.instructionsEn || item.instructionsEn,
                instructionsFr: data.recipe.instructionsFr || item.instructionsFr,
              };
            }
            return item;
          });

        setAllSuggestions((prev) => updated(prev));
        setWebSuggestions((prev) => updated(prev));
        setUserRecipeMatches((prev) => updated(prev));
      }
    } catch (err) {
      console.warn('Translate suggestion card error:', err);
    } finally {
      setTranslatingId(null);
    }
  };

  // Filter suggestions according to active tab
  const filteredSuggestions = useMemo(() => {
    let list: SmartMealSuggestion[] = [];

    if (activeTab === 'ALL') {
      list = allSuggestions;
    } else if (activeTab === 'WEB') {
      list = webSuggestions.length > 0 ? webSuggestions : allSuggestions.filter((s) => s.isWebSearch);
    } else if (activeTab === 'MY_RECIPES') {
      list = userRecipeMatches.length > 0 ? userRecipeMatches : allSuggestions.filter((s) => s.isFromMyRecipes);
    } else if (activeTab === 'HIGH_MATCH') {
      list = allSuggestions.filter((s) => s.matchPercentage >= 80);
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.titleFr && s.titleFr.toLowerCase().includes(q)) ||
        s.zeroWasteReason.toLowerCase().includes(q) ||
        s.ingredients.some((ing) => ing.name.toLowerCase().includes(q) || (ing.nameFr && ing.nameFr.toLowerCase().includes(q)))
    );
  }, [activeTab, allSuggestions, webSuggestions, userRecipeMatches, searchQuery]);

  const handleSelectAndPlan = async (recipe: SmartMealSuggestion) => {
    setPlanningRecipeId(recipe.id);
    try {
      const parsedPrepMinutes = parseInt(recipe.prepTime || '25', 10) || 25;
      const parsedServings = parseInt(recipe.servings || '4', 10) || 4;

      const plannedIngredients: PlannedMealIngredient[] = recipe.ingredients.map((ing) => ({
        name: `${lang === 'FR' && ing.nameFr ? ing.nameFr : ing.name}${ing.amount ? ` (${ing.amount})` : ''}`,
        inStock: ing.inStock,
      }));

      await onPlanMeal({
        title: lang === 'FR' && recipe.titleFr ? recipe.titleFr : recipe.title,
        mealType: selectedMealType,
        date: selectedDate,
        prepTimeMinutes: parsedPrepMinutes,
        servings: parsedServings,
        imageUrl: recipe.imageUrl,
        notes: recipe.zeroWasteReason,
        recipeUrl: recipe.sourceUrl,
        ingredients: plannedIngredients,
        addMissingToGrocery: addMissingToCart,
      });

      onClose();
    } catch (err) {
      console.error('Failed to plan meal:', err);
      setErrorMessage(lang === 'FR' ? 'Erreur lors de la planification du repas' : 'Failed to schedule meal');
    } finally {
      setPlanningRecipeId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="smart-meal-suggestions-modal"
      className="fixed inset-0 z-50 bg-[#FAF7EE] flex flex-col w-full h-full overflow-hidden text-[#133E3B] animate-fade-in"
    >
      {/* Top Header Bar (Ultra-compact with Safe Area support) */}
      <header className="px-3 py-2 sm:px-5 sm:py-2.5 pt-[max(0.5rem,env(safe-area-inset-top,0px))] border-b border-[#E5DFD0] bg-white flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-4 h-4 text-teal-700" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xs sm:text-base font-black tracking-tight text-[#0D3B37] truncate leading-tight">
                {lang === 'FR' ? 'Suggestions de Repas' : 'Smart Meal Suggestions'}
              </h2>
              {expiringItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowExpiringDetails(!showExpiringDetails)}
                  className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded-md border border-amber-200 font-bold cursor-pointer transition-colors"
                  title={lang === 'FR' ? 'Voir les aliments à consommer en priorité' : 'View priority rescue items'}
                >
                  <Flame className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>
                    {expiringItems.length} {lang === 'FR' ? 'à sauver' : 'to rescue'}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-amber-600 transition-transform ${showExpiringDetails ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dedicated Fullscreen Exit Button */}
        <button
          id="btn-exit-smart-suggestions"
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-full bg-[#EFEAE0] hover:bg-[#E2DBCB] text-[#133E3B] font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shrink-0 border border-[#D5CDBC] shadow-2xs"
          title={lang === 'FR' ? 'Quitter' : 'Exit'}
        >
          <X className="w-3.5 h-3.5" />
          <span>{lang === 'FR' ? 'Quitter' : 'Exit'}</span>
        </button>
      </header>

      {/* Expandable Expiring Items Drawer */}
      {showExpiringDetails && expiringItems.length > 0 && (
        <div className="px-3.5 py-1.5 bg-amber-50 border-b border-amber-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs animate-fade-in">
          <div className="flex items-center gap-1 shrink-0 text-amber-950 font-bold text-[11px]">
            <Flame className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{lang === 'FR' ? 'À consommer en priorité :' : 'Priority to rescue:'}</span>
          </div>
          {expiringItems.map((item) => (
            <span
              key={item.id}
              className="px-2 py-0.5 rounded-lg bg-white border border-amber-200 text-[10px] font-semibold text-amber-900 shrink-0 flex items-center gap-1 shadow-2xs"
            >
              <span>{item.name}</span>
              <span className="text-amber-600 font-bold">
                ({item.daysUntilExpiration !== null && item.daysUntilExpiration !== undefined && item.daysUntilExpiration <= 0 ? (lang === 'FR' ? 'Expiré' : 'Exp.') : `${item.daysUntilExpiration}j`})
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Streamlined Planning Controls Sub-Header */}
      <div className="px-3 py-2 sm:px-5 sm:py-2.5 bg-[#F8F5EC] border-b border-[#E5DFD0] space-y-2 shrink-0">
        {/* Row 1: Target Meal Slot & Date & Grocery Toggle */}
        <div className="flex items-center justify-between gap-1 overflow-x-hidden sm:overflow-x-auto no-scrollbar">
          {/* Target Meal Slot Selector */}
          <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-[#D5CDBC] shadow-2xs shrink-0">
            {(
              [
                { type: 'BREAKFAST', label: lang === 'FR' ? 'Déjeuner' : 'Breakfast', icon: Coffee },
                { type: 'LUNCH', label: lang === 'FR' ? 'Dîner' : 'Lunch', icon: Sun },
                { type: 'DINNER', label: lang === 'FR' ? 'Souper' : 'Dinner', icon: Moon },
                { type: 'SNACK', label: lang === 'FR' ? 'Collation' : 'Snack', icon: Apple },
              ] as const
            ).map((slot) => {
              const IconComponent = slot.icon;
              return (
                <button
                  key={slot.type}
                  id={`btn-slot-${slot.type.toLowerCase()}`}
                  type="button"
                  title={slot.label}
                  aria-label={slot.label}
                  onClick={() => {
                    setSelectedMealType(slot.type);
                    fetchSmartSuggestions(undefined, slot.type);
                  }}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    selectedMealType === slot.type
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'text-[#527470] hover:text-[#0D3B37] hover:bg-[#F3EFE6]'
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">{slot.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Controls: Date Picker & Missing Ingredients Auto-Add */}
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {/* Target Date Picker (compact on mobile) */}
            <div className="relative flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-[#D5CDBC] shadow-2xs text-xs font-semibold text-[#0D3B37]">
              <Calendar className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span className="text-[11px] font-bold text-[#0D3B37] sm:hidden">
                {selectedDate ? selectedDate.slice(5) : ''}
              </span>
              <input
                id="input-suggestion-target-date"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setSelectedDate(newDate);
                  fetchSmartSuggestions(undefined, undefined, newDate);
                }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer sm:static sm:opacity-100 sm:w-auto bg-transparent font-bold text-[11px] sm:text-xs text-[#0D3B37] outline-hidden"
              />
            </div>

            {/* Missing Ingredients Auto-Add Toggle */}
            <button
              id="checkbox-add-missing-to-grocery"
              type="button"
              onClick={() => setAddMissingToCart(!addMissingToCart)}
              className={`p-1 sm:px-2 sm:py-1 rounded-xl border text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all shadow-2xs shrink-0 cursor-pointer ${
                addMissingToCart
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-white border-[#D5CDBC] text-[#527470] hover:bg-[#F3EFE6]'
              }`}
              title={lang === 'FR' ? 'Ajouter les manquants à l’épicerie lors de la planification' : 'Add missing ingredients to grocery list'}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="hidden sm:inline">{lang === 'FR' ? 'Épicerie' : 'Grocery'}</span>
              <Check className={`w-3 h-3 ${addMissingToCart ? 'text-amber-700' : 'text-slate-300'}`} />
            </button>
          </div>
        </div>

        {/* Row 2: Category Tabs (Left) + Search Toggle & Quick Actions (Right) */}
        <div className="flex items-center justify-between gap-1 overflow-x-hidden sm:overflow-x-auto no-scrollbar">
          {/* Categorized Filter Tabs with Mobile Icons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              id="tab-all-suggestions"
              type="button"
              title={lang === 'FR' ? `Tous (${allSuggestions.length})` : `All (${allSuggestions.length})`}
              onClick={() => setActiveTab('ALL')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all shrink-0 flex items-center gap-1 border cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-teal-700 text-white border-teal-800 shadow-2xs'
                  : 'bg-white text-[#527470] border-[#D5CDBC] hover:bg-[#EFEAE0]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{lang === 'FR' ? 'Tous' : 'All'}</span>
              <span className="text-[10px] font-mono">({allSuggestions.length})</span>
            </button>

            <button
              id="tab-web-suggestions"
              type="button"
              title={lang === 'FR' ? `Web (${webSuggestions.length})` : `Web (${webSuggestions.length})`}
              onClick={() => setActiveTab('WEB')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all shrink-0 flex items-center gap-1 border cursor-pointer ${
                activeTab === 'WEB'
                  ? 'bg-teal-700 text-white border-teal-800 shadow-2xs'
                  : 'bg-white text-[#527470] border-[#D5CDBC] hover:bg-[#EFEAE0]'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="hidden sm:inline">Web</span>
              <span className="text-[10px] font-mono">({webSuggestions.length})</span>
            </button>

            <button
              id="tab-my-recipes-suggestions"
              type="button"
              title={lang === 'FR' ? `Mes Recettes (${userRecipeMatches.length})` : `Recipes (${userRecipeMatches.length})`}
              onClick={() => setActiveTab('MY_RECIPES')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all shrink-0 flex items-center gap-1 border cursor-pointer ${
                activeTab === 'MY_RECIPES'
                  ? 'bg-teal-700 text-white border-teal-800 shadow-2xs'
                  : 'bg-white text-[#527470] border-[#D5CDBC] hover:bg-[#EFEAE0]'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden sm:inline">{lang === 'FR' ? 'Recettes' : 'Recipes'}</span>
              <span className="text-[10px] font-mono">({userRecipeMatches.length})</span>
            </button>

            <button
              id="tab-high-match-suggestions"
              type="button"
              title={lang === 'FR' ? 'Match Élevé (≥80%)' : 'High Match (≥80%)'}
              onClick={() => setActiveTab('HIGH_MATCH')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all shrink-0 flex items-center gap-1 border cursor-pointer ${
                activeTab === 'HIGH_MATCH'
                  ? 'bg-teal-700 text-white border-teal-800 shadow-2xs'
                  : 'bg-white text-[#527470] border-[#D5CDBC] hover:bg-[#EFEAE0]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline">≥80%</span>
            </button>
          </div>

          {/* Quick Action Buttons: Search Toggle, Websites Sources, Refresh */}
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {/* Search Input Toggle */}
            <button
              id="btn-toggle-search-input"
              type="button"
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              className={`p-1 sm:px-2 sm:py-1 rounded-lg border text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer ${
                isSearchExpanded || searchQuery
                  ? 'bg-teal-700 text-white border-teal-800'
                  : 'bg-white text-[#133E3B] border-[#D5CDBC] hover:bg-[#EFEAE0]'
              }`}
              title={lang === 'FR' ? 'Rechercher / Préciser' : 'Search / Refine'}
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{lang === 'FR' ? 'Rechercher' : 'Search'}</span>
            </button>

            {/* Websites Selection Toggle */}
            <button
              id="btn-toggle-websites-panel"
              type="button"
              onClick={() => setShowWebsitesPanel(!showWebsitesPanel)}
              className={`p-1 sm:px-2 sm:py-1 rounded-lg border text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer ${
                showWebsitesPanel
                  ? 'bg-teal-700 text-white border-teal-800'
                  : 'bg-white text-[#133E3B] border-[#D5CDBC] hover:bg-[#EFEAE0]'
              }`}
              title={lang === 'FR' ? 'Sources de recettes Web' : 'Web recipe sources'}
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="text-[10px] px-1 rounded-full bg-black/10 font-mono">
                {storedWebsites.filter((s) => s.enabled).length}
              </span>
            </button>

            {/* Refresh */}
            <button
              id="btn-refresh-suggestions"
              type="button"
              onClick={() => fetchSmartSuggestions()}
              disabled={isLoading}
              className="p-1 rounded-lg bg-white hover:bg-[#EFEAE0] border border-[#D5CDBC] text-[#133E3B] transition-colors shadow-2xs shrink-0 disabled:opacity-60 cursor-pointer"
              title={lang === 'FR' ? 'Actualiser les suggestions' : 'Refresh suggestions'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-700' : ''}`} />
            </button>
          </div>
        </div>

        {/* Row 3 (Collapsible): Search & Grounded Web Query */}
        {(isSearchExpanded || searchQuery.trim().length > 0) && (
          <div className="flex items-center gap-1.5 pt-1 animate-fade-in">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-suggestion-query"
                type="text"
                autoFocus
                placeholder={
                  lang === 'FR'
                    ? 'Préciser (ex. Pâtes, Végétarien, Rapide...)'
                    : 'Search or refine (e.g. Pasta, High-protein, Quick...)'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchSmartSuggestions(searchQuery);
                  }
                }}
                className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-white border border-[#D5CDBC] text-xs font-medium placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    fetchSmartSuggestions('');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              id="btn-search-web-suggestions"
              type="button"
              onClick={() => fetchSmartSuggestions(searchQuery)}
              disabled={isLoading}
              className="px-2.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-2xs shrink-0 disabled:opacity-60 active:scale-95 cursor-pointer"
            >
              <Globe className="w-3 h-3" />
              <span>{lang === 'FR' ? 'Chercher Web' : 'Search Web'}</span>
            </button>
          </div>
        )}

        {/* Expandable Recipe Websites Selection & Custom Website Addition */}
        {showWebsitesPanel && (
          <div className="p-3.5 bg-white border border-[#D5CDBC] rounded-2xl space-y-3 shadow-sm animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-teal-700" />
                <h4 className="text-xs font-black text-[#0D3B37]">
                  {lang === 'FR' ? 'Sources Web Utilisées par l’IA' : 'Recipe Websites Used by AI'}
                </h4>
              </div>
              <span className="text-[10px] text-[#527470]">
                {lang === 'FR' ? 'Cochez/décochez les sites de votre choix' : 'Toggle your preferred culinary sources'}
              </span>
            </div>

            {/* Active pills */}
            <div className="flex flex-wrap gap-1.5">
              {storedWebsites.map((site) => (
                <div
                  key={site.id}
                  className={`px-2 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border transition-all ${
                    site.enabled
                      ? 'bg-teal-50 border-teal-300 text-teal-900'
                      : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleWebsite(site.id)}
                    className="flex items-center gap-1.5"
                    title={site.enabled ? (lang === 'FR' ? 'Désactiver' : 'Disable') : (lang === 'FR' ? 'Activer' : 'Enable')}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${site.enabled ? 'bg-teal-600' : 'bg-slate-300'}`} />
                    <span>{site.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      lookIntoWebsite(site);
                    }}
                    title={lang === 'FR' ? `Explorer le contenu de ${site.name}` : `Look through ${site.name} content`}
                    className="p-1 rounded-md bg-white hover:bg-teal-100 text-teal-700 hover:text-teal-900 transition-colors shadow-2xs"
                  >
                    <Eye className="w-2.5 h-2.5" />
                  </button>
                  {site.id.startsWith('custom_') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomWebsite(site.id);
                      }}
                      className="text-rose-500 hover:text-rose-700 p-0.5"
                      title={lang === 'FR' ? 'Supprimer' : 'Delete'}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Custom Website Form */}
            <form onSubmit={handleAddWebsite} className="pt-2 border-t border-[#E5DFD0] flex flex-wrap gap-2 items-center">
              <span className="text-[11px] font-bold text-[#0D3B37] shrink-0">
                {lang === 'FR' ? 'Ajouter un site :' : 'Add a site:'}
              </span>
              <input
                type="text"
                value={newSiteName}
                onChange={(e) => setNewSiteName(e.target.value)}
                placeholder={lang === 'FR' ? 'Nom (ex: Marmiton)' : 'Name (e.g. Serious Eats)'}
                className="p-1.5 px-2.5 bg-[#FAF7EE] border border-[#D5CDBC] rounded-xl text-xs flex-1 min-w-[120px]"
                required
              />
              <input
                type="text"
                value={newSiteUrl}
                onChange={(e) => setNewSiteUrl(e.target.value)}
                placeholder="https://marmiton.org"
                className="p-1.5 px-2.5 bg-[#FAF7EE] border border-[#D5CDBC] rounded-xl text-xs flex-1 min-w-[150px]"
                required
              />
              <button
                type="submit"
                disabled={isInspectingWebsite}
                className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1 shadow-2xs disabled:opacity-60"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'FR' ? 'Ajouter & Explorer' : 'Add & Look Into'}</span>
              </button>
              <button
                type="button"
                onClick={() => fetchSmartSuggestions()}
                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1 shadow-2xs ml-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{lang === 'FR' ? 'Relancer la recherche' : 'Apply & Search'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Live Website Content Inspection Banner */}
        {inspectedWebsite && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-2xs animate-fade-in">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-700 text-white">
                <Compass className={`w-4 h-4 ${isInspectingWebsite ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                  <span>{lang === 'FR' ? 'Contenu exploré sur :' : 'Content Inspected on:'}</span>
                  <span className="underline decoration-emerald-500 font-mono text-[11px]">{inspectedWebsite.name}</span>
                  <span className="text-[10px] text-emerald-600 font-normal">({inspectedWebsite.domain})</span>
                </span>
                <p className="text-[11px] font-medium text-emerald-800">
                  {inspectionStatusMessage || (lang === 'FR' ? 'Recettes extraites en direct' : 'Live extracted recipes')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setInspectedWebsite(null);
                setInspectionStatusMessage(null);
                fetchSmartSuggestions();
              }}
              className="px-3 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 text-xs font-bold transition-all shadow-2xs ml-auto"
            >
              {lang === 'FR' ? 'Afficher toutes les sources' : 'Reset to All Sources'}
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => fetchSmartSuggestions()}
              className="text-[11px] font-bold underline hover:text-rose-900"
            >
              {lang === 'FR' ? 'Réessayer' : 'Retry'}
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-teal-50 border border-teal-200 flex items-center justify-center shadow-xs">
              <Sparkles className="w-7 h-7 text-teal-700 animate-spin" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-base font-black text-[#0D3B37]">
                {lang === 'FR' ? 'Recherche des meilleures recettes...' : 'Finding your best zero-waste recipes...'}
              </h3>
              <p className="text-xs text-[#527470] leading-relaxed">
                {lang === 'FR'
                  ? 'Gemini analyse vos aliments à sauver, vos recettes favorites et explore le web culinaire.'
                  : 'Gemini is evaluating your expiring stock, custom favorites, and searching culinary websites.'}
              </p>
            </div>
          </div>
        ) : filteredSuggestions.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-[#E5DFD0] p-8 max-w-md mx-auto shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto">
              <ChefHat className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-[#0D3B37]">
              {lang === 'FR' ? 'Aucune suggestion trouvée' : 'No suggestions found'}
            </h3>
            <p className="text-xs text-[#527470] leading-relaxed">
              {lang === 'FR'
                ? 'Essayez d’élargir votre recherche, de changer d’onglet ou d’ajouter d’autres sites de recettes.'
                : 'Try adjusting your search query, selecting another tab, or adding additional recipe websites.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveTab('ALL');
                fetchSmartSuggestions('');
              }}
              className="px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 shadow-2xs"
            >
              {lang === 'FR' ? 'Réinitialiser les filtres' : 'Reset Filters'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSuggestions.map((recipe) => {
              const isExpanded = expandedRecipeId === recipe.id;
              const isPlanning = planningRecipeId === recipe.id;
              const inStockIngredients = recipe.ingredients.filter((i) => i.inStock);

              return (
                <div
                  key={recipe.id}
                  id={`recipe-card-${recipe.id}`}
                  className="rounded-3xl bg-white border border-[#E5DFD0] shadow-2xs overflow-hidden transition-all hover:border-[#D5CDBC]"
                >
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                    {/* Thumbnail Image */}
                    <div className="relative w-full sm:w-44 h-40 rounded-2xl overflow-hidden shrink-0 border border-[#E5DFD0] bg-slate-100">
                      <img
                        src={recipe.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
                        alt={recipe.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                      {/* Source Badge */}
                      <span className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                        {recipe.isWebSearch ? <Globe className="w-3 h-3 text-teal-300" /> : <BookOpen className="w-3 h-3 text-amber-300" />}
                        <span className="truncate max-w-[120px]">{recipe.source}</span>
                      </span>

                      {/* Stock Match Badge */}
                      <span
                        className={`absolute bottom-2 right-2 px-2.5 py-1 rounded-lg text-[10px] font-black shadow-sm ${
                          recipe.matchPercentage >= 80
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {recipe.matchPercentage}% {lang === 'FR' ? 'en stock' : 'in stock'}
                      </span>
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-base sm:text-lg font-black tracking-tight text-[#0D3B37] leading-snug">
                            {lang === 'FR' && recipe.titleFr ? recipe.titleFr : recipe.title}
                          </h3>

                          {/* Meal Slot, Time & Servings Meta */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#527470] mt-1">
                            <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-bold uppercase tracking-wider">
                              {recipe.mealType || selectedMealType}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {recipe.prepTime || recipe.totalTime || '25 min'}
                            </span>
                            <span>•</span>
                            <span>{recipe.servings || '4 servings'}</span>
                            <span>•</span>
                            <span className="capitalize">{lang === 'FR' && recipe.difficultyFr ? recipe.difficultyFr : recipe.difficulty || 'Easy'}</span>
                          </div>
                        </div>

                        {/* Top right actions: Web link and Translate */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={translatingId === recipe.id}
                            onClick={() => handleTranslateCard(recipe)}
                            className="p-1.5 rounded-xl border border-[#E5DFD0] text-slate-500 hover:text-teal-700 hover:bg-[#F3EFE6] transition-colors"
                            title={lang === 'FR' ? 'Traduire la recette' : 'Translate recipe'}
                          >
                            <Languages className={`w-4 h-4 ${translatingId === recipe.id ? 'animate-spin text-teal-700' : ''}`} />
                          </button>

                          {recipe.sourceUrl && (
                            <a
                              href={recipe.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-xl border border-[#E5DFD0] text-slate-500 hover:text-teal-700 hover:bg-[#F3EFE6] transition-colors"
                              title={lang === 'FR' ? 'Voir la recette sur le web' : 'View original web recipe'}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Anti-Waste Reason Banner */}
                      <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-xs font-semibold text-emerald-950 flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span>{recipe.zeroWasteReason}</span>
                          {recipe.rescuedIngredients && recipe.rescuedIngredients.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap mt-1">
                              <span className="text-[10px] text-emerald-800 font-bold">
                                {lang === 'FR' ? 'Aliments sauvés :' : 'Rescued items:'}
                              </span>
                              {recipe.rescuedIngredients.map((name, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 rounded-md bg-white border border-emerald-300 text-[10px] font-black text-emerald-900"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ingredients Preview */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-[#0D3B37]">
                            {lang === 'FR' ? 'Ingrédients nécessaires :' : 'Ingredients Needed:'}
                          </span>
                          <span className="text-[#527470]">
                            {inStockIngredients.length}/{recipe.ingredients.length} {lang === 'FR' ? 'disponibles' : 'available'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1">
                          {recipe.ingredients.slice(0, 6).map((ing, idx) => (
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
                              <span className="truncate max-w-[130px]">
                                {lang === 'FR' && ing.nameFr ? ing.nameFr : ing.name}
                              </span>
                            </span>
                          ))}
                          {recipe.ingredients.length > 6 && (
                            <span className="text-[10px] text-[#527470] font-semibold px-1">
                              +{recipe.ingredients.length - 6} {lang === 'FR' ? 'autres' : 'more'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expandable Instructions Section */}
                      {isExpanded && (
                        <div className="pt-2 border-t border-[#E5DFD0] space-y-2 animate-fade-in text-xs">
                          <h4 className="font-bold text-[#0D3B37]">
                            {lang === 'FR' ? 'Étapes de préparation :' : 'Preparation Steps:'}
                          </h4>
                          <ol className="list-decimal list-inside space-y-1.5 text-slate-700 leading-relaxed pl-1">
                            {(lang === 'FR' && recipe.instructionsFr && recipe.instructionsFr.length > 0
                              ? recipe.instructionsFr
                              : recipe.instructionsEn || []
                            ).map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
                        {/* Toggle Instructions */}
                        <button
                          type="button"
                          onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                          className="text-xs font-bold text-[#527470] hover:text-[#0D3B37] flex items-center gap-1"
                        >
                          <span>{isExpanded ? (lang === 'FR' ? 'Masquer détails' : 'Hide details') : (lang === 'FR' ? 'Voir détails & étapes' : 'View details & steps')}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {/* Primary Selection & Planning Button */}
                        <button
                          id={`btn-select-plan-${recipe.id}`}
                          type="button"
                          disabled={isPlanning}
                          onClick={() => handleSelectAndPlan(recipe)}
                          className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 disabled:opacity-60"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>
                            {isPlanning
                              ? lang === 'FR'
                                ? 'Planification...'
                                : 'Planning...'
                              : lang === 'FR'
                              ? `Planifier ce repas (${selectedMealType})`
                              : `Select & Plan This Meal (${selectedMealType})`}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

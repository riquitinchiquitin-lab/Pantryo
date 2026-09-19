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
} from 'lucide-react';
import { InventoryItem } from '../types';
import { RICARDO_RECIPES, RicardoRecipe } from '../data/ricardoRecipes';
import { AddRecipeModal } from './AddRecipeModal';
import { useLanguage } from '../utils/i18n';

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
}

export const CookingIdeasView: React.FC<CookingIdeasViewProps> = ({
  items,
  onAddMissingToGrocery,
}) => {
  const { lang, setLang } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<
    'ALL' | 'RICARDO' | 'CUSTOM' | 'EXPIRING' | 'FAST'
  >('ALL');
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [addedItemsNotice, setAddedItemsNotice] = useState<string | null>(null);

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
    fetch('/api/v1/recipes/custom')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.recipes)) {
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

      if (activeFilter === 'RICARDO' && !recipe.isRicardoOfficial) return false;
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
      setAddedItemsNotice(`✓ Added "${ingName}" to your grocery list!`);
      setTimeout(() => setAddedItemsNotice(null), 3000);
    }
  };

  // Ricardo Search URL generator
  const getRicardoSearchUrl = (query: string) => {
    const base =
      lang === 'FR'
        ? 'https://www.ricardocuisine.com/fr/recherche?term='
        : 'https://www.ricardocuisine.com/en/search?term=';
    return `${base}${encodeURIComponent(query)}`;
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in text-slate-800">
      {/* Top Header with Title, Language Switch & Action Button */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h2 className="text-xl font-black tracking-tight text-[#1E3022]">
              {lang === 'FR' ? 'Idées Culinaires & Recettes' : 'Cooking Ideas & Recipes'}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200/80 text-[10px] font-black tracking-wider uppercase">
              Ricardo + AI
            </span>
          </div>
          <p className="text-xs text-[#59725C]">
            {lang === 'FR'
              ? 'Recettes Ricardo, vidéos YouTube et recettes perso analysées par l’IA'
              : 'Ricardo recipes, YouTube videos & custom recipes powered by Gemini AI'}
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

      {/* Ricardo Cuisine Official Partnership Card */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#B91C1C] to-[#881337] text-white shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-sm tracking-wider text-white shadow-inner">
              R
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-200 block">
                Official Culinary Partner
              </span>
              <h3 className="text-sm font-black tracking-tight leading-tight">
                Ricardo Cuisine ({lang === 'FR' ? 'Québec & International' : 'Canada & Quebec'})
              </h3>
            </div>
          </div>
          <a
            href={lang === 'FR' ? 'https://www.ricardocuisine.com/fr' : 'https://www.ricardocuisine.com/en'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-xl bg-white text-red-900 hover:bg-red-50 text-[11px] font-black flex items-center gap-1 shadow-2xs transition-all active:scale-95"
          >
            <span>ricardocuisine.com</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <p className="text-[11px] text-red-100/90 leading-snug">
          {lang === 'FR'
            ? 'Cuisinez des repas de semaine rapides, anti-gaspillage et économiques créés par Ricardo Larrivée en puisant directement dans votre frigo, congélateur et garde-manger.'
            : 'Explore weeknight dinners, anti-waste meals, and batch prep from chef Ricardo Larrivée tailored to what you already have in stock.'}
        </p>
      </div>

      {/* Search Bar with Direct Ricardo Cuisine Web Link */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'FR'
                ? 'Rechercher une recette (ex: saumon, steak YouTube, pâtes)...'
                : 'Search recipes (e.g. salmon, YouTube steak, pasta)...'
            }
            className="w-full pl-9 pr-24 py-2 bg-white border border-[#D5E1D2] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
          />
          {searchQuery && (
            <a
              href={getRicardoSearchUrl(searchQuery)}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute right-2 top-1.5 px-2 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
              title="Search 7,000+ recipes on ricardocuisine.com"
            >
              <span>On Ricardo</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
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
                  href={getRicardoSearchUrl(item.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 rounded-lg bg-white border border-[#CADBC7] text-[10px] font-bold text-[#273D2B] hover:bg-emerald-50 flex items-center gap-1 transition-all"
                  title={`Search Ricardo recipes using ${item.name}`}
                >
                  <span>{item.name}</span>
                  <ExternalLink className="w-2.5 h-2.5 text-emerald-700" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
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
          onClick={() => setActiveFilter('RICARDO')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeFilter === 'RICARDO'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100'
          }`}
        >
          <span>⭐ Ricardo Cuisine</span>
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
      </div>

      {/* Recipe Cards List */}
      <div className="space-y-4">
        {filteredRecipes.length === 0 ? (
          <div className="p-8 text-center text-[#69826C] bg-white rounded-3xl border border-[#D5E1D2] space-y-3">
            <ChefHat className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
            <p className="text-xs font-bold text-[#233527]">
              {lang === 'FR' ? 'Aucune recette trouvée' : 'No matching recipes found'}
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'FR' ? 'Ajouter une recette' : 'Add a Recipe'}</span>
              </button>
              <a
                href={getRicardoSearchUrl(searchQuery || 'dinner')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-700 text-white rounded-xl text-xs font-bold hover:bg-rose-800 transition-all shadow-xs"
              >
                <span>Ricardo</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ) : (
          filteredRecipes.map((recipe) => {
            const isExpanded = expandedRecipeId === recipe.id;
            const isVideoPlaying = playingVideoId === recipe.id;
            const ricardoLink = lang === 'FR' ? recipe.ricardoUrlFr : recipe.ricardoUrlEn;
            const title = lang === 'FR' ? recipe.titleFr : recipe.title;
            const desc = lang === 'FR' ? recipe.descriptionFr : recipe.descriptionEn;
            const instructions = lang === 'FR' ? recipe.instructionsFr : recipe.instructionsEn;
            const difficultyLabel = lang === 'FR' ? recipe.difficultyFr : recipe.difficulty;
            const isYoutube = Boolean(recipe.youtubeUrl || recipe.youtubeVideoId || recipe.source === 'YouTube');
            const isUserCustom = Boolean(recipe.isCustom);

            // Compute available ingredients count
            const matchedIngredientsCount = recipe.ingredients.filter((ing) =>
              isIngredientInKitchen(ing.name, ing.inKitchenItemName)
            ).length;
            const totalIngredientsCount = recipe.ingredients.length;
            const matchPercentage = Math.round(
              (matchedIngredientsCount / totalIngredientsCount) * 100
            );

            return (
              <div
                key={recipe.id}
                className="rounded-3xl bg-white border border-[#D5E1D2] shadow-sm hover:border-emerald-400 transition-all overflow-hidden group"
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
                      className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/80 hover:bg-black text-white text-[10px] font-bold backdrop-blur-xs"
                    >
                      ✕ Close Video
                    </button>
                  </div>
                ) : (
                  /* Recipe Image Banner */
                  <div className="h-36 w-full relative overflow-hidden bg-slate-100">
                    <img
                      src={recipe.imageUrl}
                      alt={title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    {/* Badges on image */}
                    <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {recipe.isRicardoOfficial ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-600/90 text-white text-[10px] font-black backdrop-blur-xs flex items-center gap-1 shadow-xs">
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
                            className="p-1 rounded-full bg-black/50 hover:bg-red-600 text-white transition-colors"
                            title="Delete custom recipe"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>

                      <span className="px-2 py-0.5 rounded-full bg-emerald-600/90 text-white text-[10px] font-black backdrop-blur-xs flex items-center gap-1 shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        <span>
                          {matchPercentage}% {lang === 'FR' ? 'en stock' : 'in stock'}
                        </span>
                      </span>
                    </div>

                    {/* Title & Actions */}
                    <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-end justify-between text-white">
                      <div className="pr-2">
                        <h3 className="font-extrabold text-sm tracking-tight drop-shadow-md leading-snug">
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
                          className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[10px] font-black flex items-center gap-1 shadow-lg transition-all active:scale-95 shrink-0"
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

                <div className="p-4 space-y-3">
                  <p className="text-xs text-[#5D7060] leading-relaxed">{desc}</p>

                  {/* Ingredients Checklist with In-Kitchen indicators */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#556D58]">
                      <span className="uppercase tracking-wider">
                        {lang === 'FR' ? 'Ingrédients :' : 'Ingredients Needed:'}
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
                                    className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/70 flex items-center gap-1 active:scale-95 transition-all"
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
                          setExpandedRecipeId(isExpanded ? null : recipe.id)
                        }
                        className="p-1 text-[#556D58] hover:bg-[#EEF4EC] rounded-lg transition-colors flex items-center gap-1"
                      >
                        <span className="text-[10px] font-bold">
                          {isExpanded
                            ? lang === 'FR'
                              ? 'Fermer'
                              : 'Close'
                            : lang === 'FR'
                            ? 'Étapes'
                            : 'Steps'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Step-by-Step Instructions */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-[#E1EDE0] space-y-3 bg-[#F9FCF8] -mx-4 -mb-4 p-4 animate-fade-in">
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
                            className="w-full py-2 px-3 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
                          >
                            <span>
                              {lang === 'FR'
                                ? 'Ouvrir sur Ricardo Cuisine (ricardocuisine.com)'
                                : 'Open on Ricardo Cuisine (ricardocuisine.com)'}
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

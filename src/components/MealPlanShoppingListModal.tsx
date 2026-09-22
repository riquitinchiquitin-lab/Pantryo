import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarRange,
  Calendar,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Trash2,
  Check,
  Refrigerator,
  Sparkles,
  ArrowRight,
  Filter,
  BookmarkPlus,
  RefreshCw,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PlannedMeal, InventoryItem, StorageType, SavedGroceryList } from '../types';
import { getFoodVisual } from '../utils/foodVisuals';
import { useLanguage } from '../utils/i18n';

const SAVED_LISTS_STORAGE_KEY = 'kitchen_komrade_saved_grocery_lists_v1';

export interface MealPlanShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  locationType: StorageType;
  inStock: boolean;
  stockDetail?: {
    itemName: string;
    quantity: number;
    unit: string;
    location: string;
  };
  sourceMeals: Array<{ id: string; title: string; date: string }>;
  selected: boolean;
}

interface MealPlanShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  plannedMeals: PlannedMeal[];
  inventoryItems: InventoryItem[];
  onAddIngredientsToGrocery?: (
    ingredients: Array<{ name: string; quantity: number; unit: string; category?: string }>
  ) => void;
  onNavigateToGrocery?: () => void;
}

/**
 * Helper to normalize ingredient strings for fuzzy comparison
 */
function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[(),]/g, ' ')
    .replace(/\b(de|d'|du|des|le|la|les|of|fresh|frais|fraiche|fraiches|bio|organic|raw|crus|tranches|sliced)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Intelligent parser to extract quantity, unit, and clean ingredient name
 */
function parseIngredientString(raw: string): { quantity: number; unit: string; cleanName: string } {
  const text = raw.trim();
  // Match composite packs: e.g. "2 packs of 300mg of salami", "2 paquets de 400g"
  const packMatch = text.match(/^([\d.]+)\s*(packs?|paquets?)\s*(?:of|de)\s*([\d.]+\s*[a-zA-Z]+)\s*(?:of|de)?\s*(.+)$/i);
  if (packMatch) {
    return {
      quantity: parseFloat(packMatch[1]) || 1,
      unit: `pack (${packMatch[3].trim()})`,
      cleanName: packMatch[4].trim(),
    };
  }

  // Match e.g. "500g chicken breasts", "2.5 lbs potatoes", "3 cans diced tomatoes"
  const standardMatch = text.match(/^([\d./]+)\s*([a-zA-Z]+(?:\s*\([^)]+\))?)\s*(?:of|de)?\s*(.+)$/i);
  if (standardMatch) {
    let q = 1;
    if (standardMatch[1].includes('/')) {
      const parts = standardMatch[1].split('/');
      q = (parseFloat(parts[0]) || 1) / (parseFloat(parts[1]) || 1);
    } else {
      q = parseFloat(standardMatch[1]) || 1;
    }
    return {
      quantity: Number(q.toFixed(2)),
      unit: standardMatch[2].trim(),
      cleanName: standardMatch[3].trim(),
    };
  }

  // Match simple number prefix e.g. "2 onions", "4 eggs"
  const numOnlyMatch = text.match(/^([\d.]+)\s+(.+)$/);
  if (numOnlyMatch) {
    return {
      quantity: parseFloat(numOnlyMatch[1]) || 1,
      unit: 'pcs',
      cleanName: numOnlyMatch[2].trim(),
    };
  }

  return {
    quantity: 1,
    unit: 'pcs',
    cleanName: text,
  };
}

export const MealPlanShoppingListModal: React.FC<MealPlanShoppingListModalProps> = ({
  isOpen,
  onClose,
  plannedMeals,
  inventoryItems,
  onAddIngredientsToGrocery,
  onNavigateToGrocery,
}) => {
  const { lang } = useLanguage();

  // Helper date calculations
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);

  const defaultEndStr = useMemo(() => {
    const end = new Date(today);
    end.setDate(end.getDate() + 6); // default next 7 days
    return end.toISOString().split('T')[0];
  }, [today]);

  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(defaultEndStr);
  const [activeFilter, setActiveFilter] = useState<'all' | 'needed' | 'inStock'>('needed');
  const [showMealsBreakdown, setShowMealsBreakdown] = useState(false);

  // Extra manual item row state
  const [extraName, setExtraName] = useState('');
  const [extraQty, setExtraQty] = useState<number | string>(1);
  const [extraUnit, setExtraUnit] = useState('pcs');

  // Items list state (user can toggle selection, adjust qty, unit, or remove)
  const [shoppingItems, setShoppingItems] = useState<MealPlanShoppingItem[]>([]);
  const [isSavedToList, setIsSavedToList] = useState(false);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  // Helper presets for quick date picking
  const setPresetRange = (preset: 'todayTomorrow' | 'thisWeek' | 'next7Days' | 'next14Days' | 'thisMonth') => {
    const now = new Date();
    const startIso = now.toISOString().split('T')[0];

    if (preset === 'todayTomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setStartDate(startIso);
      setEndDate(tomorrow.toISOString().split('T')[0]);
    } else if (preset === 'thisWeek') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      setStartDate(monday.toISOString().split('T')[0]);
      setEndDate(sunday.toISOString().split('T')[0]);
    } else if (preset === 'next7Days') {
      const end = new Date(now);
      end.setDate(end.getDate() + 6);
      setStartDate(startIso);
      setEndDate(end.toISOString().split('T')[0]);
    } else if (preset === 'next14Days') {
      const end = new Date(now);
      end.setDate(end.getDate() + 13);
      setStartDate(startIso);
      setEndDate(end.toISOString().split('T')[0]);
    } else if (preset === 'thisMonth') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(startOfMonth.toISOString().split('T')[0]);
      setEndDate(endOfMonth.toISOString().split('T')[0]);
    }
  };

  // Find meals that fall inside [startDate, endDate]
  const relevantMeals = useMemo(() => {
    if (!startDate || !endDate) return [];
    return plannedMeals.filter((m) => {
      return m.date >= startDate && m.date <= endDate;
    });
  }, [plannedMeals, startDate, endDate]);

  // Aggregate ingredients & cross-check inventory when relevantMeals or inventoryItems changes
  useEffect(() => {
    if (!isOpen) return;

    const aggregated = new Map<
      string,
      {
        rawName: string;
        cleanName: string;
        quantity: number;
        unit: string;
        sourceMeals: Array<{ id: string; title: string; date: string }>;
        explicitInStock?: boolean;
      }
    >();

    relevantMeals.forEach((meal) => {
      const mealSummary = { id: meal.id, title: meal.title, date: meal.date };

      if (meal.ingredients && meal.ingredients.length > 0) {
        meal.ingredients.forEach((ing) => {
          const parsed = parseIngredientString(ing.name);
          const nameToUse = ing.name.replace(/\(.*\)/, '').trim() || parsed.cleanName;
          const key = normalizeName(nameToUse);
          if (!key) return;

          const existing = aggregated.get(key);
          const qty = typeof ing.quantity === 'number' && ing.quantity > 0 ? ing.quantity : parsed.quantity;
          const u = ing.unit || parsed.unit || 'pcs';

          if (existing) {
            existing.quantity += qty;
            if (!existing.sourceMeals.some((m) => m.id === meal.id)) {
              existing.sourceMeals.push(mealSummary);
            }
          } else {
            aggregated.set(key, {
              rawName: nameToUse,
              cleanName: nameToUse,
              quantity: qty,
              unit: u,
              sourceMeals: [mealSummary],
              explicitInStock: ing.inStock,
            });
          }
        });
      } else {
        // Fallback: meal has no structured ingredients, infer from title
        const parsed = parseIngredientString(meal.title);
        const key = normalizeName(parsed.cleanName);
        if (key && !aggregated.has(key)) {
          aggregated.set(key, {
            rawName: parsed.cleanName,
            cleanName: parsed.cleanName,
            quantity: 1,
            unit: 'pcs',
            sourceMeals: [mealSummary],
          });
        }
      }
    });

    // Cross-check each aggregated item against current kitchen inventory
    const itemsList: MealPlanShoppingItem[] = [];

    aggregated.forEach((val, key) => {
      // Find matching item in inventory
      let matchedStockItem: InventoryItem | undefined;

      if (val.explicitInStock === true) {
        // Explicitly marked in stock on the meal
        matchedStockItem = inventoryItems.find((inv) => {
          const normInv = normalizeName(inv.name);
          return normInv.includes(key) || key.includes(normInv);
        });
      } else {
        matchedStockItem = inventoryItems.find((inv) => {
          const normInv = normalizeName(inv.name);
          return normInv === key || normInv.includes(key) || key.includes(normInv);
        });
      }

      const visual = getFoodVisual(val.cleanName);
      const inStock = Boolean(matchedStockItem) || val.explicitInStock === true;

      itemsList.push({
        id: `mp_item_${key}_${Math.random().toString(36).substring(2, 6)}`,
        name: val.cleanName,
        quantity: val.quantity > 0 ? Number(val.quantity.toFixed(2)) : 1,
        unit: val.unit || 'pcs',
        category: visual.badgeLabel || 'Pantry Staples',
        locationType: (matchedStockItem?.locationType || 'FRIDGE') as StorageType,
        inStock,
        stockDetail: matchedStockItem
          ? {
              itemName: matchedStockItem.name,
              quantity: matchedStockItem.quantity,
              unit: matchedStockItem.unit,
              location: matchedStockItem.locationName || matchedStockItem.locationType,
            }
          : undefined,
        sourceMeals: val.sourceMeals,
        // Pre-select only items that are NOT in stock (needed for shopping)
        selected: !inStock,
      });
    });

    // Sort: items to buy (not in stock) first, then in-stock items
    itemsList.sort((a, b) => {
      if (a.inStock === b.inStock) {
        return a.name.localeCompare(b.name);
      }
      return a.inStock ? 1 : -1;
    });

    setShoppingItems(itemsList);
  }, [relevantMeals, inventoryItems, isOpen]);

  if (!isOpen) return null;

  // Filtered views
  const neededCount = shoppingItems.filter((i) => !i.inStock).length;
  const inStockCount = shoppingItems.filter((i) => i.inStock).length;
  const selectedCount = shoppingItems.filter((i) => i.selected).length;

  const displayItems = shoppingItems.filter((item) => {
    if (activeFilter === 'needed') return !item.inStock;
    if (activeFilter === 'inStock') return item.inStock;
    return true;
  });

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setShoppingItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, selected: !it.selected } : it))
    );
  };

  // Select/Deselect All in current filter
  const handleSelectAll = (select: boolean) => {
    setShoppingItems((prev) =>
      prev.map((it) => {
        if (activeFilter === 'needed' && it.inStock) return it;
        if (activeFilter === 'inStock' && !it.inStock) return it;
        return { ...it, selected: select };
      })
    );
  };

  // Update item field (quantity, unit, name)
  const handleUpdateItem = (
    id: string,
    field: 'quantity' | 'unit' | 'name',
    val: string | number
  ) => {
    setShoppingItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  // Delete item from list
  const handleDeleteItem = (id: string) => {
    setShoppingItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Add extra custom item
  const handleAddExtraItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraName.trim()) return;

    const visual = getFoodVisual(extraName.trim());
    const parsedQty = parseFloat(String(extraQty));
    const safeQty = isNaN(parsedQty) || parsedQty <= 0 ? 1 : Number(parsedQty.toFixed(2));

    const newItem: MealPlanShoppingItem = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: extraName.trim(),
      quantity: safeQty,
      unit: extraUnit.trim() || 'pcs',
      category: visual.badgeLabel || 'Pantry Staples',
      locationType: 'FRIDGE',
      inStock: false,
      sourceMeals: [{ id: 'manual', title: lang === 'FR' ? 'Ajout manuel' : 'Manual Add', date: todayStr }],
      selected: true,
    };

    setShoppingItems((prev) => [newItem, ...prev]);
    setExtraName('');
    setExtraQty(1);
    setExtraUnit('pcs');
  };

  // Action: Add selected to Active Grocery Cart
  const handlePushToGroceryCart = () => {
    const selected = shoppingItems.filter((i) => i.selected);
    if (selected.length === 0) {
      setAddedNotice(lang === 'FR' ? 'Veuillez cocher au moins un article' : 'Please select at least one item');
      setTimeout(() => setAddedNotice(null), 3000);
      return;
    }

    if (onAddIngredientsToGrocery) {
      onAddIngredientsToGrocery(
        selected.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
        }))
      );
    }

    setAddedNotice(
      lang === 'FR'
        ? `🛒 ${selected.length} articles ajoutés à votre panier d'épicerie !`
        : `🛒 ${selected.length} items added to your grocery cart!`
    );
    setTimeout(() => setAddedNotice(null), 4000);
  };

  // Action: Save as a Named Saved Grocery List
  const handleSaveAsGroceryList = () => {
    const selected = shoppingItems.filter((i) => i.selected);
    if (selected.length === 0) {
      setAddedNotice(lang === 'FR' ? 'Veuillez cocher au moins un article' : 'Please select at least one item');
      setTimeout(() => setAddedNotice(null), 3000);
      return;
    }

    const defaultListName =
      lang === 'FR'
        ? `Plan Repas (${startDate.substring(5)} au ${endDate.substring(5)})`
        : `Meal Plan (${startDate.substring(5)} to ${endDate.substring(5)})`;

    const newSavedList: SavedGroceryList = {
      id: `list_mp_${Date.now()}`,
      name: defaultListName,
      description:
        lang === 'FR'
          ? `Généré automatiquement selon ${relevantMeals.length} repas planifiés. Les articles en stock ont été vérifiés.`
          : `Generated automatically from ${relevantMeals.length} planned meals. Kitchen inventory cross-checked.`,
      categoryTag: 'Meal Prep',
      itemCount: selected.length,
      createdAt: new Date().toISOString(),
      lastModifiedBy: 'Yan',
      items: selected.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        locationType: item.locationType,
        category: item.category,
      })),
    };

    try {
      const existingJson = localStorage.getItem(SAVED_LISTS_STORAGE_KEY);
      const existingLists: SavedGroceryList[] = existingJson ? JSON.parse(existingJson) : [];
      const updatedLists = [newSavedList, ...existingLists];
      localStorage.setItem(SAVED_LISTS_STORAGE_KEY, JSON.stringify(updatedLists));

      setIsSavedToList(true);
      setAddedNotice(
        lang === 'FR'
          ? `💾 Liste "${defaultListName}" sauvegardée dans vos Listes Enregistrées !`
          : `💾 Saved list "${defaultListName}" to your Saved Lists!`
      );
      setTimeout(() => setAddedNotice(null), 4000);
    } catch (e) {
      console.error('Failed to save grocery list to localStorage', e);
    }
  };

  return (
    <div
      id="meal-plan-shopping-list-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        id="meal-plan-shopping-list-modal"
        className="bg-white w-full max-w-2xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#D5E1D2]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-800 to-emerald-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <ShoppingBag className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider bg-amber-300/20 text-amber-200 px-2 py-0.5 rounded-md border border-amber-300/30">
                  {lang === 'FR' ? 'Générateur Intelligent' : 'Smart Generator'}
                </span>
                <span className="text-[11px] text-teal-200">
                  {lang === 'FR' ? 'Inventaire Croisé' : 'Kitchen Cross-Check'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                {lang === 'FR'
                  ? "Générer la Liste d'Épicerie du Plan de Repas"
                  : 'Generate Meal Plan Shopping List'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Toast */}
        {addedNotice && (
          <div className="px-4 py-2.5 bg-emerald-700 text-white text-xs font-bold flex items-center justify-between animate-fade-in shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{addedNotice}</span>
            </div>
            {onNavigateToGrocery && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToGrocery();
                }}
                className="underline text-emerald-100 hover:text-white ml-2 text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <span>{lang === 'FR' ? "Voir l'épicerie" : 'View Grocery'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-slate-800">
          {/* Date Range Picker with Quick Presets */}
          <div className="bg-[#FAFDF9] border border-[#DCE8DB] rounded-2xl p-3.5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-1.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-[#0D3B37]">
                <CalendarRange className="w-4 h-4 text-teal-700" />
                <span>{lang === 'FR' ? 'Période du plan de repas' : 'Meal Plan Date Range'}</span>
              </div>
              {/* Quick Presets */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                {(
                  [
                    { id: 'todayTomorrow', labelEn: 'Next 2 Days', labelFr: '2 prochains jours' },
                    { id: 'thisWeek', labelEn: 'This Week', labelFr: 'Cette semaine' },
                    { id: 'next7Days', labelEn: 'Next 7 Days', labelFr: '7 jours' },
                    { id: 'next14Days', labelEn: '14 Days', labelFr: '14 jours' },
                    { id: 'thisMonth', labelEn: 'This Month', labelFr: 'Ce mois' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPresetRange(p.id)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#EAE5D8] text-[#37524E] hover:bg-teal-100 hover:text-teal-900 transition-colors shrink-0 cursor-pointer"
                  >
                    {lang === 'FR' ? p.labelFr : p.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-[#44625D] mb-1">
                  {lang === 'FR' ? 'Du (Date de début)' : 'From (Start Date)'}
                </label>
                <div className="flex items-center bg-white border border-[#D5E1D2] rounded-xl px-3 py-1.5 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-teal-700 mr-2 shrink-0" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#44625D] mb-1">
                  {lang === 'FR' ? 'Au (Date de fin)' : 'To (End Date)'}
                </label>
                <div className="flex items-center bg-white border border-[#D5E1D2] rounded-xl px-3 py-1.5 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-teal-700 mr-2 shrink-0" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs font-bold text-slate-800 focus:outline-none bg-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Summary Badge Bar */}
          <div className="bg-white border border-[#DCE8DB] rounded-2xl p-3 shadow-2xs space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#0D3B37]">
                  {relevantMeals.length}{' '}
                  {lang === 'FR'
                    ? relevantMeals.length > 1
                      ? 'repas planifiés'
                      : 'repas planifié'
                    : relevantMeals.length > 1
                    ? 'meals scheduled'
                    : 'meal scheduled'}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-medium text-[#466963]">
                  {shoppingItems.length}{' '}
                  {lang === 'FR' ? 'ingrédients uniques' : 'unique ingredients'}
                </span>
              </div>

              {relevantMeals.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowMealsBreakdown(!showMealsBreakdown)}
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                >
                  <span>{showMealsBreakdown ? (lang === 'FR' ? 'Masquer repas' : 'Hide meals') : (lang === 'FR' ? 'Voir repas inclus' : 'View meals included')}</span>
                  {showMealsBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {/* Collapsible list of included meals in range */}
            {showMealsBreakdown && relevantMeals.length > 0 && (
              <div className="pt-2 border-t border-[#EAE3D4] flex flex-wrap gap-1.5 animate-fade-in">
                {relevantMeals.map((m) => (
                  <div
                    key={m.id}
                    className="px-2.5 py-1 rounded-lg bg-[#F5F2EB] border border-[#E2DAD0] text-[11px] flex items-center gap-1.5"
                  >
                    <span className="font-bold text-teal-900">{m.title}</span>
                    <span className="text-[10px] text-slate-500 font-medium">({m.date.substring(5)})</span>
                    {m.ingredients?.length > 0 && (
                      <span className="text-[9px] bg-teal-100 text-teal-800 px-1 py-0.2 rounded font-bold">
                        {m.ingredients.length} ing.
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div
                onClick={() => setActiveFilter('needed')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  activeFilter === 'needed'
                    ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-400'
                    : 'bg-[#FAF8F5] border-[#E8E1D5] hover:bg-white'
                }`}
              >
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    {lang === 'FR' ? 'À Acheter (Manquant)' : 'To Buy (Missing)'}
                  </div>
                  <div className="text-base font-black text-amber-950 mt-0.5">
                    {neededCount} {lang === 'FR' ? 'articles' : 'items'}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  🛒
                </div>
              </div>

              <div
                onClick={() => setActiveFilter('inStock')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  activeFilter === 'inStock'
                    ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400'
                    : 'bg-[#FAF8F5] border-[#E8E1D5] hover:bg-white'
                }`}
              >
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    {lang === 'FR' ? 'En Stock en Cuisine' : 'In Kitchen Stock'}
                  </div>
                  <div className="text-base font-black text-emerald-950 mt-0.5">
                    {inStockCount} {lang === 'FR' ? 'déjà disponibles' : 'already available'}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  <Refrigerator className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar & Bulk Actions */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="inline-flex rounded-xl p-0.5 bg-[#EFECE3] border border-[#E0DAC9]">
              <button
                type="button"
                onClick={() => setActiveFilter('needed')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeFilter === 'needed'
                    ? 'bg-white text-teal-900 shadow-2xs'
                    : 'text-[#56736F] hover:text-[#133E3B]'
                }`}
              >
                {lang === 'FR' ? 'Manquants' : 'Needed'} ({neededCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('inStock')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeFilter === 'inStock'
                    ? 'bg-white text-teal-900 shadow-2xs'
                    : 'text-[#56736F] hover:text-[#133E3B]'
                }`}
              >
                {lang === 'FR' ? 'En Stock' : 'In Stock'} ({inStockCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeFilter === 'all'
                    ? 'bg-white text-teal-900 shadow-2xs'
                    : 'text-[#56736F] hover:text-[#133E3B]'
                }`}
              >
                {lang === 'FR' ? 'Tout' : 'All'} ({shoppingItems.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                className="text-[11px] font-bold text-teal-700 hover:underline cursor-pointer"
              >
                {lang === 'FR' ? 'Tout cocher' : 'Select all'}
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                className="text-[11px] font-bold text-slate-500 hover:underline cursor-pointer"
              >
                {lang === 'FR' ? 'Tout décocher' : 'Deselect all'}
              </button>
            </div>
          </div>

          {/* Ingredients List */}
          {displayItems.length === 0 ? (
            <div className="p-8 text-center bg-[#FAF8F3] rounded-2xl border border-dashed border-[#D5CDBC] space-y-2">
              <Sparkles className="w-8 h-8 text-teal-600 mx-auto opacity-70" />
              <div className="text-sm font-bold text-[#0D3B37]">
                {relevantMeals.length === 0
                  ? lang === 'FR'
                    ? 'Aucun repas planifié pour cette période.'
                    : 'No meals scheduled for this date range.'
                  : lang === 'FR'
                  ? 'Aucun article dans cette catégorie.'
                  : 'No items in this category.'}
              </div>
              <p className="text-xs text-[#527470] max-w-sm mx-auto">
                {relevantMeals.length === 0
                  ? lang === 'FR'
                    ? 'Sélectionnez une autre plage de dates ou planifiez des repas depuis le calendrier.'
                    : 'Select a different date range or schedule meals from the calendar.'
                  : lang === 'FR'
                  ? 'Tous vos ingrédients nécessaires sont déjà présents en stock !'
                  : 'All your required ingredients are already present in stock!'}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {displayItems.map((item) => {
                const visual = getFoodVisual(item.name);
                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                      item.selected
                        ? 'bg-white border-teal-300 shadow-2xs'
                        : 'bg-[#F9F7F1]/80 border-[#EAE3D4] opacity-80'
                    }`}
                  >
                    {/* Checkbox and item info */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleSelect(item.id)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 shrink-0 cursor-pointer"
                      />

                      <div className={`w-8 h-8 rounded-xl ${visual.bgColor} ${visual.borderColor} border flex items-center justify-center shrink-0`}>
                        <visual.icon className={`w-4 h-4 ${visual.textColor}`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-[#0D3B37] truncate">
                            {item.name}
                          </span>

                          {item.inStock ? (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                              <Check className="w-2.5 h-2.5" />
                              <span>
                                {item.stockDetail
                                  ? `${lang === 'FR' ? 'En cuisine' : 'In kitchen'} (${item.stockDetail.quantity} ${item.stockDetail.unit} - ${item.stockDetail.location})`
                                  : lang === 'FR'
                                  ? 'En stock'
                                  : 'In stock'}
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                              <span>🛒 {lang === 'FR' ? 'À acheter' : 'To buy'}</span>
                            </span>
                          )}
                        </div>

                        {/* Source meals badges */}
                        {item.sourceMeals.length > 0 && (
                          <div className="text-[10px] text-[#698882] truncate mt-0.5">
                            <span className="font-semibold">{lang === 'FR' ? 'Pour : ' : 'For: '}</span>
                            {item.sourceMeals.map((m) => m.title).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quantity & Unit Stepper / Input */}
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        step="any"
                        min="0.001"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)
                        }
                        className="w-14 px-1 py-1 text-xs text-center font-bold bg-[#F7FAF6] border border-[#D5E1D2] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600 text-slate-800"
                        title={lang === 'FR' ? 'Quantité' : 'Quantity'}
                      />
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                        className="w-18 px-1.5 py-1 text-xs text-center bg-[#F7FAF6] border border-[#D5E1D2] rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600 text-slate-700 font-medium"
                        placeholder="pcs, kg..."
                        title={lang === 'FR' ? 'Unité (ex. pack, kg, oz)' : 'Unit (e.g. pack, lbs)'}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title={lang === 'FR' ? 'Supprimer' : 'Remove'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Extra Household / Grocery Item Form */}
          <form
            onSubmit={handleAddExtraItem}
            className="p-2.5 rounded-2xl bg-[#F8F5EE] border border-[#E5DFD0] flex items-center gap-1.5"
          >
            <input
              type="text"
              value={extraName}
              onChange={(e) => setExtraName(e.target.value)}
              placeholder={
                lang === 'FR'
                  ? '+ Ajouter un article supplémentaire (ex. essuie-tout, huile...)'
                  : '+ Add extra item (e.g. paper towels, olive oil...)'
              }
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#D5CDBC] rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-600 text-slate-800"
            />
            <input
              type="number"
              step="any"
              min="0.001"
              value={extraQty}
              onChange={(e) => setExtraQty(e.target.value)}
              className="w-12 px-1 py-1.5 text-xs text-center font-bold bg-white border border-[#D5CDBC] rounded-xl text-slate-800"
              title="Quantity"
            />
            <input
              type="text"
              value={extraUnit}
              onChange={(e) => setExtraUnit(e.target.value)}
              placeholder="unit"
              className="w-14 px-1 py-1.5 text-xs text-center bg-white border border-[#D5CDBC] rounded-xl text-slate-700"
              title="Unit"
            />
            <button
              type="submit"
              className="px-2.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'FR' ? 'Ajouter' : 'Add'}</span>
            </button>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-[#FAF8F3] border-t border-[#E5DFD0] flex items-center justify-between flex-wrap gap-2.5 shrink-0">
          <div className="text-xs font-bold text-[#0D3B37]">
            <span>{selectedCount}</span>{' '}
            <span className="text-[#5B7B76]">
              {lang === 'FR'
                ? selectedCount > 1
                  ? 'articles cochés'
                  : 'article coché'
                : selectedCount > 1
                ? 'items selected'
                : 'item selected'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSaveAsGroceryList}
              className="px-3.5 py-2 rounded-xl border border-teal-700 text-teal-800 hover:bg-teal-50 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <BookmarkPlus className="w-4 h-4 text-teal-700" />
              <span>
                {lang === 'FR' ? 'Enregistrer comme Liste' : 'Save as Shopping List'}
              </span>
            </button>

            <button
              type="button"
              onClick={handlePushToGroceryCart}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-amber-300" />
              <span>
                {lang === 'FR'
                  ? "Ajouter au Panier d'Épicerie"
                  : 'Add to Grocery Shopping List'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

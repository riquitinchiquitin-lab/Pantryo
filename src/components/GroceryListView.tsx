import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  BookmarkCheck,
  BookmarkPlus,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Apple,
  Milk,
  Beef,
  Wheat,
  Package,
  Snowflake,
  Flame,
  Coffee,
  Cookie,
  ShoppingBag,
  AlertTriangle,
} from 'lucide-react';
import { InventoryItem, SavedGroceryListItem, StorageType } from '../types';
import { FoodVisualBadge } from './FoodVisualBadge';
import { getFoodVisual } from '../utils/foodVisuals';
import { SavedListsModal } from './SavedListsModal';
import { useLanguage } from '../utils/i18n';
import { getItemDisplayName, formatLocalizedQuantityUnit, getBilingualNames } from '../utils/foodTranslator';

export interface GroceryCartItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  locationType: StorageType;
  inCart: boolean;
  autoSuggested?: boolean;
  outOfStock?: boolean;
  notes?: string;
  imageUrl?: string;
}

interface GroceryListViewProps {
  expiringItems: InventoryItem[];
  currentUser: { id: string; name: string };
  onStockItemsToKitchen: (
    itemsToAdd: Array<{
      name: string;
      quantity: number;
      unit: string;
      locationType: StorageType;
      categoryName: string;
      imageUrl?: string;
      notes?: string;
    }>
  ) => Promise<boolean>;
  groceryItems: GroceryCartItem[];
  onUpdateGroceryItems: React.Dispatch<React.SetStateAction<GroceryCartItem[]>>;
  onSwitchToInventory?: () => void;
  onOpenReceiptScanner?: () => void;
}

// Smart automatic location assignment for background kitchen stocking
function inferLocation(name: string, category?: string): StorageType {
  const n = (name + ' ' + (category || '')).toLowerCase();
  if (
    n.includes('épice') ||
    n.includes('epice') ||
    n.includes('spice') ||
    n.includes('poivre') ||
    n.includes('pepper') ||
    n.includes('paprika') ||
    n.includes('curry') ||
    n.includes('cumin') ||
    n.includes('cinnamon') ||
    n.includes('cannelle') ||
    n.includes('oregano') ||
    n.includes('origan') ||
    n.includes('thym') ||
    n.includes('thyme') ||
    n.includes('muscade') ||
    n.includes('nutmeg') ||
    n.includes('assaisonnement') ||
    n.includes('seasoning') ||
    n.includes('sel') ||
    n.includes('salt') ||
    n.includes('curcuma') ||
    n.includes('turmeric')
  ) {
    return 'SPICE_RACK';
  }
  if (
    n.includes('frozen') ||
    n.includes('surgel') ||
    n.includes('glace') ||
    n.includes('ice cream') ||
    n.includes('congel')
  ) {
    return 'FREEZER';
  }
  if (
    n.includes('farine') ||
    n.includes('flour') ||
    n.includes('huile') ||
    n.includes('oil') ||
    n.includes('riz') ||
    n.includes('rice') ||
    n.includes('pâte') ||
    n.includes('pasta') ||
    n.includes('conserve') ||
    n.includes('canned') ||
    n.includes('sucre') ||
    n.includes('sugar') ||
    n.includes('café') ||
    n.includes('coffee') ||
    n.includes('thé') ||
    n.includes('tea') ||
    n.includes('céréale') ||
    n.includes('cereal') ||
    n.includes('biscuit') ||
    n.includes('chips') ||
    n.includes('pain') ||
    n.includes('bread') ||
    n.includes('sauce')
  ) {
    return 'PANTRY';
  }
  return 'FRIDGE';
}

export interface AisleCategory {
  id: string;
  nameEn: string;
  nameFr: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  order: number;
}

export const AISLE_CATEGORIES: Record<string, AisleCategory> = {
  produce: {
    id: 'produce',
    nameEn: 'Produce',
    nameFr: 'Fruits & Légumes',
    icon: Apple,
    iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconColor: 'text-emerald-700',
    order: 1,
  },
  dairy: {
    id: 'dairy',
    nameEn: 'Dairy & Eggs',
    nameFr: 'Produits Laitiers & Œufs',
    icon: Milk,
    iconBg: 'bg-sky-50 text-sky-700 border-sky-200',
    iconColor: 'text-sky-700',
    order: 2,
  },
  meat: {
    id: 'meat',
    nameEn: 'Meat & Seafood',
    nameFr: 'Viandes & Poissons',
    icon: Beef,
    iconBg: 'bg-rose-50 text-rose-700 border-rose-200',
    iconColor: 'text-rose-700',
    order: 3,
  },
  bakery: {
    id: 'bakery',
    nameEn: 'Bakery',
    nameFr: 'Boulangerie',
    icon: Wheat,
    iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'text-amber-700',
    order: 4,
  },
  pantry: {
    id: 'pantry',
    nameEn: 'Pantry & Dry Goods',
    nameFr: 'Garde-Manger & Épicerie',
    icon: Package,
    iconBg: 'bg-purple-50 text-purple-700 border-purple-200',
    iconColor: 'text-purple-700',
    order: 5,
  },
  frozen: {
    id: 'frozen',
    nameEn: 'Frozen',
    nameFr: 'Surgelés',
    icon: Snowflake,
    iconBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    iconColor: 'text-indigo-700',
    order: 6,
  },
  spices: {
    id: 'spices',
    nameEn: 'Spices & Condiments',
    nameFr: 'Épices & Condiments',
    icon: Flame,
    iconBg: 'bg-orange-50 text-orange-700 border-orange-200',
    iconColor: 'text-orange-700',
    order: 7,
  },
  beverages: {
    id: 'beverages',
    nameEn: 'Beverages',
    nameFr: 'Boissons',
    icon: Coffee,
    iconBg: 'bg-teal-50 text-teal-700 border-teal-200',
    iconColor: 'text-teal-700',
    order: 8,
  },
  snacks: {
    id: 'snacks',
    nameEn: 'Snacks & Sweets',
    nameFr: 'Collations & Douceurs',
    icon: Cookie,
    iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'text-amber-700',
    order: 9,
  },
  other: {
    id: 'other',
    nameEn: 'Household & Other',
    nameFr: 'Maison & Divers',
    icon: ShoppingBag,
    iconBg: 'bg-slate-50 text-slate-700 border-slate-200',
    iconColor: 'text-slate-700',
    order: 10,
  },
};

export function getGroceryAisleId(item: GroceryCartItem): string {
  const cat = (item.category || '').toLowerCase();
  const name = (item.name || '').toLowerCase();
  const text = `${cat} ${name}`;

  // 1. Spices & Seasonings
  if (
    item.locationType === 'SPICE_RACK' ||
    text.includes('spice') || text.includes('épice') || text.includes('epice') ||
    text.includes('poivre') || text.includes('pepper') || text.includes('sel') ||
    text.includes('salt') || text.includes('cinnamon') || text.includes('cannelle') ||
    text.includes('paprika') || text.includes('curry') || text.includes('oregano') ||
    text.includes('origan') || text.includes('thyme') || text.includes('thym') ||
    text.includes('cumin') || text.includes('herbes') || text.includes('seasoning') ||
    text.includes('assaisonnement') || text.includes('vanille') || text.includes('vanilla')
  ) {
    return 'spices';
  }

  // 2. Frozen
  if (
    item.locationType === 'FREEZER' ||
    text.includes('frozen') || text.includes('surgel') || text.includes('glace') ||
    text.includes('ice cream') || text.includes('congel')
  ) {
    return 'frozen';
  }

  // 3. Produce (Fruits, Vegetables, Fresh Herbs)
  if (
    cat.includes('produce') || cat.includes('legume') || cat.includes('légume') ||
    cat.includes('fruit') || cat.includes('vegetable') || cat.includes('salad') ||
    cat.includes('greens') || cat.includes('citrus') || cat.includes('root') ||
    text.includes('pomme') || text.includes('apple') || text.includes('banana') ||
    text.includes('banane') || text.includes('potato') || text.includes('pomme de terre') ||
    text.includes('patate') || text.includes('carrot') || text.includes('carotte') ||
    text.includes('onion') || text.includes('oignon') || text.includes('garlic') ||
    text.includes('ail') || text.includes('tomato') || text.includes('tomate') ||
    text.includes('avocat') || text.includes('avocado') || text.includes('lettuce') ||
    text.includes('laitue') || text.includes('spinach') || text.includes('épinard') ||
    text.includes('epinard') || text.includes('cucumber') || text.includes('concombre') ||
    (text.includes('pepper') && (text.includes('bell') || text.includes('poivron'))) ||
    text.includes('poivron') || text.includes('citron') || text.includes('lemon') ||
    text.includes('lime') || text.includes('berry') || text.includes('baie') ||
    text.includes('orange') || text.includes('fraise') || text.includes('strawberry') ||
    text.includes('champignon') || text.includes('mushroom') || text.includes('zucchini') ||
    text.includes('courgette') || text.includes('brocoli') || text.includes('broccoli')
  ) {
    return 'produce';
  }

  // 4. Dairy & Eggs
  if (
    cat.includes('dairy') || cat.includes('lait') || cat.includes('egg') ||
    cat.includes('oeuf') || cat.includes('œuf') || cat.includes('cheese') ||
    cat.includes('fromage') || text.includes('milk') || text.includes('lait') ||
    text.includes('butter') || text.includes('beurre') || text.includes('yogurt') ||
    text.includes('yaourt') || text.includes('cream') || text.includes('crème') ||
    text.includes('creme') || text.includes('mozzarella') || text.includes('cheddar') ||
    text.includes('parmesan') || text.includes('feta') || text.includes('brie') ||
    text.includes('egg') || text.includes('oeuf') || text.includes('œuf')
  ) {
    return 'dairy';
  }

  // 5. Meat & Seafood
  if (
    cat.includes('meat') || cat.includes('viande') || cat.includes('seafood') ||
    cat.includes('poisson') || cat.includes('fish') || cat.includes('poulet') ||
    cat.includes('chicken') || cat.includes('beef') || cat.includes('boeuf') ||
    cat.includes('bœuf') || cat.includes('pork') || cat.includes('porc') ||
    cat.includes('salmon') || cat.includes('saumon') || cat.includes('turkey') ||
    cat.includes('dinde') || cat.includes('tuna') || cat.includes('thon') ||
    cat.includes('shrimp') || cat.includes('crevette') || text.includes('steak') ||
    text.includes('bacon') || text.includes('sausage') || text.includes('saucisse') ||
    text.includes('jambon') || text.includes('ham') || text.includes('veal') ||
    text.includes('veau') || text.includes('lamb') || text.includes('agneau')
  ) {
    return 'meat';
  }

  // 6. Bakery
  if (
    cat.includes('bakery') || cat.includes('boulangerie') || cat.includes('pain') ||
    cat.includes('bread') || text.includes('pain') || text.includes('bread') ||
    text.includes('baguette') || text.includes('croissant') || text.includes('brioche') ||
    text.includes('tortilla') || text.includes('pita') || text.includes('bagel') ||
    text.includes('muffin') || text.includes('buns') || text.includes('toast')
  ) {
    return 'bakery';
  }

  // 7. Beverages
  if (
    cat.includes('beverage') || cat.includes('boisson') || cat.includes('drink') ||
    text.includes('coffee') || text.includes('café') || text.includes('cafe') ||
    text.includes('tea') || text.includes('thé') || text.includes('the') ||
    text.includes('juice') || text.includes('jus') || text.includes('water') ||
    text.includes('eau') || text.includes('soda') || text.includes('coke') ||
    text.includes('beer') || text.includes('bière') || text.includes('wine') ||
    text.includes('vin') || text.includes('sparkling') || text.includes('kombucha')
  ) {
    return 'beverages';
  }

  // 8. Snacks & Sweets
  if (
    cat.includes('snack') || cat.includes('sweet') || cat.includes('dessert') ||
    cat.includes('collation') || text.includes('chocolate') || text.includes('chocolat') ||
    text.includes('chips') || text.includes('cookie') || text.includes('biscuit') ||
    text.includes('candy') || text.includes('bonbon') || text.includes('nuts') ||
    text.includes('noix') || text.includes('popcorn') || text.includes('cracker')
  ) {
    return 'snacks';
  }

  // 9. Pantry & Dry Goods
  if (
    cat.includes('pantry') || cat.includes('garde-manger') || cat.includes('staple') ||
    cat.includes('grocery') || cat.includes('épicerie') || item.locationType === 'PANTRY' ||
    text.includes('pasta') || text.includes('pâte') || text.includes('pate') ||
    text.includes('spaghetti') || text.includes('macaroni') || text.includes('rice') ||
    text.includes('riz') || text.includes('flour') || text.includes('farine') ||
    text.includes('sugar') || text.includes('sucre') || text.includes('oil') ||
    text.includes('huile') || text.includes('vinegar') || text.includes('vinaigre') ||
    text.includes('sauce') || text.includes('canned') || text.includes('conserve') ||
    text.includes('bean') || text.includes('haricot') || text.includes('chickpea') ||
    text.includes('pois') || text.includes('lentil') || text.includes('lentille') ||
    text.includes('cereal') || text.includes('céréale') || text.includes('oats') ||
    text.includes('avoine') || text.includes('syrup') || text.includes('sirop') ||
    text.includes('honey') || text.includes('miel') || text.includes('bouillon') ||
    text.includes('broth') || text.includes('stock')
  ) {
    return 'pantry';
  }

  return 'other';
}

export const GroceryListView: React.FC<GroceryListViewProps> = ({
  expiringItems,
  currentUser,
  onStockItemsToKitchen,
  groceryItems,
  onUpdateGroceryItems,
  onSwitchToInventory,
}) => {
  const { lang } = useLanguage();
  const [inputName, setInputName] = useState('');
  const [inputQty, setInputQty] = useState<number | string>(1);
  const [inputUnit, setInputUnit] = useState('pcs');
  const [isStocking, setIsStocking] = useState(false);
  const [stockSuccessMessage, setStockSuccessMessage] = useState<string | null>(null);
  const [isSavedListsOpen, setIsSavedListsOpen] = useState(false);
  const [savedListsInitialTab, setSavedListsInitialTab] = useState<'saved' | 'saveCurrent'>('saved');


  // Add items from saved template/list to active grocery run
  const handleAddItemsToCurrentGrocery = (
    itemsToAdd: SavedGroceryListItem[],
    mode: 'MERGE' | 'REPLACE'
  ) => {
    if (mode === 'REPLACE') {
      const newItems: GroceryCartItem[] = itemsToAdd.map((item) => {
        const visual = getFoodVisual(item.name);
        return {
          id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: item.name,
          category: item.category || visual.badgeLabel,
          quantity: item.quantity,
          unit: item.unit,
          locationType: item.locationType || inferLocation(item.name, item.category),
          inCart: false,
          outOfStock: item.outOfStock,
        };
      });
      onUpdateGroceryItems(newItems);
    } else {
      onUpdateGroceryItems((prev) => {
        const result = [...prev];
        itemsToAdd.forEach((item) => {
          const existingIdx = result.findIndex(
            (r) => r.name.trim().toLowerCase() === item.name.trim().toLowerCase()
          );
          if (existingIdx >= 0) {
            result[existingIdx] = {
              ...result[existingIdx],
              quantity: result[existingIdx].quantity + item.quantity,
              outOfStock: item.outOfStock || result[existingIdx].outOfStock,
            };
          } else {
            const visual = getFoodVisual(item.name);
            result.unshift({
              id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              name: item.name,
              category: item.category || visual.badgeLabel,
              quantity: item.quantity,
              unit: item.unit,
              locationType: item.locationType || inferLocation(item.name, item.category),
              inCart: false,
              outOfStock: item.outOfStock,
            });
          }
        });
        return result;
      });
    }

    setStockSuccessMessage(
      lang === 'FR'
        ? `🛒 ${itemsToAdd.length} articles chargés depuis la liste sauvegardée !`
        : `🛒 Loaded ${itemsToAdd.length} items from saved list to your grocery run!`
    );
    setTimeout(() => setStockSuccessMessage(null), 3500);
  };

  const handleSaveCurrentAsList = (name: string) => {
    setStockSuccessMessage(
      lang === 'FR'
        ? `✓ Liste "${name}" enregistrée dans vos modèles !`
        : `✓ Template "${name}" saved to your Saved Lists!`
    );
    setTimeout(() => setStockSuccessMessage(null), 3500);
  };

  // Toggle single item one by one (checked / in-cart)
  const toggleCart = (id: string) => {
    onUpdateGroceryItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, inCart: !i.inCart } : i))
    );
  };

  // Remove single item from list
  const removeItem = (id: string) => {
    onUpdateGroceryItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Simple Add Item
  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;

    const visual = getFoodVisual(inputName.trim());
    const detectedLoc = inferLocation(inputName.trim(), visual.badgeLabel);

    const parsedQty = parseFloat(String(inputQty));
    const safeQty = isNaN(parsedQty) || parsedQty <= 0 ? 1 : Number(parsedQty.toFixed(3));

    const newItem: GroceryCartItem = {
      id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: inputName.trim(),
      category: visual.badgeLabel,
      quantity: safeQty,
      unit: inputUnit.trim() || 'pcs',
      locationType: detectedLoc,
      inCart: false,
    };

    onUpdateGroceryItems((prev) => [newItem, ...prev]);
    setInputName('');
    setInputQty(1);
  };

  const inCartItems = groceryItems.filter((i) => i.inCart);
  const toBuyItems = groceryItems.filter((i) => !i.inCart);

  // Ready to stock appears ONLY when all listed items are checked
  const isListFullyCompleted = groceryItems.length > 0 && toBuyItems.length === 0;

  // Direct 1-Tap stock to kitchen inventory
  const handleConfirmStockKitchen = async () => {
    if (inCartItems.length === 0) return;
    setIsStocking(true);

    try {
      const payload = inCartItems.map((item) => {
        const visual = getFoodVisual(item.name);
        const biling = getBilingualNames(item.name, lang);
        const resolvedNameFr = (item as any).nameFr || biling.nameFr;
        const resolvedNameEn = (item as any).nameEn || biling.nameEn;
        const chosenName = lang === 'FR' ? resolvedNameFr : resolvedNameEn;
        return {
          name: chosenName,
          nameFr: resolvedNameFr,
          nameEn: resolvedNameEn,
          quantity: item.quantity,
          unit: item.unit,
          locationType: item.locationType || inferLocation(item.name, item.category),
          categoryName: item.category || visual.badgeLabel,
          imageUrl: item.imageUrl && !item.imageUrl.includes('unsplash.com') ? item.imageUrl : undefined,
          notes: lang === 'FR' ? `Acheté en magasin par ${currentUser.name}` : `Purchased in-store by ${currentUser.name}`,
        };
      });

      const success = await onStockItemsToKitchen(payload);
      if (success) {
        // Remove shopped items from grocery list
        onUpdateGroceryItems([]);
        setStockSuccessMessage(
          lang === 'FR'
            ? `✓ ${payload.length} article(s) rangé(s) directement dans votre cuisine !`
            : `✓ Successfully stocked ${payload.length} item(s) directly into your kitchen!`
        );
        setTimeout(() => setStockSuccessMessage(null), 4500);
      }
    } catch (err) {
      console.error('Failed to transfer cart to kitchen:', err);
    } finally {
      setIsStocking(false);
    }
  };

  // Quick uncheck all
  const handleUncheckAll = () => {
    onUpdateGroceryItems((prev) => prev.map((i) => ({ ...i, inCart: false })));
  };

  const completionPct =
    groceryItems.length > 0
      ? Math.round((inCartItems.length / groceryItems.length) * 100)
      : 0;

  // Group and sort items by supermarket aisle category, and alphabetically within each category
  const categorizedGroceryList = useMemo(() => {
    const groups: Record<string, { aisle: AisleCategory; items: GroceryCartItem[] }> = {};

    groceryItems.forEach((item) => {
      const aisleId = getGroceryAisleId(item);
      if (!groups[aisleId]) {
        groups[aisleId] = {
          aisle: AISLE_CATEGORIES[aisleId] || AISLE_CATEGORIES.other,
          items: [],
        };
      }
      groups[aisleId].items.push(item);
    });

    // Sort items within each category alphabetically A-Z (active unchecked first, then checked)
    Object.values(groups).forEach((group) => {
      group.items.sort((a, b) => {
        // Active unchecked items first
        if (a.inCart !== b.inCart) {
          return a.inCart ? 1 : -1;
        }
        const aName = getItemDisplayName(a, lang);
        const bName = getItemDisplayName(b, lang);
        return aName.localeCompare(bName, lang === 'FR' ? 'fr' : 'en', { sensitivity: 'base' });
      });
    });

    // Return categories in supermarket aisle order
    return Object.values(groups).sort((a, b) => a.aisle.order - b.aisle.order);
  }, [groceryItems, lang]);

  return (
    <div className="space-y-3.5 pb-32 animate-fade-in">
      {/* Top Banner / Success Notice */}
      {stockSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-teal-700 text-white text-xs shadow-md flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-200 shrink-0" />
            <span className="font-semibold">{stockSuccessMessage}</span>
          </div>
          {onSwitchToInventory && (
            <button
              onClick={onSwitchToInventory}
              className="px-2.5 py-1 bg-white text-teal-900 rounded-xl font-bold text-[11px] shrink-0 hover:bg-teal-50 cursor-pointer"
            >
              {lang === 'FR' ? 'Voir la Cuisine →' : 'View Kitchen →'}
            </button>
          )}
        </div>
      )}

      {/* Header & Checklist Progress (Clean & Simple) */}
      <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border border-[#E5DFD0] shadow-2xs space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-black tracking-wider text-[#527470]">
                {lang === 'FR' ? 'Courses du Foyer' : 'Household Shopping'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-[#0D3B37] truncate">
              {lang === 'FR' ? "Liste d'Épicerie" : 'Grocery Shopping List'}
            </h2>
            <p className="text-xs text-[#527470] truncate">
              {lang === 'FR' ? 'Synchronisée en direct entre les membres' : 'Synced in real time across household members'}
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/70 text-teal-800 text-xs font-bold whitespace-nowrap">
              <Check className="w-3.5 h-3.5 text-teal-600 stroke-[3]" />
              <span>
                {inCartItems.length} / {groceryItems.length} {lang === 'FR' ? 'cochés' : 'checked'}
              </span>
            </div>
            {toBuyItems.length > 0 ? (
              <p className="text-[11px] text-[#527470] mt-0.5 whitespace-nowrap">
                {toBuyItems.length} {lang === 'FR' ? 'restants' : 'remaining'}
              </p>
            ) : groceryItems.length > 0 ? (
              <p className="text-[11px] text-emerald-700 font-bold mt-0.5 whitespace-nowrap">
                {lang === 'FR' ? '✓ Tout est coché !' : '✓ All checked!'}
              </p>
            ) : null}
          </div>
        </div>

        {/* Shopping Checklist Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#133E3B]">
            <span>{lang === 'FR' ? 'Progression des Courses' : 'Shopping Progress'}</span>
            <span className="text-teal-700">{completionPct}% {lang === 'FR' ? 'cochés' : 'checked'}</span>
          </div>
          <div className="w-full h-2 bg-[#EAE5D8] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-600 to-teal-500 transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* SAVED SHOPPING LISTS ACCESS */}
      <div className="p-2 sm:p-2.5 rounded-2xl bg-white border border-[#E5DFD0] shadow-2xs">
        <button
          type="button"
          onClick={() => {
            setSavedListsInitialTab('saved');
            setIsSavedListsOpen(true);
          }}
          className="w-full py-2 px-3 rounded-xl bg-[#F6FAF9] hover:bg-teal-50 border border-[#CDE3DF] text-[#0D3B37] text-xs font-black flex items-center justify-between gap-2 transition-all active:scale-[0.99] group text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <BookmarkCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-black truncate">
                {lang === 'FR' ? 'Listes de Courses Enregistrées' : 'Saved Shopping Lists'}
              </span>
              <span className="block text-[10px] font-medium text-[#527470] truncate">
                {lang === 'FR' ? 'Charger des essentiels, kits repas ou modèles' : 'Load weekly staples, meal kits, or templates'}
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-white group-hover:bg-teal-100 text-teal-800 border border-teal-200/80 text-[10px] font-black shrink-0 shadow-2xs">
            {lang === 'FR' ? 'Ouvrir' : 'Open'}
          </span>
        </button>
      </div>



      {/* Auto-Restock Suggestion from Expiring Kitchen Items */}
      {expiringItems.length > 0 && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="truncate">
              <strong>{expiringItems[0].name}</strong>{' '}
              {lang === 'FR' ? 'expire bientôt.' : 'is expiring soon.'}
            </span>
          </div>
          <button
            onClick={() => {
              const item = expiringItems[0];
              onUpdateGroceryItems((prev) => [
                ...prev,
                {
                  id: `g_${Date.now()}`,
                  name: item.name,
                  category: item.categoryName,
                  quantity: 1,
                  unit: item.unit,
                  locationType:
                    item.locationType === 'FREEZER'
                      ? 'FREEZER'
                      : item.locationType === 'PANTRY'
                      ? 'PANTRY'
                      : item.locationType === 'SPICE_RACK'
                      ? 'SPICE_RACK'
                      : 'FRIDGE',
                  inCart: false,
                  autoSuggested: true,
                },
              ]);
            }}
            className="px-2.5 py-1 bg-amber-200/70 hover:bg-amber-200 text-amber-900 font-bold rounded-xl text-[11px] transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> {lang === 'FR' ? 'Ajouter' : 'Add'}
          </button>
        </div>
      )}

      {/* Quick Add Form - Perfectly aligned and responsive */}
      <form
        onSubmit={addItem}
        className="p-2 sm:p-2.5 rounded-2xl bg-white border border-[#E5DFD0] shadow-2xs flex items-center gap-2"
      >
        <input
          type="text"
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          placeholder={
            lang === 'FR'
              ? 'Ajouter un article (ex. Pain, Pommes, Lait)...'
              : 'Add item (e.g. Sourdough, Apples, Milk)...'
          }
          className="flex-1 min-w-0 px-3 py-2 text-xs bg-[#FAF7EE]/60 border border-[#E5DFD0] rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 text-[#0D3B37]"
        />
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="number"
            min="0.001"
            step="any"
            value={inputQty}
            onChange={(e) => setInputQty(e.target.value)}
            onBlur={() => {
              const num = parseFloat(String(inputQty));
              if (isNaN(num) || num <= 0) {
                setInputQty(1);
              } else {
                setInputQty(Number(num.toFixed(3)));
              }
            }}
            className="w-11 sm:w-13 px-1 py-2 text-xs text-center font-bold bg-[#FAF7EE]/60 border border-[#E5DFD0] rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/30 text-[#0D3B37]"
            title={lang === 'FR' ? 'Quantité' : 'Quantity'}
          />
          <input
            type="text"
            value={inputUnit}
            onChange={(e) => setInputUnit(e.target.value)}
            placeholder={lang === 'FR' ? 'unités' : 'unit'}
            className="w-12 sm:w-14 px-1 py-2 text-xs text-center bg-[#FAF7EE]/60 border border-[#E5DFD0] rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600/30 text-[#0D3B37]"
            title={lang === 'FR' ? 'Unité (ex. pack, kg, oz)' : 'Unit (e.g. pack, lbs, oz)'}
          />
          <button
            type="submit"
            className="h-8.5 px-3 sm:px-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-1 shrink-0 transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">{lang === 'FR' ? 'Ajouter' : 'Add'}</span>
          </button>
        </div>
      </form>

      {/* Categorized Grocery List */}
      <div className="space-y-4">
        {groceryItems.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-[#E5DFD0] text-center text-[#527470] space-y-2 shadow-2xs">
            <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 mb-1" />
            <p className="text-xs font-bold text-[#0D3B37]">
              {lang === 'FR' ? 'Votre liste de courses est vide' : 'Your shopping list is empty'}
            </p>
            <p className="text-[11px] text-[#527470]">
              {lang === 'FR'
                ? 'Ajoutez des articles ci-dessus ou chargez une de vos listes sauvegardées.'
                : 'Add groceries above or pick one of your saved shopping lists.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSavedListsInitialTab('saved');
                setIsSavedListsOpen(true);
              }}
              className="mt-2 text-xs py-2 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-95"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>{lang === 'FR' ? 'Charger une Liste de Courses' : 'Load a Shopping List'}</span>
            </button>
          </div>
        ) : (
          categorizedGroceryList.map(({ aisle, items }) => {
            const AisleIcon = aisle.icon;
            const aisleName = lang === 'FR' ? aisle.nameFr : aisle.nameEn;
            const aisleCheckedCount = items.filter((i) => i.inCart).length;
            const isAisleComplete = items.length > 0 && aisleCheckedCount === items.length;

            return (
              <div key={aisle.id} className="space-y-1.5">
                {/* Category Aisle Header */}
                <div className="flex items-center justify-between px-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs shrink-0 ${aisle.iconBg}`}>
                      <AisleIcon className="w-3 h-3" />
                    </div>
                    <span className="font-extrabold text-[#0D3B37] text-xs">
                      {aisleName}
                    </span>
                    <span className="text-[11px] font-semibold text-[#527470]">
                      ({items.length})
                    </span>
                  </div>

                  {isAisleComplete && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                      <span>{lang === 'FR' ? 'Rayon terminé' : 'Aisle complete'}</span>
                    </span>
                  )}
                </div>

                {/* Items in Category (Alphabetical, Checked crossed out) */}
                <div className="rounded-2xl bg-white border border-[#E5DFD0] overflow-hidden divide-y divide-[#E5DFD0]/60 shadow-2xs">
                  {items.map((item) => {
                    const visual = getFoodVisual(item.name);

                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleCart(item.id)}
                        className={`p-3 transition-colors flex items-center justify-between gap-2.5 cursor-pointer select-none group ${
                          item.inCart
                            ? 'bg-slate-50/70 hover:bg-slate-100/70 opacity-70'
                            : 'bg-white hover:bg-[#F9FAF8]'
                        }`}
                      >
                        {/* Left: Tactile Checkbox & Visual & Name */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Checkbox */}
                          <div
                            title={
                              item.inCart
                                ? (lang === 'FR' ? 'Décocher' : 'Uncheck')
                                : (lang === 'FR' ? 'Cocher (barrer)' : 'Check off (cross out)')
                            }
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 active:scale-90 ${
                              item.inCart
                                ? 'bg-teal-700 text-white shadow-2xs'
                                : 'border-2 border-slate-300 group-hover:border-teal-600 bg-white'
                            }`}
                          >
                            {item.inCart && <Check className="w-4 h-4 stroke-[3]" />}
                          </div>

                          <div className={item.inCart ? 'opacity-50 grayscale-[40%]' : ''}>
                            <FoodVisualBadge
                              itemName={getItemDisplayName(item, lang)}
                              categoryName={item.category || visual.badgeLabel}
                              size="sm"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-xs font-bold truncate transition-all ${
                                  item.inCart
                                    ? 'line-through text-slate-400 decoration-slate-400 decoration-2'
                                    : 'text-[#0D3B37]'
                                }`}
                              >
                                {getItemDisplayName(item, lang)}
                              </span>
                              {item.outOfStock && (
                                <span
                                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border flex items-center gap-1 transition-all ${
                                    item.inCart
                                      ? 'bg-amber-50/70 border-amber-200/60 text-amber-700/60 line-through'
                                      : 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
                                  }`}
                                  title={
                                    lang === 'FR'
                                      ? 'Article épuisé dans la cuisine (Rupture de stock)'
                                      : 'Item used up in kitchen (Out of stock)'
                                  }
                                >
                                  <AlertTriangle className="w-2.5 h-2.5 stroke-[2.5]" />
                                  <span>{lang === 'FR' ? '(Rupture de stock)' : '(Out of stock)'}</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded transition-all ${
                                  item.inCart
                                    ? 'bg-slate-100 text-slate-400 line-through'
                                    : 'bg-[#EDF3EC] text-[#2C4A33]'
                                }`}
                              >
                                {formatLocalizedQuantityUnit(item.quantity, item.unit, lang)}
                              </span>
                              {item.autoSuggested && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-semibold">
                                  {lang === 'FR' ? 'Réassort' : 'Restock'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Remove Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(item.id);
                          }}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                          title={lang === 'FR' ? 'Supprimer de la liste' : 'Remove from list'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {groceryItems.length > 0 && (
          <div className="pt-2 px-1 flex items-center justify-between text-[11px] text-[#556D58]">
            <span className="font-semibold">
              {groceryItems.length}{' '}
              {lang === 'FR'
                ? (groceryItems.length === 1 ? 'article au total' : 'articles au total')
                : (groceryItems.length === 1 ? 'total item' : 'total items')}
              {' · '}
              {categorizedGroceryList.length}{' '}
              {lang === 'FR'
                ? (categorizedGroceryList.length === 1 ? 'rayon' : 'rayons')
                : (categorizedGroceryList.length === 1 ? 'category' : 'categories')}
            </span>

            {inCartItems.length > 0 && (
              <button
                type="button"
                onClick={handleUncheckAll}
                className="text-[#527470] hover:text-[#0D3B37] font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{lang === 'FR' ? 'Tout décocher' : 'Uncheck all'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* READY TO STOCK & SAVE: APPEARS ONLY WHEN ALL LISTED ITEMS ARE CHECKED */}
      {isListFullyCompleted && (
        <div className="fixed bottom-20 inset-x-0 px-4 max-w-[440px] mx-auto z-30 pointer-events-auto animate-fade-in">
          <div className="p-3.5 rounded-2xl bg-[#1E3022] text-white shadow-xl border border-emerald-500/50 backdrop-blur-md flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 flex items-center justify-center font-black shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black tracking-tight truncate text-white">
                  {lang === 'FR' ? 'Tous les articles sont cochés !' : 'All items checked off!'}
                </p>
                <p className="text-[10px] text-emerald-300 truncate">
                  {lang === 'FR' ? 'Prêt à ranger en cuisine' : 'Ready to stock in kitchen'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Save list option once completed */}
              <button
                type="button"
                onClick={() => {
                  setSavedListsInitialTab('saveCurrent');
                  setIsSavedListsOpen(true);
                }}
                title={lang === 'FR' ? 'Enregistrer cette liste comme modèle' : 'Save as list template'}
                className="py-2 px-2.5 sm:px-3 bg-white/10 hover:bg-white/20 border border-white/25 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>{lang === 'FR' ? 'Enregistrer' : 'Save'}</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmStockKitchen}
                disabled={isStocking}
                className="py-2 px-3 sm:px-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isStocking ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{lang === 'FR' ? 'Rangement...' : 'Stocking...'}</span>
                  </>
                ) : (
                  <>
                    <span>{lang === 'FR' ? 'Ranger en Cuisine' : 'Ready to Stock'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVED LISTS & REUSABLE TEMPLATES MODAL */}
      <SavedListsModal
        isOpen={isSavedListsOpen}
        onClose={() => setIsSavedListsOpen(false)}
        currentGroceryItems={groceryItems}
        onAddItemsToCurrentGrocery={handleAddItemsToCurrentGrocery}
        onSaveCurrentAsList={handleSaveCurrentAsList}
        initialTab={savedListsInitialTab}
        currentUser={currentUser}
      />
    </div>
  );
};
